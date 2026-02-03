import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../config/database";
import { authService } from "../services/auth.service";
import { auditService } from "../services/audit.service";
import { refreshTokenService } from "../services/refresh-token.service";
import { tokenBlacklistService } from "../services/token-blacklist.service";
import { captchaService } from "../services/captcha.service";
import { DB_SCHEMA } from "../config/db.config";
import { authLimiter, checkUserLimiter } from "../middleware/rateLimiter";
import { setCsrfToken, clearCsrfToken } from "../middleware/csrf";
import { passwordHistoryService } from "../services/password-history.service";

const router = Router();

import { loginAttemptsMap } from "../config/redis";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT.SCHEMA}.${DB_SCHEMA.ACCOUNT.TABLE}`;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes
const ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 minutes

/**
 * Get client IP from request
 */
const getClientIP = (req: Request): string => {
  return (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "unknown").trim();
};

/**
 * Get device info from user agent
 */
const getDeviceInfo = (req: Request): string => {
  const ua = req.headers["user-agent"] || "unknown";
  // Simple parsing - can use ua-parser-js for more detailed info
  if (ua.includes("Mobile")) return "Mobile";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return ua.substring(0, 50);
};

/**
 * Check if account is locked due to too many failed attempts
 * Uses Redis when available, falls back to in-memory
 */
const isAccountLocked = async (identifier: string): Promise<{ locked: boolean; remainingTime?: number }> => {
  const attempts = await loginAttemptsMap.get(identifier.toLowerCase());
  if (!attempts) return { locked: false };

  if (attempts.lockedUntil > 0 && Date.now() < attempts.lockedUntil) {
    return { 
      locked: true, 
      remainingTime: Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60) 
    };
  }

  return { locked: false };
};

/**
 * Record a failed login attempt
 * Uses Redis when available, falls back to in-memory
 */
const recordFailedAttempt = async (identifier: string): Promise<void> => {
  const key = identifier.toLowerCase();
  const current = await loginAttemptsMap.get(key) || { count: 0, lockedUntil: 0 };
  
  current.count++;

  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
  }

  await loginAttemptsMap.set(key, current, ATTEMPT_WINDOW_SECONDS);
};

/**
 * Clear failed attempts on successful login
 */
const clearFailedAttempts = async (identifier: string): Promise<void> => {
  await loginAttemptsMap.delete(identifier.toLowerCase());
};

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

/**
 * Check if username or email already exists
 * POST /api/auth/check-user
 * 
 * SECURITY NOTE: This endpoint enables user enumeration by design (for UX during registration).
 * Mitigations applied:
 * - Rate limiting (checkUserLimiter)
 * - Random delay to prevent timing attacks
 * - CAPTCHA required after multiple requests (via checkUserLimiter)
 */
router.post("/check-user", checkUserLimiter, async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;
    const errors: { username?: string; email?: string } = {};

    // SECURITY: Add random delay to prevent timing-based enumeration
    const randomDelay = Math.floor(Math.random() * 100) + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    if (username) {
      const usernameResult = await pool.query(
        `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(username) = LOWER($1) LIMIT 1`,
        [username.trim()]
      );
      if (usernameResult.rows.length > 0) {
        errors.username = "Tên tài khoản đã được sử dụng";
      }
    }

    if (email) {
      const emailResult = await pool.query(
        `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email.trim()]
      );
      if (emailResult.rows.length > 0) {
        errors.email = "Email đã được đăng ký";
      }
    }

    res.json(errors);
  } catch (err) {
    console.error("Check user error:", err);
    res.status(500).json({ error: "Lỗi kiểm tra tài khoản" });
  }
});

/**
 * Check if CAPTCHA is required for login
 * GET /api/auth/captcha-required
 */
router.get("/captcha-required", async (req: Request, res: Response) => {
  const ip = getClientIP(req);
  res.json({
    required: await captchaService.requiresCaptcha(ip),
    siteKey: captchaService.getSiteKey(),
  });
});

/**
 * Get CSRF token
 * GET /api/auth/csrf-token
 * 
 * Returns a CSRF token for use in subsequent POST/PUT/DELETE requests.
 * Token is also set in a cookie for double-submit validation.
 */
router.get("/csrf-token", async (req: Request, res: Response) => {
  // Get user ID from auth header if present
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = authService.verifyAccessToken(authHeader.substring(7));
      userId = String(decoded.userId);
    } catch {
      // Token invalid or expired, generate anonymous CSRF token
    }
  }

  const token = await setCsrfToken(res, userId);
  res.json({ csrfToken: token });
});

/**
 * Register new user
 * POST /api/auth/register
 */
router.post("/register", authLimiter, async (req: Request, res: Response) => {
  const ip = getClientIP(req);
  
  try {
    const { username, email, password, firstName, lastName, captchaToken } = req.body as RegisterBody;

    // Check CAPTCHA if required
    if (await captchaService.requiresCaptcha(ip)) {
      if (!captchaToken) {
        return res.status(400).json({ error: "Vui lòng xác nhận CAPTCHA", requireCaptcha: true });
      }
      const captchaResult = await captchaService.verify(captchaToken, ip);
      if (!captchaResult.success) {
        await auditService.logSecurity("CAPTCHA_FAILED", req, { action: "register" });
        return res.status(400).json({ error: captchaResult.error || "CAPTCHA không hợp lệ" });
      }
    }

    // Validate required fields
    if (!username?.trim() || !email?.trim() || !password || !firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().replace(/[<>'"&]/g, '');
    const sanitizedFirstName = firstName.trim().replace(/[<>'"&]/g, '');
    const sanitizedLastName = lastName.trim().replace(/[<>'"&]/g, '');

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(sanitizedUsername)) {
      return res.status(400).json({ 
        error: "Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới (3-30 ký tự)",
        field: "username"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email không hợp lệ" });
    }

    // Strong password policy
    if (password.length < 8) {
      return res.status(400).json({ error: "Mật khẩu phải có ít nhất 8 ký tự" });
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số" 
      });
    }

    // Check if username exists
    const usernameCheck = await pool.query(
      `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [sanitizedUsername]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({ error: "Tên tài khoản đã được sử dụng", field: "username" });
    }

    // Check if email exists
    const emailCheck = await pool.query(
      `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: "Email đã được đăng ký", field: "email" });
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO ${ACCOUNT_TABLE} 
        (username, email, password_hash, first_name, last_name, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, username, email, first_name, last_name, created_at`,
      [sanitizedUsername, email.trim().toLowerCase(), passwordHash, sanitizedFirstName, sanitizedLastName]
    );

    const newUser = result.rows[0];

    // Initialize password history with the initial password
    await passwordHistoryService.initializeHistory(newUser.id, passwordHash);

    // Audit log
    await auditService.logAuth("REGISTER", newUser.id, req, {
      username: newUser.username,
      email: newUser.email,
    });

    // Clear CAPTCHA requirement on successful registration
    await captchaService.clearFailedAttempts(ip);

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Lỗi đăng ký tài khoản" });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post("/login", authLimiter, async (req: Request, res: Response) => {
  const ip = getClientIP(req);
  
  try {
    const { usernameOrEmail, password, captchaToken } = req.body as LoginBody;

    if (!usernameOrEmail?.trim() || !password) {
      return res.status(400).json({ error: "Vui lòng nhập tài khoản và mật khẩu" });
    }

    const identifier = usernameOrEmail.trim();

    // Check CAPTCHA if required
    if (await captchaService.requiresCaptcha(ip)) {
      if (!captchaToken) {
        return res.status(400).json({ 
          error: "Vui lòng xác nhận CAPTCHA", 
          requireCaptcha: true,
          siteKey: captchaService.getSiteKey()
        });
      }
      const captchaResult = await captchaService.verify(captchaToken, ip);
      if (!captchaResult.success) {
        await auditService.logSecurity("CAPTCHA_FAILED", req, { identifier });
        return res.status(400).json({ error: captchaResult.error || "CAPTCHA không hợp lệ" });
      }
    }

    // Check account lockout
    const lockStatus = await isAccountLocked(identifier);
    if (lockStatus.locked) {
      await auditService.logAuth("LOGIN_FAILED", null, req, { 
        identifier, 
        reason: "account_locked" 
      }, "failed");
      
      return res.status(429).json({ 
        error: `Tài khoản tạm khóa. Vui lòng thử lại sau ${lockStatus.remainingTime} phút.`,
        lockedMinutes: lockStatus.remainingTime
      });
    }

    // Find user with wallet balance
    const result = await pool.query(
      `SELECT a.id, a.username, a.email, a.password_hash, a.first_name, a.last_name, a.is_active, a.created_at,
              COALESCE(w.balance, 0) as balance
       FROM ${ACCOUNT_TABLE} a
       LEFT JOIN ${DB_SCHEMA.WALLET.SCHEMA}.${DB_SCHEMA.WALLET.TABLE} w ON w.account_id = a.id
       WHERE LOWER(a.username) = LOWER($1) OR LOWER(a.email) = LOWER($1)
       LIMIT 1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      await recordFailedAttempt(identifier);
      await captchaService.recordFailedAttempt(ip);
      
      await auditService.logAuth("LOGIN_FAILED", null, req, { 
        identifier, 
        reason: "user_not_found" 
      }, "failed");
      
      return res.status(401).json({ 
        error: "Tài khoản hoặc mật khẩu không đúng",
        requireCaptcha: await captchaService.requiresCaptcha(ip),
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      await auditService.logAuth("LOGIN_FAILED", user.id, req, { reason: "account_disabled" }, "failed");
      return res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa" });
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await recordFailedAttempt(identifier);
      await captchaService.recordFailedAttempt(ip);
      
      await auditService.logAuth("LOGIN_FAILED", user.id, req, { reason: "wrong_password" }, "failed");
      
      const newLockStatus = await isAccountLocked(identifier);
      if (newLockStatus.locked) {
        await auditService.logAuth("ACCOUNT_LOCKED", user.id, req, { 
          lockedMinutes: newLockStatus.remainingTime 
        });
        
        return res.status(429).json({ 
          error: `Tài khoản tạm khóa. Vui lòng thử lại sau ${newLockStatus.remainingTime} phút.`,
          lockedMinutes: newLockStatus.remainingTime
        });
      }
      
      return res.status(401).json({ 
        error: "Tài khoản hoặc mật khẩu không đúng",
        requireCaptcha: await captchaService.requiresCaptcha(ip),
      });
    }

    // Clear failed attempts
    await clearFailedAttempts(identifier);
    await captchaService.clearFailedAttempts(ip);

    // Generate access token
    const accessToken = authService.generateAccessToken({
      userId: String(user.id),
      email: user.email,
    });

    // Create refresh token in database
    const refreshToken = await refreshTokenService.createToken({
      userId: user.id,
      deviceInfo: getDeviceInfo(req),
      ipAddress: ip,
    });

    // Audit log
    await auditService.logAuth("LOGIN_SUCCESS", user.id, req, {
      device: getDeviceInfo(req),
    });

    // Set CSRF token for subsequent requests
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
});

/**
 * Logout user
 * POST /api/auth/logout
 * SECURITY: Rate limited to prevent DoS
 */
router.post("/logout", authLimiter, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = req.body.refreshToken;

    // Blacklist access token if provided
    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.substring(7);
      // Blacklist for 15 minutes (access token lifetime)
      await tokenBlacklistService.blacklist(accessToken, 15 * 60);
    }

    // Revoke refresh token if provided
    if (refreshToken) {
      await refreshTokenService.revokeToken(refreshToken);
    }

    // Get user ID for audit log (from token if available)
    let userId = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = authService.verifyAccessToken(authHeader.substring(7));
        userId = decoded.userId;
      } catch {
        // Token might be invalid, that's ok
      }
    }

    await auditService.logAuth("LOGOUT", userId, req);

    // Clear CSRF token on logout
    clearCsrfToken(res);

    res.json({ message: "Đăng xuất thành công", success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Lỗi đăng xuất" });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 * SECURITY: Rate limited to prevent token refresh abuse
 */
router.post("/refresh", authLimiter, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token là bắt buộc" });
    }

    // Validate refresh token from database
    const tokenData = await refreshTokenService.validateToken(refreshToken);
    if (!tokenData) {
      return res.status(401).json({ error: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    // Get user from database
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, is_active
       FROM ${ACCOUNT_TABLE}
       WHERE id = $1
       LIMIT 1`,
      [tokenData.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Người dùng không tồn tại" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa" });
    }

    // Rotate refresh token (revoke old, create new)
    const newRefreshToken = await refreshTokenService.rotateToken(refreshToken, {
      userId: user.id,
      deviceInfo: getDeviceInfo(req),
      ipAddress: getClientIP(req),
    });

    if (!newRefreshToken) {
      return res.status(401).json({ error: "Không thể làm mới token" });
    }

    // Generate new access token
    const newAccessToken = authService.generateAccessToken({
      userId: String(user.id),
      email: user.email,
    });

    // Audit log
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
});

/**
 * Get user's active sessions
 * GET /api/auth/sessions
 */
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    if (await tokenBlacklistService.isBlacklisted(token)) {
      return res.status(401).json({ error: "Token đã bị vô hiệu hóa" });
    }

    const decoded = authService.verifyAccessToken(token);
    const sessions = await refreshTokenService.getUserSessions(decoded.userId);

    res.json({ sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

/**
 * Revoke a specific session
 * DELETE /api/auth/sessions/:sessionId
 */
router.delete("/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);
    const sessionId = parseInt(req.params.sessionId);

    // Verify the session belongs to the user
    const sessions = await refreshTokenService.getUserSessions(decoded.userId);
    const sessionBelongsToUser = sessions.some(s => s.id === sessionId);

    if (!sessionBelongsToUser) {
      return res.status(403).json({ error: "Không có quyền xóa phiên này" });
    }

    await refreshTokenService.revokeTokenById(sessionId);

    res.json({ message: "Đã xóa phiên đăng nhập", success: true });
  } catch (err) {
    console.error("Revoke session error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
router.post("/logout-all", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);

    // Revoke all refresh tokens
    const revokedCount = await refreshTokenService.revokeAllUserTokens(decoded.userId);

    // Blacklist current access token
    await tokenBlacklistService.blacklist(token, 15 * 60);

    // Audit log
    await auditService.logAuth("LOGOUT", decoded.userId, req, { 
      type: "logout_all",
      revokedSessions: revokedCount 
    });

    res.json({ 
      message: "Đã đăng xuất khỏi tất cả thiết bị", 
      success: true,
      revokedSessions: revokedCount 
    });
  } catch (err) {
    console.error("Logout all error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
