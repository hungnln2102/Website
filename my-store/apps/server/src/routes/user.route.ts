/**
 * Protected User Routes
 * All routes require authentication
 */

import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../config/database";
import { requireAuth, alwaysRequireCaptcha } from "../middleware/apiSecurity";
import { auditService } from "../services/audit.service";
import { authService } from "../services/auth.service";
import { refreshTokenService } from "../services/refresh-token.service";
import { passwordHistoryService } from "../services/password-history.service";
import { DB_SCHEMA } from "../config/db.config";
import { veryStrictLimiter } from "../middleware/rateLimiter";

const router = Router();
const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT.SCHEMA}.${DB_SCHEMA.ACCOUNT.TABLE}`;

// All routes in this file require authentication
router.use(requireAuth);

/**
 * Get current user profile
 * GET /api/user/profile
 */
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    const result = await pool.query(
      `SELECT a.id, a.username, a.email, a.first_name, a.last_name, a.created_at,
              COALESCE(w.balance, 0) as balance
       FROM ${ACCOUNT_TABLE} a
       LEFT JOIN ${DB_SCHEMA.WALLET.SCHEMA}.${DB_SCHEMA.WALLET.TABLE} w ON w.account_id = a.id
       WHERE a.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
      balance: parseInt(user.balance) || 0,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Lỗi lấy thông tin tài khoản" });
  }
});

/**
 * Update user profile
 * PUT /api/user/profile
 */
router.put("/profile", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { firstName, lastName } = req.body;

    // Validate input
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ họ tên" });
    }

    // Sanitize inputs
    const sanitizedFirstName = firstName.trim().replace(/[<>'"&]/g, "");
    const sanitizedLastName = lastName.trim().replace(/[<>'"&]/g, "");

    await pool.query(
      `UPDATE ${ACCOUNT_TABLE}
       SET first_name = $1, last_name = $2
       WHERE id = $3`,
      [sanitizedFirstName, sanitizedLastName, userId]
    );

    // Audit log
    await auditService.logAuth("PROFILE_UPDATE", userId, req, {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
    });

    res.json({ message: "Cập nhật thông tin thành công" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Lỗi cập nhật thông tin" });
  }
});

/**
 * Change password
 * PUT /api/user/password
 * Requires CAPTCHA for security
 */
router.put(
  "/password",
  veryStrictLimiter,
  alwaysRequireCaptcha,
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ mật khẩu" });
      }

      // Strong password policy
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          error: "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số",
        });
      }

      // SECURITY: Prevent setting the same password
      if (currentPassword === newPassword) {
        return res.status(400).json({
          error: "Mật khẩu mới phải khác mật khẩu hiện tại",
        });
      }

      // Get current password hash
      const result = await pool.query(
        `SELECT password_hash FROM ${ACCOUNT_TABLE} WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Người dùng không tồn tại" });
      }

      // Verify current password
      const isValid = await authService.verifyPassword(
        currentPassword,
        result.rows[0].password_hash
      );

      if (!isValid) {
        await auditService.logAuth(
          "PASSWORD_CHANGE",
          userId,
          req,
          { reason: "wrong_current_password" },
          "failed"
        );
        return res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });
      }

      // SECURITY: Check password history to prevent reuse
      const isReused = await passwordHistoryService.isPasswordReused(userId, newPassword);
      if (isReused) {
        await auditService.logAuth(
          "PASSWORD_CHANGE",
          userId,
          req,
          { reason: "password_reused" },
          "failed"
        );
        return res.status(400).json({
          error: "Không thể sử dụng mật khẩu đã dùng gần đây. Vui lòng chọn mật khẩu khác.",
        });
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(newPassword);

      // Update password
      await pool.query(
        `UPDATE ${ACCOUNT_TABLE} SET password_hash = $1 WHERE id = $2`,
        [newPasswordHash, userId]
      );

      // Add old password to history before updating
      await passwordHistoryService.addToHistory(userId, result.rows[0].password_hash);

      // Revoke all refresh tokens (force re-login on all devices)
      await refreshTokenService.revokeAllUserTokens(userId);

      // Audit log
      await auditService.logAuth("PASSWORD_CHANGE", userId, req);

      res.json({
        message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên tất cả thiết bị.",
      });
    } catch (err) {
      console.error("Change password error:", err);
      res.status(500).json({ error: "Lỗi đổi mật khẩu" });
    }
  }
);

/**
 * Change email
 * PUT /api/user/email
 * Requires CAPTCHA for security
 */
router.put(
  "/email",
  veryStrictLimiter,
  alwaysRequireCaptcha,
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { newEmail, password } = req.body;

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: "Email không hợp lệ" });
      }

      // Verify password
      const result = await pool.query(
        `SELECT password_hash FROM ${ACCOUNT_TABLE} WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Người dùng không tồn tại" });
      }

      const isValid = await authService.verifyPassword(
        password,
        result.rows[0].password_hash
      );

      if (!isValid) {
        await auditService.logAuth(
          "EMAIL_CHANGE",
          userId,
          req,
          { reason: "wrong_password" },
          "failed"
        );
        return res.status(401).json({ error: "Mật khẩu không đúng" });
      }

      // Check if email already exists
      const emailCheck = await pool.query(
        `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(email) = LOWER($1) AND id != $2`,
        [newEmail.trim(), userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: "Email đã được sử dụng" });
      }

      // Update email
      await pool.query(
        `UPDATE ${ACCOUNT_TABLE} SET email = $1 WHERE id = $2`,
        [newEmail.trim().toLowerCase(), userId]
      );

      // Audit log
      await auditService.logAuth("EMAIL_CHANGE", userId, req, {
        newEmail: newEmail.trim(),
      });

      res.json({ message: "Cập nhật email thành công" });
    } catch (err) {
      console.error("Change email error:", err);
      res.status(500).json({ error: "Lỗi cập nhật email" });
    }
  }
);

/**
 * Get user's active sessions
 * GET /api/user/sessions
 */
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const sessions = await refreshTokenService.getUserSessions(userId);

    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        device: s.device_info,
        ipAddress: s.ip_address,
        createdAt: s.created_at,
        expiresAt: s.expires_at,
      })),
    });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ error: "Lỗi lấy danh sách phiên đăng nhập" });
  }
});

/**
 * Revoke a specific session
 * DELETE /api/user/sessions/:sessionId
 */
router.delete("/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const sessionId = parseInt(req.params.sessionId);

    // Verify the session belongs to the user
    const sessions = await refreshTokenService.getUserSessions(userId);
    const sessionBelongsToUser = sessions.some((s) => s.id === sessionId);

    if (!sessionBelongsToUser) {
      return res.status(403).json({ error: "Không có quyền xóa phiên này" });
    }

    await refreshTokenService.revokeTokenById(sessionId);

    res.json({ message: "Đã xóa phiên đăng nhập" });
  } catch (err) {
    console.error("Revoke session error:", err);
    res.status(500).json({ error: "Lỗi xóa phiên đăng nhập" });
  }
});

/**
 * Get user's activity log
 * GET /api/user/activity
 */
router.get("/activity", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const logs = await auditService.getUserLogs(userId, limit);

    res.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        resourceType: l.resource_type,
        ipAddress: l.ip_address,
        status: l.status,
        createdAt: l.created_at,
      })),
    });
  } catch (err) {
    console.error("Get activity error:", err);
    res.status(500).json({ error: "Lỗi lấy lịch sử hoạt động" });
  }
});

export default router;
