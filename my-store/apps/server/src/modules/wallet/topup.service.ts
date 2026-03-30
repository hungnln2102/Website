/**
 * Topup Service
 * Lấy gói nạp từ bảng product.productid_payment.
 * Dùng product_id làm id nạp; chỉ lấy bản ghi is_active = true.
 */
import pool from "../../config/database";
import { TABLES, DB_SCHEMA } from "../../config/db.config";

const TABLE = TABLES.PRODUCTID_PAYMENT;
const COLS = DB_SCHEMA.PRODUCTID_PAYMENT!.COLS as Record<string, string>;
const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
const TX_ID_COL = DB_SCHEMA.WALLET_TRANSACTION!.COLS!.TRANSACTION_ID as string;
const PRODUCT_ID_COL = COLS.PRODUCT_ID as string;
const AMOUNT_COL = COLS.AMOUNT as string;
const PROMOTION_PERCENT_COL = COLS.PROMOTION_PERCENT as string;
const IS_ACTIVE_COL = COLS.IS_ACTIVE as string;

const MAVNAP_PREFIX = "MAVNAP";
const MAX_RETRY = 5;

function randomAlphanumeric(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

/** Sinh mã nạp tiền MAVNAPXXXXX, kiểm tra trùng transaction_id trong wallet_transactions. */
export async function generateTopupTransferCode(): Promise<string> {
  for (let i = 0; i < MAX_RETRY; i++) {
    const code = `${MAVNAP_PREFIX}${randomAlphanumeric(5)}`;
    const exists = await pool.query(
      `SELECT 1 FROM ${WALLET_TX_TABLE} WHERE ${TX_ID_COL} = $1 LIMIT 1`,
      [code]
    );
    if (exists.rows.length === 0) return code;
  }
  throw new Error("Không thể tạo mã giao dịch duy nhất. Vui lòng thử lại.");
}

export interface TopupPackageRow {
  product_id: string;
  amount: number;
  promotion_percent: number;
}

export async function getTopupPackages(): Promise<TopupPackageRow[]> {
  const query = `SELECT ${PRODUCT_ID_COL}, ${AMOUNT_COL}, ${PROMOTION_PERCENT_COL}
    FROM ${TABLE}
    WHERE ${IS_ACTIVE_COL} = true
    ORDER BY ${AMOUNT_COL} ASC`;
  const { rows } = await pool.query<Record<string, unknown>>(query);
  return rows.map((r) => ({
    product_id: String(r[PRODUCT_ID_COL] ?? ""),
    amount: Number(r[AMOUNT_COL] ?? 0),
    promotion_percent: Number(r[PROMOTION_PERCENT_COL] ?? 0),
  }));
}

export async function getTopupPackageByProductId(productId: string): Promise<TopupPackageRow | null> {
  const query = `SELECT ${PRODUCT_ID_COL}, ${AMOUNT_COL}, ${PROMOTION_PERCENT_COL}
    FROM ${TABLE}
    WHERE ${PRODUCT_ID_COL} = $1 AND ${IS_ACTIVE_COL} = true
    LIMIT 1`;
  const { rows } = await pool.query<Record<string, unknown>>(query, [productId]);
  const r = rows[0];
  if (!r) return null;
  return {
    product_id: String(r[PRODUCT_ID_COL] ?? ""),
    amount: Number(r[AMOUNT_COL] ?? 0),
    promotion_percent: Number(r[PROMOTION_PERCENT_COL] ?? 0),
  };
}
