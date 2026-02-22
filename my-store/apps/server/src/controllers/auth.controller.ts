/**
 * Auth request handlers – logic extracted from auth.route for clarity.
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { getRegistrationCycleBounds } from "../config/tier-cycle.config";
import { loginAttemptsMap } from "../config/redis";
import { setCsrfToken, clearCsrfToken } from "../middleware/csrf";
import { authService } from "../services/auth.service";
import { auditService } from "../services/audit.service";
import { refreshTokenService } from "../services/refresh-token.service";
import { tokenBlacklistService } from "../services/token-blacklist.service";
import { captchaService } from "../services/captcha.service";
import { passwordHistoryService } from "../services/password-history.service";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const PROFILE_TABLE = `${DB_SCHEMA.CUSTOMER_PROFILES!.SCHEMA}.${DB_SCHEMA.CUSTOMER_PROFILES!.TABLE}`;
const COLS_PROFILE = DB_SCHEMA.CUSTOMER_PROFILES!.COLS as {
  ACCOUNT_ID: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  DATE_OF_BIRTH: string;
  CREATED_AT: string;
  UPDATED_AT: string;
};
const WALLET_SCHEMA = DB_SCHEMA.WALLET!.SCHEMA;
const WALLET_TABLE = DB_SCHEMA.WALLET!.TABLE;
const TYPE_HISTORY_TABLE = `${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.SCHEMA}.${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.TABLE}`;
const CH = DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.COLS;
// Tier 1: 3 sai → khóa 5 phút. Tier 2: 3 sai nữa → khóa 10 phút.
const TIER1_ATTEMPTS = 3;
const TIER1_LOCK_SECONDS = 5 * 60;
const TIER2_ATTEMPTS = 3; // thêm 3 lần sau khi unlock tier 1
const TIER2_LOCK_SECONDS = 10 * 60;
const ATTEMPT_WINDOW_SECONDS = 30 * 60; // TTL lưu trữ

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

/** Ghi nhận sai mật khẩu. Trả về { nowLocked, lockedMinutes, remainingAttempts } */
async function recordFailedAttempt(
  identifier: string,
  userId: string | number
): Promise<{ nowLocked: boolean; lockedMinutes?: number; remainingAttempts: number }> {
  const key = identifier.toLowerCase();
  const current: { count: number; lockedUntil: number; tier: number } =
    ((await loginAttemptsMap.get(key)) as any) ?? { count: 0, lockedUntil: 0, tier: 1 };

  // Nếu đang bị khóa, không tăng thêm
  if (current.lockedUntil > 0 && Date.now() < current.lockedUntil) {
    return { nowLocked: true, lockedMinutes: Math.ceil((current.lockedUntil - Date.now()) / 1000 / 60), remainingAttempts: 0 };
  }

  // Nếu vừa hết khóa tier1, reset count nhưng nâng lên tier 2
  if (current.lockedUntil > 0 && Date.now() >= current.lockedUntil) {
    current.count = 0;
    current.lockedUntil = 0;
    current.tier = 2;
  }

  current.count++;
  const tier = current.tier || 1;
  const maxAttempts = tier === 1 ? TIER1_ATTEMPTS : TIER2_ATTEMPTS;
  const lockSeconds = tier === 1 ? TIER1_LOCK_SECONDS : TIER2_LOCK_SECONDS;

  if (current.count >= maxAttempts) {
    current.lockedUntil = Date.now() + lockSeconds * 1000;
    await loginAttemptsMap.set(key, current, ATTEMPT_WINDOW_SECONDS);
    const lockedMinutes = Math.ceil(lockSeconds / 60);

    // Ghi vào DB: cập nhật suspended_until + ban_reason + updated_at
    const suspendedUntil = new Date(current.lockedUntil);
    await pool.query(
      `UPDATE ${ACCOUNT_TABLE}
       SET suspended_until = $1, ban_reason = $2, updated_at = NOW()
       WHERE id = $3`,
      [suspendedUntil, `Sô sai mật khẩu quá ${maxAttempts} lần (tự động)`, userId]
    );

    return { nowLocked: true, lockedMinutes, remainingAttempts: 0 };
  }

  await loginAttemptsMap.set(key, current, ATTEMPT_WINDOW_SECONDS);
  const remainingAttempts = maxAttempts - current.count;
  return { nowLocked: false, remainingAttempts };
}

/** Xóa các lần sai và clear suspended_until nếu đã hết hạn (cả admin lẫn auto-lock) */
async function clearFailedAttempts(identifier: string, userId: string | number): Promise<void> {
  await loginAttemptsMap.delete(identifier.toLowerCase());
  // Clear suspended_until nếu thời hạn đã qua — áp dụng với mọi loại khóa có thời hạn
  await pool.query(
    `UPDATE ${ACCOUNT_TABLE}
     SET suspended_until = NULL, ban_reason = NULL, updated_at = NOW()
     WHERE id = $1
       AND suspended_until IS NOT NULL
       AND suspended_until <= NOW()`,
    [userId]
  );
}


interface RegisterBody {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Ngày sinh (customer_profiles.date_of_birth), YYYY-MM-DD, tùy chọn */
  dateOfBirth?: string;
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

export { captchaRequired, getCsrfToken } from "./token.controller";
export { refresh } from "./token.controller";
export { getSessions, revokeSession, logoutAll } from "./session.controller";


export async function register(req: Request, res: Response): Promise<void> {
  const ip = getClientIP(req);
  try {
    const { username, email, password, firstName, lastName, dateOfBirth, captchaToken } = req.body as RegisterBody;

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
        (username, email, password_hash, is_active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING id, username, email, created_at`,
      [sanitizedUsername, email.trim().toLowerCase(), passwordHash]
    );
    const newUser = result.rows[0];
    await passwordHistoryService.initializeHistory(newUser.id, passwordHash);

    const birthDate = dateOfBirth?.trim();
    const birthDateValid =
      birthDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
      !Number.isNaN(new Date(birthDate).getTime());
    await pool.query(
      `INSERT INTO ${PROFILE_TABLE} (${COLS_PROFILE.ACCOUNT_ID}, ${COLS_PROFILE.FIRST_NAME}, ${COLS_PROFILE.LAST_NAME}, ${COLS_PROFILE.DATE_OF_BIRTH}, ${COLS_PROFILE.CREATED_AT}, ${COLS_PROFILE.UPDATED_AT})
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [newUser.id, sanitizedFirstName, sanitizedLastName, birthDateValid ? birthDate : null]
    );

    // Insert initial customer_type_history record
    // period_start = ngày đăng ký, period_end = cuối chu kỳ hiện tại (lấy từ config)
    const { periodStart, periodEnd } = getRegistrationCycleBounds();
    await pool.query(
      `INSERT INTO ${TYPE_HISTORY_TABLE}
        (${CH.ACCOUNT_ID}, ${CH.PERIOD_START}, ${CH.PERIOD_END}, ${CH.PREVIOUS_TYPE}, ${CH.NEW_TYPE}, ${CH.TOTAL_SPEND}, ${CH.EVALUATED_AT})
       VALUES ($1, $2, $3, NULL, 'Member', 0, NOW())`,
      [newUser.id, periodStart, periodEnd]
    );

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
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
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

    // Step 1: Check if username exists (by username only)
    const usernameCheck = await pool.query(
      `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [identifier]
    );

    if (usernameCheck.rows.length === 0) {
      // username không tồn tại → không có userId, không cần ghi DB
      await recordFailedAttempt(identifier, 0);
      await captchaService.recordFailedAttempt(ip);
      await auditService.logAuth("LOGIN_FAILED", null, req, { identifier, reason: "user_not_found" }, "failed");
      res.status(401).json({
        error: "Tài khoản không tồn tại, vui lòng đăng kí mới",
        requireCaptcha: await captchaService.requiresCaptcha(ip),
      });
      return;
    }

    // Step 2: Get full user data for password verification
    const result = await pool.query(
      `SELECT a.id, a.username, a.email, a.password_hash, a.is_active,
              a.suspended_until, a.ban_reason, a.created_at,
              cp.first_name, cp.last_name,
              COALESCE(w.balance, 0) as balance
       FROM ${ACCOUNT_TABLE} a
       LEFT JOIN ${PROFILE_TABLE} cp ON cp.account_id = a.id
       LEFT JOIN ${WALLET_SCHEMA}.${WALLET_TABLE} w ON w.account_id = a.id
       WHERE LOWER(a.username) = LOWER($1)
       LIMIT 1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      await recordFailedAttempt(identifier, 0);
      await captchaService.recordFailedAttempt(ip);
      await auditService.logAuth("LOGIN_FAILED", null, req, { identifier, reason: "user_not_found" }, "failed");
      res.status(401).json({
        error: "Tài khoản không tồn tại",
        requireCaptcha: await captchaService.requiresCaptcha(ip),
      });
      return;
    }


    const user = result.rows[0];

    // Check vô hiệu hóa vĩnh viễn
    if (!user.is_active) {
      await auditService.logAuth("LOGIN_FAILED", user.id, req, { reason: "account_disabled" }, "failed");
      res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa" });
      return;
    }

    // Check tạm khóa thủ công bởi admin
    if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
      const suspendedUntil = new Date(user.suspended_until);
      const remaining = Math.ceil((suspendedUntil.getTime() - Date.now()) / 1000 / 60);
      await auditService.logAuth("LOGIN_FAILED", user.id, req, { reason: "account_suspended" }, "failed");
      res.status(403).json({
        error: `Tài khoản bị tạm khóa${user.ban_reason ? `: ${user.ban_reason}` : ""}. Vui lòng thử lại sau ${remaining} phút.`,
        suspendedUntil: suspendedUntil.toISOString(),
        banReason: user.ban_reason ?? null,
      });
      return;
    }

    const isValidPassword = await authService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      const failResult = await recordFailedAttempt(identifier, user.id);
      await captchaService.recordFailedAttempt(ip);
      await auditService.logAuth("LOGIN_FAILED", user.id, req, { reason: "wrong_password" }, "failed");

      if (failResult.nowLocked) {
        await auditService.logAuth("ACCOUNT_LOCKED", user.id, req, {
          lockedMinutes: failResult.lockedMinutes,
        });
        res.status(429).json({
          error: `Tài khoản tạm khóa. Vui lòng thử lại sau ${failResult.lockedMinutes} phút.`,
          lockedMinutes: failResult.lockedMinutes,
        });
        return;
      }

      res.status(401).json({
        error: `Mật khẩu sai. Sai quá ${failResult.remainingAttempts} lần nữa sẽ tạm khóa.`,
        remainingAttempts: failResult.remainingAttempts,
        requireCaptcha: await captchaService.requiresCaptcha(ip),
      });
      return;
    }

    await clearFailedAttempts(identifier, user.id);
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


