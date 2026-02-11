/**
 * Auth request handlers – logic extracted from auth.route for clarity.
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { loginAttemptsMap } from "../config/redis";
import { setCsrfToken, clearCsrfToken } from "../middleware/csrf";
import { authService } from "../services/auth.service";
import { auditService } from "../services/audit.service";
import { refreshTokenService } from "../services/refresh-token.service";
import { tokenBlacklistService } from "../services/token-blacklist.service";
import { captchaService } from "../services/captcha.service";
import { passwordHistoryService } from "../services/password-history.service";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const WALLET_SCHEMA = DB_SCHEMA.WALLET!.SCHEMA;
const WALLET_TABLE = DB_SCHEMA.WALLET!.TABLE;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

function getClientIP(req: Request): string {
  return (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "unknown").trim();
}

function getDeviceInfo(req: Request): string {
  const ua = req.headers["user-agent"] || "unknown";
  if (ua.includes("Mobile")) return "Mobile";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return ua.substring(0, 50);
}

async function isAccountLocked(
  identifier: string
): Promise<{ locked: boolean; remainingTime?: number }> {
  const attempts = await loginAttemptsMap.get(identifier.toLowerCase());
  if (!attempts) return { locked: false };
  if (attempts.lockedUntil > 0 && Date.now() < attempts.lockedUntil) {
    return {
      locked: true,
      remainingTime: Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60),
    };
  }
  return { locked: false };
}

async function recordFailedAttempt(identifier: string): Promise<void> {
  const key = identifier.toLowerCase();
  const current = (await loginAttemptsMap.get(key)) || { count: 0, lockedUntil: 0 };
  current.count++;
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
  }
  await loginAttemptsMap.set(key, current, ATTEMPT_WINDOW_SECONDS);
}

async function clearFailedAttempts(identifier: string): Promise<void> {
  await loginAttemptsMap.delete(identifier.toLowerCase());
}

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  captchaToken?: string;
}

interface LoginBody {
  usernameOrEmail: string;
  password: string;
  captchaToken?: string;
}

export async function checkUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, email } = req.body;
    const errors: { username?: string; email?: string } = {};
    const randomDelay = Math.floor(Math.random() * 100) + 50;
    await new Promise((resolve) => setTimeout(resolve, randomDelay));

    if (username) {
      const usernameResult = await pool.query(
        `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(username) = LOWER($1) LIMIT 1`,
        [username.trim()]
      );
      if (usernameResult.rows.length > 0) errors.username = "Tên tài khoản đã được sử dụng";
    }
    if (email) {
      const emailResult = await pool.query(
        `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email.trim()]
      );
      if (emailResult.rows.length > 0) errors.email = "Email đã được đăng ký";
    }
    res.json(errors);
  } catch (err) {
    console.error("Check user error:", err);
    res.status(500).json({ error: "Lỗi kiểm tra tài khoản" });
  }
}

export async function captchaRequired(req: Request, res: Response): Promise<void> {
  const ip = getClientIP(req);
  res.json({
    required: await captchaService.requiresCaptcha(ip),
    siteKey: captchaService.getSiteKey(),
  });
}

export async function getCsrfToken(req: Request, res: Response): Promise<void> {
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = authService.verifyAccessToken(authHeader.substring(7));
      userId = String(decoded.userId);
    } catch {
      //
    }
  }
  const token = await setCsrfToken(res, userId);
  res.json({ csrfToken: token });
}

export async function register(req: Request, res: Response): Promise<void> {
  const ip = getClientIP(req);
  try {
    const { username, email, password, firstName, lastName, captchaToken } = req.body as RegisterBody;

    if (await captchaService.requiresCaptcha(ip)) {
      if (!captchaToken) {
        res.status(400).json({ error: "Vui lòng xác nhận CAPTCHA", requireCaptcha: true });
        return;
      }
      const captchaResult = await captchaService.verify(captchaToken, ip);
      if (!captchaResult.success) {
        await auditService.logSecurity("CAPTCHA_FAILED", req, { action: "register" });
        res.status(400).json({ error: captchaResult.error || "CAPTCHA không hợp lệ" });
        return;
      }
    }

    if (!username?.trim() || !email?.trim() || !password || !firstName?.trim() || !lastName?.trim()) {
      res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    const sanitizedUsername = username.trim().replace(/[<>'"&]/g, "");
    const sanitizedFirstName = firstName.trim().replace(/[<>'"&]/g, "");
    const sanitizedLastName = lastName.trim().replace(/[<>'"&]/g, "");

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(sanitizedUsername)) {
      res.status(400).json({
        error: "Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới (3-30 ký tự)",
        field: "username",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Email không hợp lệ" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Mật khẩu phải có ít nhất 8 ký tự" });
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      res.status(400).json({
        error: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số",
      });
      return;
    }

    const usernameCheck = await pool.query(
      `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [sanitizedUsername]
    );
    if (usernameCheck.rows.length > 0) {
      res.status(409).json({ error: "Tên tài khoản đã được sử dụng", field: "username" });
      return;
    }
    const emailCheck = await pool.query(
      `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    if (emailCheck.rows.length > 0) {
      res.status(409).json({ error: "Email đã được đăng ký", field: "email" });
      return;
    }

    const passwordHash = await authService.hashPassword(password);
    const result = await pool.query(
      `INSERT INTO ${ACCOUNT_TABLE}
        (username, email, password_hash, first_name, last_name, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, username, email, first_name, last_name, created_at`,
      [sanitizedUsername, email.trim().toLowerCase(), passwordHash, sanitizedFirstName, sanitizedLastName]
    );
    const newUser = result.rows[0];
    await passwordHistoryService.initializeHistory(newUser.id, passwordHash);
    await auditService.logAuth("REGISTER", newUser.id, req, {
      username: newUser.username,
      email: newUser.email,
    });
    await captchaService.clearFailedAttempts(ip);

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Lỗi đăng ký tài khoản" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const ip = getClientIP(req);
  try {
    const { usernameOrEmail, password, captchaToken } = req.body as LoginBody;
    if (!usernameOrEmail?.trim() || !password) {
      res.status(400).json({ error: "Vui lòng nhập tài khoản và mật khẩu" });
      return;
    }
    const identifier = usernameOrEmail.trim();

    if (await captchaService.requiresCaptcha(ip)) {
      if (!captchaToken) {
        res.status(400).json({
          error: "Vui lòng xác nhận CAPTCHA",
          requireCaptcha: true,
          siteKey: captchaService.getSiteKey(),
        });
        return;
      }
      const captchaResult = await captchaService.verify(captchaToken, ip);
      if (!captchaResult.success) {
        await auditService.logSecurity("CAPTCHA_FAILED", req, { identifier });
        res.status(400).json({ error: captchaResult.error || "CAPTCHA không hợp lệ" });
        return;
      }
    }

    const lockStatus = await isAccountLocked(identifier);
    if (lockStatus.locked) {
      await auditService.logAuth("LOGIN_FAILED", null, req, { identifier, reason: "account_locked" }, "failed");
      res.status(429).json({
        error: `Tài khoản tạm khóa. Vui lòng thử lại sau ${lockStatus.remainingTime} phút.`,
        lockedMinutes: lockStatus.remainingTime,
      });
      return;
    }

    const result = await pool.query(
      `SELECT a.id, a.username, a.email, a.password_hash, a.first_name, a.last_name, a.is_active, a.created_at,
              COALESCE(w.balance, 0) as balance
       FROM ${ACCOUNT_TABLE} a
       LEFT JOIN ${WALLET_SCHEMA}.${WALLET_TABLE} w ON w.account_id = a.id
       WHERE LOWER(a.username) = LOWER($1) OR LOWER(a.email) = LOWER($1)
       LIMIT 1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      await recordFailedAttempt(identifier);
      await captchaService.recordFailedAttempt(ip);
      await auditService.logAuth("LOGIN_FAILED", null, req, { identifier, reason: "user_not_found" }, "failed");
      res.status(401).json({
        error: "Tài khoản hoặc mật khẩu không đúng",
        requireCaptcha: await captchaService.requiresCaptcha(ip),
      });
      return;
    }

    const user = result.rows[0];
    if (!user.is_active) {
      await auditService.logAuth("LOGIN_FAILED", user.id, req, { reason: "account_disabled" }, "failed");
      res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa" });
      return;
    }

    const isValidPassword = await authService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await recordFailedAttempt(identifier);
      await captchaService.recordFailedAttempt(ip);
      await auditService.logAuth("LOGIN_FAILED", user.id, req, { reason: "wrong_password" }, "failed");
      const newLockStatus = await isAccountLocked(identifier);
      if (newLockStatus.locked) {
        await auditService.logAuth("ACCOUNT_LOCKED", user.id, req, {
          lockedMinutes: newLockStatus.remainingTime,
        });
        res.status(429).json({
          error: `Tài khoản tạm khóa. Vui lòng thử lại sau ${newLockStatus.remainingTime} phút.`,
          lockedMinutes: newLockStatus.remainingTime,
        });
        return;
      }
      res.status(401).json({
        error: "Tài khoản hoặc mật khẩu không đúng",
        requireCaptcha: await captchaService.requiresCaptcha(ip),
      });
      return;
    }

    await clearFailedAttempts(identifier);
    await captchaService.clearFailedAttempts(ip);

    const accessToken = authService.generateAccessToken({
      userId: String(user.id),
      email: user.email,
    });
    const refreshToken = await refreshTokenService.createToken({
      userId: user.id,
      deviceInfo: getDeviceInfo(req),
      ipAddress: ip,
    });
    await auditService.logAuth("LOGIN_SUCCESS", user.id, req, { device: getDeviceInfo(req) });
    const csrfToken = await setCsrfToken(res, String(user.id));

    res.json({
      message: "Đăng nhập thành công",
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at,
        balance: parseFloat(user.balance) || 0,
      },
      accessToken,
      refreshToken,
      csrfToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Lỗi đăng nhập" });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = req.body.refreshToken;
    if (authHeader?.startsWith("Bearer ")) {
      await tokenBlacklistService.blacklist(authHeader.substring(7), 15 * 60);
    }
    if (refreshToken) {
      await refreshTokenService.revokeToken(refreshToken);
    }
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = authService.verifyAccessToken(authHeader.substring(7));
        userId = decoded.userId;
      } catch {
        //
      }
    }
    await auditService.logAuth("LOGOUT", userId, req);
    clearCsrfToken(res);
    res.json({ message: "Đăng xuất thành công", success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Lỗi đăng xuất" });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token là bắt buộc" });
      return;
    }
    const tokenData = await refreshTokenService.validateToken(refreshToken);
    if (!tokenData) {
      res.status(401).json({ error: "Refresh token không hợp lệ hoặc đã hết hạn" });
      return;
    }
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, is_active
       FROM ${ACCOUNT_TABLE} WHERE id = $1 LIMIT 1`,
      [tokenData.userId]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Người dùng không tồn tại" });
      return;
    }
    const user = result.rows[0];
    if (!user.is_active) {
      res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa" });
      return;
    }
    const newRefreshToken = await refreshTokenService.rotateToken(refreshToken, {
      userId: user.id,
      deviceInfo: getDeviceInfo(req),
      ipAddress: getClientIP(req),
    });
    if (!newRefreshToken) {
      res.status(401).json({ error: "Không thể làm mới token" });
      return;
    }
    const newAccessToken = authService.generateAccessToken({
      userId: String(user.id),
      email: user.email,
    });
    await auditService.logAuth("TOKEN_REFRESH", user.id, req);
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(401).json({ error: "Token không hợp lệ" });
  }
}

export async function getSessions(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.substring(7);
    if (await tokenBlacklistService.isBlacklisted(token)) {
      res.status(401).json({ error: "Token đã bị vô hiệu hóa" });
      return;
    }
    const decoded = authService.verifyAccessToken(token);
    const sessions = await refreshTokenService.getUserSessions(decoded.userId);
    res.json({ sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}

export async function revokeSession(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);
    const sessionId = parseInt(req.params.sessionId ?? "", 10);
    const sessions = await refreshTokenService.getUserSessions(decoded.userId as string);
    if (!sessions.some((s) => s.id === sessionId)) {
      res.status(403).json({ error: "Không có quyền xóa phiên này" });
      return;
    }
    await refreshTokenService.revokeTokenById(sessionId);
    res.json({ message: "Đã xóa phiên đăng nhập", success: true });
  } catch (err) {
    console.error("Revoke session error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);
    const revokedCount = await refreshTokenService.revokeAllUserTokens(decoded.userId);
    await tokenBlacklistService.blacklist(token, 15 * 60);
    await auditService.logAuth("LOGOUT", decoded.userId, req, {
      type: "logout_all",
      revokedSessions: revokedCount,
    });
    res.json({
      message: "Đã đăng xuất khỏi tất cả thiết bị",
      success: true,
      revokedSessions: revokedCount,
    });
  } catch (err) {
    console.error("Logout all error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}
