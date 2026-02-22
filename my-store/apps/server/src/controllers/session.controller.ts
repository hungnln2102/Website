/**
 * Session Controller
 * Handles session listing, revocation, and global logout.
 */
import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { refreshTokenService } from "../services/refresh-token.service";
import { tokenBlacklistService } from "../services/token-blacklist.service";
import { auditService } from "../services/audit.service";

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
