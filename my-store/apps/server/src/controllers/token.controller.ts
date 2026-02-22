/**
 * Token Controller
 * Handles token refresh, CSRF token generation, and CAPTCHA requirements.
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { authService } from "../services/auth.service";
import { refreshTokenService } from "../services/refresh-token.service";
import { captchaService } from "../services/captcha.service";
import { auditService } from "../services/audit.service";
import { setCsrfToken } from "../middleware/csrf";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const PROFILE_TABLE = `${DB_SCHEMA.CUSTOMER_PROFILES!.SCHEMA}.${DB_SCHEMA.CUSTOMER_PROFILES!.TABLE}`;

function getClientIP(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
}

function getDeviceInfo(req: Request): string {
  const ua = req.headers["user-agent"] || "unknown";
  if (ua.length > 200) return ua.substring(0, 200);
  return ua;
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
      `SELECT a.id, a.username, a.email, a.is_active,
              cp.first_name, cp.last_name
       FROM ${ACCOUNT_TABLE} a
       LEFT JOIN ${PROFILE_TABLE} cp ON cp.account_id = a.id
       WHERE a.id = $1 LIMIT 1`,
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
