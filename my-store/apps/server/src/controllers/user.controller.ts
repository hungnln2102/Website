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
import { walletService } from "../services/wallet.service";
import { getCurrentTierCycle } from "../config/tier-cycle.config";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const PROFILE_TABLE = `${DB_SCHEMA.CUSTOMER_PROFILES!.SCHEMA}.${DB_SCHEMA.CUSTOMER_PROFILES!.TABLE}`;
const TIERS_TABLE = `${DB_SCHEMA.CUSTOMER_TIERS!.SCHEMA}.${DB_SCHEMA.CUSTOMER_TIERS!.TABLE}`;
const SPEND_STATS_TABLE = `${DB_SCHEMA.CUSTOMER_SPEND_STATS!.SCHEMA}.${DB_SCHEMA.CUSTOMER_SPEND_STATS!.TABLE}`;
const TIER_CYCLES_TABLE = `${DB_SCHEMA.TIER_CYCLES!.SCHEMA}.${DB_SCHEMA.TIER_CYCLES!.TABLE}`;
const COLS_TC = DB_SCHEMA.TIER_CYCLES!.COLS as {
  ID: string;
  CYCLE_START_AT: string;
  CYCLE_END_AT: string;
  STATUS: string;
};
const ORDER_LIST_TABLE = `${DB_SCHEMA.ORDER_LIST!.SCHEMA}.${DB_SCHEMA.ORDER_LIST!.TABLE}`;
const COLS_CP = DB_SCHEMA.CUSTOMER_PROFILES!.COLS as { TIER_ID: string };
const COLS_CT = DB_SCHEMA.CUSTOMER_TIERS!.COLS as { ID: string; NAME: string; MIN_TOTAL_SPEND: string };
const COLS_CSS = DB_SCHEMA.CUSTOMER_SPEND_STATS!.COLS as { LIFETIME_SPEND: string };
const WALLET_SCHEMA = DB_SCHEMA.WALLET!.SCHEMA;
const WALLET_TABLE = DB_SCHEMA.WALLET!.TABLE;
const COLS_OL = DB_SCHEMA.ORDER_LIST!.COLS as {
  ID_ORDER: string;
  ORDER_DATE: string;
  STATUS: string;
  INFORMATION_ORDER: string;
  ID_PRODUCT: string;
  PRICE: string;
  ORDER_EXPIRED: string;
  SLOT: string;
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
                COALESCE(ct.name, 'Member') as customer_type,
                COALESCE(css.${COLS_CSS.LIFETIME_SPEND}, 0) as total_spend
         FROM ${ACCOUNT_TABLE} a
         LEFT JOIN ${PROFILE_TABLE} cp ON cp.account_id = a.id
         LEFT JOIN ${TIERS_TABLE} ct ON ct.${COLS_CT.ID} = cp.${COLS_CP.TIER_ID}
         LEFT JOIN ${SPEND_STATS_TABLE} css ON css.account_id = a.id
         LEFT JOIN ${WALLET_SCHEMA}.${WALLET_TABLE} w ON w.account_id = a.id
         WHERE a.id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT ${COLS_CT.NAME} as name, ${COLS_CT.MIN_TOTAL_SPEND} as min_total_spend FROM ${TIERS_TABLE} ORDER BY ${COLS_CT.MIN_TOTAL_SPEND} ASC`
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

    // Ngày kết thúc chu kỳ hiện tại (từ config, dùng khi chưa có bản ghi tier_cycles)
    const now = new Date();
    const currentCycleConfig = getCurrentTierCycle(now);
    const tierCycleEnd = currentCycleConfig
      ? new Date(now.getFullYear(), currentCycleConfig.endMonth - 1, currentCycleConfig.endDay)
      : new Date(now.getFullYear(), 11, 31);

    // Chu kỳ hiện tại từ bảng tier_cycles: lấy đúng cycle_start_at, cycle_end_at trong DB (không đổi timezone)
    let currentCycle: { id: number; cycleStartAt: string; cycleEndAt: string; status: string } | null = null;
    const startCol = COLS_TC.CYCLE_START_AT;
    const endCol = COLS_TC.CYCLE_END_AT;

    const runCycleQuery = async (table: string) => {
      const sql = `SELECT tc.${COLS_TC.ID},
        to_char(tc.${startCol}, 'YYYY-MM-DD HH24:MI:SS') AS cycle_start,
        to_char(tc.${endCol}, 'YYYY-MM-DD HH24:MI:SS') AS cycle_end,
        tc.${COLS_TC.STATUS}
        FROM ${table} tc
        ORDER BY tc.${startCol} DESC LIMIT 1`;
      const cycleResult = await pool.query(sql);
      if (cycleResult.rows.length > 0) {
        const row = cycleResult.rows[0];
        return {
          id: Number(row[COLS_TC.ID]),
          cycleStartAt: String(row.cycle_start ?? ""),
          cycleEndAt: String(row.cycle_end ?? ""),
          status: String(row[COLS_TC.STATUS] ?? "active"),
        };
      }
      return null;
    };

    const publicTable = `public.${DB_SCHEMA.TIER_CYCLES!.TABLE}`;
    // Thử schema config (cycles.tier_cycles) trước để tránh lỗi "public.tier_cycles does not exist" khi bảng chỉ có ở cycles
    const tablesToTry = [TIER_CYCLES_TABLE, publicTable].filter((t, i, a) => a.indexOf(t) === i);
    try {
      for (const table of tablesToTry) {
        currentCycle = await runCycleQuery(table);
        if (currentCycle) {
          if (process.env.NODE_ENV !== "production") {
            console.log("[Profile] tier_cycles: found from " + table + ", id=" + currentCycle.id);
          }
          break;
        }
      }
      if (!currentCycle && process.env.NODE_ENV !== "production") {
        console.log("[Profile] tier_cycles: no row from " + tablesToTry.join(", "));
      }
    } catch (e) {
      const err = e as Error & { code?: string };
      console.warn("[Profile] Could not load current tier cycle from DB:", err?.message ?? e, "code=" + (err?.code ?? ""));
      for (const table of tablesToTry) {
        try {
          currentCycle = await runCycleQuery(table);
          if (currentCycle) break;
        } catch {
          // thử bảng tiếp
        }
      }
    }

    // Fallback: nếu DB không trả về chu kỳ (bảng trống, sai schema, hoặc không có bản ghi chứa NOW()), dùng config
    if (!currentCycle) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[Profile] currentCycle fallback: using config or full year, currentCycleConfig=" + (currentCycleConfig ? currentCycleConfig.name : "null"));
      }
      if (currentCycleConfig) {
        const cycleStartAt = new Date(now.getFullYear(), currentCycleConfig.startMonth - 1, currentCycleConfig.startDay);
        const cycleEndAt = new Date(now.getFullYear(), currentCycleConfig.endMonth - 1, currentCycleConfig.endDay);
        const fmt = (d: Date) => d.toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 19);
        currentCycle = {
          id: 0,
          cycleStartAt: fmt(cycleStartAt),
          cycleEndAt: fmt(cycleEndAt),
          status: "config",
        };
      } else {
        // Config cũng không có (lỗi config): dùng cả năm để ít nhất vẫn có "Còn lại"
        const y = now.getFullYear();
        const fmt = (d: Date) => d.toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 19);
        currentCycle = {
          id: 0,
          cycleStartAt: fmt(new Date(y, 0, 1)),
          cycleEndAt: fmt(new Date(y, 11, 31)),
          status: "config",
        };
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[Profile] response currentCycle:", currentCycle ? { id: currentCycle.id, cycleStartAt: currentCycle.cycleStartAt, cycleEndAt: currentCycle.cycleEndAt, status: currentCycle.status } : "null");
    }

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
      tierCycleEnd: tierCycleEnd.toISOString(),
      serverNow: now.toISOString(),
      currentCycle,
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
    const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
    const VARIANT_TABLE = `${DB_SCHEMA.VARIANT!.SCHEMA}.${DB_SCHEMA.VARIANT!.TABLE}`;
    const COLS_V = DB_SCHEMA.VARIANT!.COLS;

    // LEFT JOIN order_list để hiển thị cả đơn chỉ có trong order_customer (Đang Tạo Đơn, chưa có trong order_list)
    const result = await pool.query(
      `SELECT oc.${COLS_OC.ID_ORDER} as id_order_oc, oc.${COLS_OC.STATUS} as oc_status, oc.${COLS_OC.CREATED_AT} as oc_created_at, oc.${COLS_OC.PAYMENT_ID} as payment_id,
              ol.id as ol_id, ol.id_order as "${COLS_OL.ID_ORDER}", ol.id_product as "${COLS_OL.ID_PRODUCT}",
              ol.price as "${COLS_OL.PRICE}", ol.order_date as "${COLS_OL.ORDER_DATE}",
              ol.status as "${COLS_OL.STATUS}", ol.information_order as "${COLS_OL.INFORMATION_ORDER}",
              ol.order_expired as "${COLS_OL.ORDER_EXPIRED}", ol.slot as "${COLS_OL.SLOT}",
              v.${COLS_V.VARIANT_NAME} as product_display_name
       FROM ${ORDER_CUSTOMER_TABLE} oc
       LEFT JOIN ${ORDER_LIST_TABLE} ol ON ol.id_order = oc.id_order
       LEFT JOIN ${VARIANT_TABLE} v ON ol.id_product = v.${COLS_V.DISPLAY_NAME}
       WHERE oc.${COLS_OC.ACCOUNT_ID} = $1
       ORDER BY COALESCE(ol.order_date, oc.created_at) DESC
       LIMIT 200`,
      [accountId]
    );
    console.log("getOrders Query executing for accountId", accountId);
    console.log("Rows found:", result.rows.length);
    const orderMap = new Map<
      string,
      { id_order: string; order_date: string; status: string; payment_id: string | null; items: any[] }
    >();
    for (const row of result.rows) {
      const idOrder = row.id_order_oc ?? row[COLS_OL.ID_ORDER];
      if (!idOrder) continue;
      const orderDate = row[COLS_OL.ORDER_DATE] ?? row.oc_created_at;
      const status = row[COLS_OL.STATUS] ?? row.oc_status ?? "pending";
      if (!orderMap.has(idOrder)) {
        orderMap.set(idOrder, {
          id_order: idOrder,
          order_date: orderDate,
          status,
          payment_id: row.payment_id ?? null,
          items: [],
        });
      }
      const infoText = row[COLS_OL.INFORMATION_ORDER];
      let info: any = {};
      try {
        if (infoText && (infoText.startsWith("{") || infoText.startsWith("["))) {
          info = JSON.parse(infoText);
        }
      } catch (err) {
        console.error("JSON parse error:", err);
      }
      orderMap.get(idOrder)!.items.push({
        id_product: row[COLS_OL.ID_PRODUCT] ?? null,
        price: parseFloat(row[COLS_OL.PRICE]) || 0,
        information_order: infoText ?? null,
        order_expired: row[COLS_OL.ORDER_EXPIRED] ?? null,
        display_name: row.product_display_name ?? null,
        slot: row[COLS_OL.SLOT] ?? null,
        ...info,
      });
    }
    const orders = Array.from(orderMap.values()).map((o) => ({
      id_order: o.id_order,
      order_date: o.order_date,
      status: o.status,
      payment_id: o.payment_id ?? null,
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

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    const accountId = parseInt(userId, 10);
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const transactions = await walletService.getTransactions(accountId, limit);
    res.json({
      data: transactions.map((t) => ({
        id: t.id,
        orderId: t.refId ?? null,
        balanceAfter: t.balanceAfter,
        amount: t.amount,
        direction: t.direction,
        type: t.type,
        createdAt: t.createdAt,
        method: t.method,
        promoCode: t.promoCode,
        status: t.type,
      })),
    });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ error: "Lỗi lấy lịch sử giao dịch" });
  }
}
