/**
 * User (protected) request handlers – logic extracted from user.route.
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { auditService } from "../services/audit.service";
import { authService } from "../services/auth.service";
import { refreshTokenService } from "../services/refresh-token.service";
import { passwordHistoryService } from "../services/password-history.service";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const PROFILE_TABLE = `${DB_SCHEMA.CUSTOMER_PROFILES!.SCHEMA}.${DB_SCHEMA.CUSTOMER_PROFILES!.TABLE}`;
const TYPE_HISTORY_TABLE = `${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.SCHEMA}.${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.TABLE}`;
const ORDER_LIST_TABLE = `${DB_SCHEMA.ORDER_LIST!.SCHEMA}.${DB_SCHEMA.ORDER_LIST!.TABLE}`;
const TIERS_TABLE = `${DB_SCHEMA.CUSTOMER_TIERS!.SCHEMA}.${DB_SCHEMA.CUSTOMER_TIERS!.TABLE}`;
const WALLET_SCHEMA = DB_SCHEMA.WALLET!.SCHEMA;
const WALLET_TABLE = DB_SCHEMA.WALLET!.TABLE;
const COLS_OL = DB_SCHEMA.ORDER_LIST!.COLS as {
  ID_ORDER: string;
  ORDER_DATE: string;
  STATUS: string;
  INFORMATION_ORDER: string;
  ID_PRODUCT: string;
  PRICE: string;
  ACCOUNT_ID: string;
};

function getUserId(req: Request): string {
  const u = (req as any).user;
  if (!u?.userId) throw new Error("Unauthorized");
  return u.userId;
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const [result, tiersResult] = await Promise.all([
      pool.query(
        `SELECT a.id, a.username, a.email, a.created_at,
                cp.first_name, cp.last_name, cp.date_of_birth,
                COALESCE(w.balance, 0) as balance,
                COALESCE(cth.new_type, 'Member') as customer_type,
                COALESCE(cth.total_spend, 0) as total_spend
         FROM ${ACCOUNT_TABLE} a
         LEFT JOIN ${PROFILE_TABLE} cp ON cp.account_id = a.id
         LEFT JOIN ${WALLET_SCHEMA}.${WALLET_TABLE} w ON w.account_id = a.id
         LEFT JOIN (
           SELECT DISTINCT ON (account_id) account_id, new_type, total_spend
           FROM ${TYPE_HISTORY_TABLE}
           ORDER BY account_id, evaluated_at DESC
         ) cth ON cth.account_id = a.id
         WHERE a.id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT name, min_total_spend FROM ${TIERS_TABLE} ORDER BY min_total_spend ASC`
      ),
    ]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Người dùng không tồn tại" });
      return;
    }
    const user = result.rows[0];
    const tiers = tiersResult.rows.map((r: any) => ({
      name: r.name,
      minTotalSpend: parseFloat(r.min_total_spend) || 0,
    }));
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth,
      createdAt: user.created_at,
      balance: parseInt(user.balance, 10) || 0,
      customerType: user.customer_type,
      totalSpend: parseFloat(user.total_spend) || 0,
      tiers,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Lỗi lấy thông tin tài khoản" });
  }
}

export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const accountId = parseInt(userId, 10);
    const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
    const result = await pool.query(
      `SELECT ol.id, ol.id_order as "${COLS_OL.ID_ORDER}", ol.id_product as "${COLS_OL.ID_PRODUCT}", 
              ol.price as "${COLS_OL.PRICE}", ol.order_date as "${COLS_OL.ORDER_DATE}", 
              ol.status as "${COLS_OL.STATUS}", ol.information_order as "${COLS_OL.INFORMATION_ORDER}"
       FROM ${ORDER_LIST_TABLE} ol
       JOIN ${ORDER_CUSTOMER_TABLE} oc ON ol.id_order = oc.id_order
       WHERE oc.account_id = $1
       ORDER BY ol.order_date DESC
       LIMIT 200`,
      [accountId]
    );
    console.log("getOrders Query executing for accountId", accountId);
    console.log("Rows found:", result.rows.length);
    const orderMap = new Map<
      string,
      { id_order: string; order_date: string; status: string; items: any[] }
    >();
    for (const row of result.rows) {
      console.log("Processing row:", row[COLS_OL.ID_ORDER], row);
      const idOrder = row[COLS_OL.ID_ORDER];
      if (!orderMap.has(idOrder)) {
        orderMap.set(idOrder, {
          id_order: idOrder,
          order_date: row[COLS_OL.ORDER_DATE],
          status: row[COLS_OL.STATUS] || "pending",
          items: [],
        });
      }
      let info: { name?: string; quantity?: number; unitPrice?: number; variant_name?: string; duration?: string; note?: string } = {};
      try {
        if (row[COLS_OL.INFORMATION_ORDER]) {
          info = JSON.parse(row[COLS_OL.INFORMATION_ORDER]);
        }
      } catch (err) {
        console.error("JSON parse error:", err);
      }
      orderMap.get(idOrder)!.items.push({
        id_product: row[COLS_OL.ID_PRODUCT],
        price: parseFloat(row[COLS_OL.PRICE]) || 0,
        ...info,
      });
    }
    const orders = Array.from(orderMap.values()).map((o) => ({
      id_order: o.id_order,
      order_date: o.order_date,
      status: o.status,
      items: o.items,
    }));
    console.log("Returning orders count:", orders.length);
    res.json({ data: orders });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Lỗi lấy lịch sử đơn hàng" });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { firstName, lastName } = req.body;
    if (!firstName?.trim() || !lastName?.trim()) {
      res.status(400).json({ error: "Vui lòng điền đầy đủ họ tên" });
      return;
    }
    const sanitizedFirstName = firstName.trim().replace(/[<>'"&]/g, "");
    const sanitizedLastName = lastName.trim().replace(/[<>'"&]/g, "");
    await pool.query(
      `UPDATE ${PROFILE_TABLE} SET first_name = $1, last_name = $2, updated_at = NOW() WHERE account_id = $3`,
      [sanitizedFirstName, sanitizedLastName, userId]
    );
    await auditService.logAuth("PROFILE_UPDATE", userId, req, {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
    });
    res.json({ message: "Cập nhật thông tin thành công" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Lỗi cập nhật thông tin" });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Vui lòng nhập đầy đủ mật khẩu" });
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        error: "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số",
      });
      return;
    }
    if (currentPassword === newPassword) {
      res.status(400).json({ error: "Mật khẩu mới phải khác mật khẩu hiện tại" });
      return;
    }
    const result = await pool.query(
      `SELECT password_hash FROM ${ACCOUNT_TABLE} WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Người dùng không tồn tại" });
      return;
    }
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
      res.status(401).json({ error: "Mật khẩu hiện tại không đúng" });
      return;
    }
    const isReused = await passwordHistoryService.isPasswordReused(userId, newPassword);
    if (isReused) {
      await auditService.logAuth(
        "PASSWORD_CHANGE",
        userId,
        req,
        { reason: "password_reused" },
        "failed"
      );
      res.status(400).json({
        error: "Không thể sử dụng mật khẩu đã dùng gần đây. Vui lòng chọn mật khẩu khác.",
      });
      return;
    }
    const newPasswordHash = await authService.hashPassword(newPassword);
    await pool.query(
      `UPDATE ${ACCOUNT_TABLE} SET password_hash = $1 WHERE id = $2`,
      [newPasswordHash, userId]
    );
    await passwordHistoryService.addToHistory(userId, result.rows[0].password_hash);
    await refreshTokenService.revokeAllUserTokens(userId);
    await auditService.logAuth("PASSWORD_CHANGE", userId, req);
    res.json({
      message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên tất cả thiết bị.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Lỗi đổi mật khẩu" });
  }
}

export async function changeEmail(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const { newEmail, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      res.status(400).json({ error: "Email không hợp lệ" });
      return;
    }
    const result = await pool.query(
      `SELECT password_hash FROM ${ACCOUNT_TABLE} WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Người dùng không tồn tại" });
      return;
    }
    const isValid = await authService.verifyPassword(password, result.rows[0].password_hash);
    if (!isValid) {
      await auditService.logAuth(
        "EMAIL_CHANGE",
        userId,
        req,
        { reason: "wrong_password" },
        "failed"
      );
      res.status(401).json({ error: "Mật khẩu không đúng" });
      return;
    }
    const emailCheck = await pool.query(
      `SELECT 1 FROM ${ACCOUNT_TABLE} WHERE LOWER(email) = LOWER($1) AND id != $2`,
      [newEmail.trim(), userId]
    );
    if (emailCheck.rows.length > 0) {
      res.status(409).json({ error: "Email đã được sử dụng" });
      return;
    }
    await pool.query(
      `UPDATE ${ACCOUNT_TABLE} SET email = $1 WHERE id = $2`,
      [newEmail.trim().toLowerCase(), userId]
    );
    await auditService.logAuth("EMAIL_CHANGE", userId, req, {
      newEmail: newEmail.trim(),
    });
    res.json({ message: "Cập nhật email thành công" });
  } catch (err) {
    console.error("Change email error:", err);
    res.status(500).json({ error: "Lỗi cập nhật email" });
  }
}

export async function getSessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
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
}

export async function revokeSession(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const sessionId = parseInt(req.params.sessionId ?? "", 10);
    const sessions = await refreshTokenService.getUserSessions(userId as string);
    if (!sessions.some((s) => s.id === sessionId)) {
      res.status(403).json({ error: "Không có quyền xóa phiên này" });
      return;
    }
    await refreshTokenService.revokeTokenById(sessionId);
    res.json({ message: "Đã xóa phiên đăng nhập" });
  } catch (err) {
    console.error("Revoke session error:", err);
    res.status(500).json({ error: "Lỗi xóa phiên đăng nhập" });
  }
}

export async function getActivity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
    const logs = await auditService.getUserLogs(parseInt(userId, 10), limit);
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
}
