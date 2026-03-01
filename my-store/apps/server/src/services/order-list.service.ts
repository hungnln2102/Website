/**
 * Ghi tạm order_list khi thanh toán thành công (Mcoin).
 * Mỗi item = 1 dòng order_list (id_order, id_product = variant_id, customer, price, ...).
 * Bot /done sau đó cập nhật slot, note, supply, cost.
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const ORDER_LIST_TABLE = `${DB_SCHEMA.ORDER_LIST!.SCHEMA}.${DB_SCHEMA.ORDER_LIST!.TABLE}`;
const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const COLS_OL = DB_SCHEMA.ORDER_LIST!.COLS as Record<string, string>;
const COLS_ACCOUNT = DB_SCHEMA.ACCOUNT!.COLS as Record<string, string>;

const DEFAULT_CONTACT = "Website";
const DEFAULT_STATUS = "Đang Tạo Đơn";

/** Đồng bộ sequence order_list.id với MAX(id) để tránh duplicate key khi sequence lệch (restore/import). */
async function ensureOrderListSequence(): Promise<void> {
  await pool.query(
    `SELECT setval(
       pg_get_serial_sequence($1, 'id'),
       COALESCE((SELECT MAX(id) FROM ${ORDER_LIST_TABLE}), 1)
     )`,
    [ORDER_LIST_TABLE]
  );
}

/** Parse duration "12m" / "30d" thành số ngày (để tính order_expired). */
function parseDaysFromDuration(duration: string | undefined | null): number | null {
  if (!duration || typeof duration !== "string") return null;
  const m = duration.trim().match(/--?\s*(\d+)\s*([md])/i) || duration.trim().match(/(\d+)\s*([md])/i);
  if (!m || m[1] == null) return null;
  const num = parseInt(m[1], 10);
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "d") return num;
  if (unit === "m") return num >= 12 ? 365 : num * 30;
  return null;
}

export interface OrderListItemInput {
  id_order: string;
  /** variant_id (int) - id_product trong order_list */
  id_product: number;
  /** Giá bán (từ item khi thanh toán) */
  price: number;
  /** Thông tin bổ sung (JSON string hoặc null) */
  information_order?: string | null;
  /** "12m" / "30d" để tính days và order_expired */
  duration?: string | null;
}

export interface InsertOrderListParams {
  accountId: number;
  orderIds: string[];
  items: OrderListItemInput[];
  /** Link liên hệ mặc định (vd. URL website) */
  contact?: string | null;
}

/**
 * Lấy username từ account — ghi vào order_list.customer (đủ để nhận diện khách; không cần account_id trong order_list).
 */
async function getAccountUsername(accountId: number): Promise<string> {
  const res = await pool.query<{ username: string | null }>(
    `SELECT ${COLS_ACCOUNT.USERNAME} FROM ${ACCOUNT_TABLE} WHERE ${COLS_ACCOUNT.ID} = $1 LIMIT 1`,
    [accountId]
  );
  const username = res.rows[0]?.username;
  return username != null && String(username).trim() !== "" ? String(username).trim() : `user_${accountId}`;
}

/**
 * Ghi tạm từng dòng vào order_list (sau khi đã ghi order_customer + wallet_transaction).
 * Gọi từ balance-payment.service sau COMMIT order_customer.
 */
export async function insertOrderListFromPayment(params: InsertOrderListParams): Promise<void> {
  const { accountId, orderIds, items, contact } = params;
  if (orderIds.length === 0 || items.length === 0 || orderIds.length !== items.length) {
    console.warn("[order-list] insertOrderListFromPayment: orderIds.length !== items.length, skip");
    return;
  }

  const customer = await getAccountUsername(accountId);
  const contactVal = contact != null && String(contact).trim() !== "" ? String(contact).trim() : DEFAULT_CONTACT;
  const orderDate = new Date();

  const columns = [
    COLS_OL.ID_ORDER,
    COLS_OL.ID_PRODUCT,
    COLS_OL.INFORMATION_ORDER,
    COLS_OL.CUSTOMER,
    COLS_OL.CONTACT,
    COLS_OL.ORDER_DATE,
    COLS_OL.DAYS,
    COLS_OL.ORDER_EXPIRED,
    COLS_OL.PRICE,
    COLS_OL.STATUS,
  ].join(", ");

  for (let i = 0; i < orderIds.length; i++) {
    const idOrder = orderIds[i]!;
    const item = items[i]!;
    const days = item.duration != null ? parseDaysFromDuration(item.duration) : null;
    const orderExpired =
      days != null && days > 0
        ? new Date(orderDate.getTime() + days * 24 * 60 * 60 * 1000)
        : null;
    const informationOrder =
      item.information_order != null && String(item.information_order).trim() !== ""
        ? String(item.information_order).trim()
        : null;

    try {
      await pool.query(
        `INSERT INTO ${ORDER_LIST_TABLE} (${columns})
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          idOrder,
          item.id_product,
          informationOrder,
          customer,
          contactVal,
          orderDate,
          days,
          orderExpired,
          Math.round(Number(item.price)) || 0,
          DEFAULT_STATUS,
        ]
      );
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      if (code === "23505") {
        await ensureOrderListSequence();
        await pool.query(
          `INSERT INTO ${ORDER_LIST_TABLE} (${columns})
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            idOrder,
            item.id_product,
            informationOrder,
            customer,
            contactVal,
            orderDate,
            days,
            orderExpired,
            Math.round(Number(item.price)) || 0,
            DEFAULT_STATUS,
          ]
        );
      } else {
        throw err;
      }
    }
  }
  console.log("[order-list] Inserted", orderIds.length, "rows into order_list for account", accountId);
}

const ORDER_CANCELED_TABLE = `${DB_SCHEMA.ORDER_CANCELED!.SCHEMA}.${DB_SCHEMA.ORDER_CANCELED!.TABLE}`;
const COLS_OC = DB_SCHEMA.ORDER_CANCELED!.COLS as Record<string, string>;

const STATUS_DONE = "Đang Xử Lý";

export interface NotifyDonePayload {
  id_order: string;
  /** Thông tin đơn hàng (ghi vào order_list.information_order) */
  information_order?: string | null;
  slot?: string | null;
  note?: string | null;
  supply?: string | number | null;
}

/**
 * Cập nhật order_list khi Bot bấm "Hoàn thành": đổi trạng thái Đang Tạo Đơn → Đang Xử Lý,
 * ghi information_order, slot, note, supply.
 * Gọi từ POST /api/orders/notify-done (Bot / nút Telegram).
 */
export async function updateOrderDone(id_order: string, payload: NotifyDonePayload): Promise<number> {
  const information_order = payload.information_order != null ? String(payload.information_order).trim() || null : null;
  const slot = payload.slot != null ? String(payload.slot).trim() || null : null;
  const note = payload.note != null ? String(payload.note).trim() || null : null;
  const supply = payload.supply != null ? (typeof payload.supply === "number" ? payload.supply : String(payload.supply).trim() || null) : null;

  const res = await pool.query(
    `UPDATE ${ORDER_LIST_TABLE}
     SET ${COLS_OL.STATUS} = $1,
         ${COLS_OL.INFORMATION_ORDER} = COALESCE($2, ${COLS_OL.INFORMATION_ORDER}),
         ${COLS_OL.SLOT} = COALESCE($3, ${COLS_OL.SLOT}),
         ${COLS_OL.NOTE} = COALESCE($4, ${COLS_OL.NOTE}),
         ${COLS_OL.SUPPLY} = COALESCE($5::text, ${COLS_OL.SUPPLY})
     WHERE ${COLS_OL.ID_ORDER} = $6`,
    [STATUS_DONE, information_order, slot, note, supply != null ? String(supply) : null, id_order]
  );
  return res.rowCount ?? 0;
}

/**
 * Hủy đơn: chuyển dòng từ order_list sang order_canceled, xóa khỏi order_list.
 * Gọi từ POST /api/orders/cancel (Bot nút "Hủy Đơn").
 */
export async function cancelOrder(id_order: string): Promise<number> {
  const colsOl = COLS_OL;
  const colsOc = COLS_OC;
  const insertCols = [
    colsOc.ID_ORDER,
    colsOc.ID_PRODUCT,
    colsOc.INFORMATION_ORDER,
    colsOc.CUSTOMER,
    colsOc.CONTACT,
    colsOc.SLOT,
    colsOc.ORDER_DATE,
    colsOc.DAYS,
    colsOc.ORDER_EXPIRED,
    colsOc.SUPPLY,
    colsOc.COST,
    colsOc.PRICE,
    colsOc.NOTE,
    colsOc.STATUS,
    colsOc.REFUND,
    colsOc.CREATED_AT,
  ].join(", ");
  const selectCols = [
    colsOl.ID_ORDER,
    colsOl.ID_PRODUCT,
    colsOl.INFORMATION_ORDER,
    colsOl.CUSTOMER,
    colsOl.CONTACT,
    colsOl.SLOT,
    colsOl.ORDER_DATE,
    colsOl.DAYS,
    colsOl.ORDER_EXPIRED,
    colsOl.SUPPLY,
    colsOl.COST,
    colsOl.PRICE,
    colsOl.NOTE,
    colsOl.STATUS,
    "NULL",
    "NOW()",
  ].join(", ");

  const inserted = await pool.query(
    `INSERT INTO ${ORDER_CANCELED_TABLE} (${insertCols})
     SELECT ${selectCols} FROM ${ORDER_LIST_TABLE} WHERE ${colsOl.ID_ORDER} = $1`,
    [id_order]
  );
  const count = inserted.rowCount ?? 0;
  if (count > 0) {
    await pool.query(`DELETE FROM ${ORDER_LIST_TABLE} WHERE ${colsOl.ID_ORDER} = $1`, [id_order]);
  }
  return count;
}
