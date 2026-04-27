/**
 * Ghi tạm order_list khi thanh toán thành công (Mcoin).
 * Mỗi item = 1 dòng order_list (id_order, id_product = variant.variant_name — đồng bộ admin_orderlist).
 * Bot /done sau đó cập nhật slot, note, supply_id (id supplier), cost.
 */

import pool from "../../config/database";
import { DB_SCHEMA } from "../../config/db.config";
import { ORDER_CUSTOMER_STATUS, ORDER_LIST_STATUS } from "../../config/status.constants";

const ORDER_LIST_TABLE = `${DB_SCHEMA.ORDER_LIST!.SCHEMA}.${DB_SCHEMA.ORDER_LIST!.TABLE}`;
const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
const WALLET_TABLE = `${DB_SCHEMA.WALLET!.SCHEMA}.${DB_SCHEMA.WALLET!.TABLE}`;
const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const SUPPLIER_COST_TABLE = `${DB_SCHEMA.SUPPLIER_COST!.SCHEMA}.${DB_SCHEMA.SUPPLIER_COST!.TABLE}`;
const VARIANT_TABLE = `${DB_SCHEMA.VARIANT!.SCHEMA}.${DB_SCHEMA.VARIANT!.TABLE}`;
const COLS_OL = DB_SCHEMA.ORDER_LIST!.COLS as Record<string, string>;
const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
const COLS_ACCOUNT = DB_SCHEMA.ACCOUNT!.COLS as Record<string, string>;
const COLS_SC = DB_SCHEMA.SUPPLIER_COST!.COLS as Record<string, string>;
const COLS_V = DB_SCHEMA.VARIANT!.COLS as Record<string, string>;

const DEFAULT_CONTACT = "Website";
/** Trạng thái khi mới ghi vào order_list (thanh toán đã xác nhận, bot chưa xử lý) */
const DEFAULT_STATUS = ORDER_LIST_STATUS.PROCESSING;

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

/**
 * Giá trị ghi vào order_list.id_product: variant_name (varchar), khớp admin_orderlist / MV bán hàng.
 * Đầu vào có thể là id variant (số) hoặc đã là variant_name.
 */
async function resolveIdProductForOrderList(idProductRaw: string | number): Promise<string> {
  const raw = String(idProductRaw ?? "").trim();
  if (!raw) return raw;
  const res = await pool.query<{ vn: string | null }>(
    `SELECT ${COLS_V.VARIANT_NAME} AS vn FROM ${VARIANT_TABLE}
     WHERE ${COLS_V.ID}::text = $1
        OR TRIM(${COLS_V.VARIANT_NAME}::text) = TRIM($2::text)
     LIMIT 1`,
    [raw, raw]
  );
  const vn = res.rows[0]?.vn;
  return vn != null && String(vn).trim() !== "" ? String(vn).trim() : raw;
}

/** Parse duration "12m" / "30d" thành số ngày (để tính expired_at). */
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
  /** variant id (số) hoặc variant_name — trước khi INSERT được map sang variant_name trong DB */
  id_product: string | number;
  /** Giá bán (từ item khi thanh toán) */
  price: number;
  /** Thông tin bổ sung (JSON string hoặc null) */
  information_order?: string | null;
  /** "12m" / "30d" để tính days và expired_at */
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
    COLS_OL.EXPIRED_AT,
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

    const idProductStored = await resolveIdProductForOrderList(item.id_product);

    try {
      await pool.query(
        `INSERT INTO ${ORDER_LIST_TABLE} (${columns})
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          idOrder,
          idProductStored,
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
            idProductStored,
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

/** Trạng thái khi bot bấm /done (đã bàn giao dịch vụ cho khách) */
const STATUS_DONE = ORDER_LIST_STATUS.PAID;

export interface NotifyDonePayload {
  id_order: string;
  /** Thông tin đơn hàng (ghi vào order_list.information_order) */
  information_order?: string | null;
  slot?: string | null;
  note?: string | null;
  /** Id nhà cung cấp (partner.supplier.id), ghi vào order_list.supply_id */
  supply_id?: number | string | null;
}

/**
 * Cập nhật order_list khi Bot bấm "Hoàn thành": đổi trạng thái Đang Tạo Đơn → Đang Xử Lý,
 * ghi information_order, slot, note, supply_id (id supplier).
 * Gọi từ POST /api/orders/notify-done (Bot / nút Telegram).
 */
export async function updateOrderDone(id_order: string, payload: NotifyDonePayload): Promise<number> {
  const information_order = payload.information_order != null ? String(payload.information_order).trim() || null : null;
  const slot = payload.slot != null ? String(payload.slot).trim() || null : null;
  const note = payload.note != null ? String(payload.note).trim() || null : null;
  const supplyId =
    payload.supply_id != null && payload.supply_id !== ""
      ? typeof payload.supply_id === "number"
        ? payload.supply_id
        : parseInt(String(payload.supply_id).trim(), 10)
      : null;
  const supplyIdVal = supplyId != null && !Number.isNaN(supplyId) ? supplyId : null;

  const res = await pool.query(
    `UPDATE ${ORDER_LIST_TABLE} ol
     SET ${COLS_OL.STATUS} = $1,
         ${COLS_OL.INFORMATION_ORDER} = COALESCE($2, ol.${COLS_OL.INFORMATION_ORDER}),
         ${COLS_OL.SLOT} = COALESCE($3, ol.${COLS_OL.SLOT}),
         ${COLS_OL.NOTE} = COALESCE($4, ol.${COLS_OL.NOTE}),
         ${COLS_OL.SUPPLY_ID} = COALESCE($5::int, ol.${COLS_OL.SUPPLY_ID}),
         ${COLS_OL.COST} = CASE
           WHEN $5::int IS NOT NULL THEN (
             SELECT sc.${COLS_SC.PRICE}
             FROM ${SUPPLIER_COST_TABLE} sc
             INNER JOIN ${VARIANT_TABLE} v ON v.${COLS_V.ID} = sc.${COLS_SC.VARIANT_ID}
             WHERE sc.${COLS_SC.SUPPLIER_ID} = $5
               AND (
                 TRIM(BOTH FROM ol.${COLS_OL.ID_PRODUCT}::text) = TRIM(BOTH FROM v.${COLS_V.VARIANT_NAME}::text)
                 OR (
                   TRIM(BOTH FROM ol.${COLS_OL.ID_PRODUCT}::text) ~ '^[0-9]+$'
                   AND v.${COLS_V.ID} = TRIM(BOTH FROM ol.${COLS_OL.ID_PRODUCT}::text)::int
                 )
               )
             LIMIT 1
           )
           ELSE ol.${COLS_OL.COST}
         END
     WHERE ol.${COLS_OL.ID_ORDER} = $6`,
    [STATUS_DONE, information_order, slot, note, supplyIdVal, id_order]
  );
  return res.rowCount ?? 0;
}

function generateRefundTransactionId(): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  const n = String(Date.now()).slice(-6);
  return `MAVR${n}${r}`.slice(0, 20);
}

export type CancelOrderResult = {
  /** Số dòng order_list cập nhật (0 nếu đã hủy trước đó hoặc không tìm thấy) */
  updated: number;
  /** Mcoin đã cộng lại ví (0 nếu không hoàn) */
  refundedMcoin: number;
  accountId: number | null;
};

/**
 * Hủy đơn: Đã Hủy + canceled_at; nếu đơn đã thu Mcoin (order_list.price & order_customer) thì cộng lại ví + ghi wallet_transactions (REFUND/CREDIT).
 * Gọi từ POST /api/orders/cancel (Bot nút "Hủy Đơn").
 */
export async function cancelOrder(id_order: string): Promise<CancelOrderResult> {
  const idOrder = String(id_order ?? "").trim();
  if (!idOrder) {
    return { updated: 0, refundedMcoin: 0, accountId: null };
  }

  const client = await pool.connect();
  const txIdCol = COLS_WT.TRANSACTION_ID as string;
  const methodCol = COLS_WT.METHOD as string;
  const promotionIdCol = COLS_WT.PROMOTION_ID as string;
  const idOrderColOl = COLS_OL.ID_ORDER as string;
  const idOrderColOc = COLS_OC.ID_ORDER as string;
  const accountIdCol = COLS_OC.ACCOUNT_ID as string;
  const statusColOl = COLS_OL.STATUS as string;
  const priceCol = COLS_OL.PRICE as string;
  const refundCol = COLS_OL.REFUND as string;
  const canceledAtCol = COLS_OL.CANCELED_AT as string;
  const statusColOc = COLS_OC.STATUS as string;
  const updatedAtCol = COLS_OC.UPDATED_AT as string;

  let refundedMcoin = 0;
  let outAccountId: number | null = null;
  let updated = 0;

  try {
    await client.query("BEGIN");

    const sel = await client.query<{
      st: string | null;
      price: string | null;
      account_id: string | null;
    }>(
      `SELECT ol.${statusColOl} AS st, ol.${priceCol}::text AS price,
              oc.${accountIdCol}::text AS account_id
       FROM ${ORDER_LIST_TABLE} ol
       LEFT JOIN ${ORDER_CUSTOMER_TABLE} oc ON oc.${idOrderColOc} = ol.${idOrderColOl}
       WHERE ol.${idOrderColOl} = $1
       FOR UPDATE OF ol`,
      [idOrder]
    );

    if (sel.rows.length === 0) {
      await client.query("ROLLBACK");
      return { updated: 0, refundedMcoin: 0, accountId: null };
    }

    const row = sel.rows[0]!;
    if (row.st === ORDER_LIST_STATUS.CANCELLED) {
      await client.query("ROLLBACK");
      return { updated: 0, refundedMcoin: 0, accountId: null };
    }

    const refundLine = Math.max(0, Math.round(parseFloat(String(row.price ?? "0")) || 0));
    const accountId =
      row.account_id != null && String(row.account_id).trim() !== ""
        ? parseInt(String(row.account_id), 10)
        : NaN;
    const hasAccount = Number.isFinite(accountId) && accountId > 0;
    if (hasAccount) outAccountId = accountId!;

    const markCancelled = await client.query(
      `UPDATE ${ORDER_LIST_TABLE}
       SET ${statusColOl} = $1,
           ${canceledAtCol} = NOW(),
           ${refundCol} = $2::numeric
       WHERE ${idOrderColOl} = $3
         AND ${statusColOl} != $1
       RETURNING 1`,
      [ORDER_LIST_STATUS.CANCELLED, refundLine, idOrder]
    );
    if (markCancelled.rowCount === 0) {
      await client.query("ROLLBACK");
      return { updated: 0, refundedMcoin: 0, accountId: hasAccount ? outAccountId : null };
    }
    updated = 1;

    if (hasAccount && refundLine > 0) {
      const balRes = await client.query<{ balance: string }>(
        `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1 FOR UPDATE`,
        [accountId]
      );
      if (balRes.rows.length === 0) {
        await client.query(
          `INSERT INTO ${WALLET_TABLE} (account_id, balance, created_at, updated_at)
           VALUES ($1, 0, NOW(), NOW())`,
          [accountId]
        );
      }
      const bal2 = await client.query<{ balance: string }>(
        `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1 FOR UPDATE`,
        [accountId]
      );
      const balanceBefore = parseInt(bal2.rows[0]?.balance ?? "0", 10) || 0;
      const balanceAfter = balanceBefore + refundLine;
      let txId = generateRefundTransactionId();
      for (let attempt = 0; attempt < 5; attempt++) {
        const ex = await client.query(`SELECT 1 FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1`, [txId]);
        if (ex.rows.length === 0) break;
        txId = generateRefundTransactionId();
      }

      await client.query(
        `UPDATE ${WALLET_TABLE} SET balance = $1, updated_at = NOW() WHERE account_id = $2`,
        [balanceAfter, accountId]
      );
      await client.query(
        `INSERT INTO ${WALLET_TX_TABLE}
         (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, ${methodCol}, ${promotionIdCol}, created_at)
         VALUES ($1, $2, 'REFUND', 'CREDIT', $3, $4, $5, 'Mcoin', NULL, NOW())`,
        [txId, accountId, refundLine, balanceBefore, balanceAfter]
      );
      refundedMcoin = refundLine;
    }

    await client.query(
      `UPDATE ${ORDER_CUSTOMER_TABLE}
       SET ${statusColOc} = $1, ${updatedAtCol} = NOW()
       WHERE ${idOrderColOc} = $2`,
      [ORDER_CUSTOMER_STATUS.CANCELLED, idOrder]
    );

    await client.query("COMMIT");
    if (refundedMcoin > 0) {
      console.log(
        "[order-list] cancel: refunded Mcoin",
        { id_order: idOrder, refundedMcoin, accountId: outAccountId }
      );
    }
    return { updated, refundedMcoin, accountId: outAccountId };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
