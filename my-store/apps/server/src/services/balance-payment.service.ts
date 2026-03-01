/**
 * Balance (MCoin) payment: deduct wallet, record transaction, save to order_customer and ghi tạm order_list.
 * Mỗi sản phẩm = 1 id_order unique; payment_id = wallet_transaction.id (integer).
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { handlePaymentSuccess } from "./payment-success.service";

const WALLET_TABLE = `${DB_SCHEMA.WALLET!.SCHEMA}.${DB_SCHEMA.WALLET!.TABLE}`;
const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
const ORDER_LIST_TABLE = `${DB_SCHEMA.ORDER_LIST!.SCHEMA}.${DB_SCHEMA.ORDER_LIST!.TABLE}`;
const ORDER_EXPIRED_TABLE = `${DB_SCHEMA.ORDER_EXPIRED!.SCHEMA}.${DB_SCHEMA.ORDER_EXPIRED!.TABLE}`;
const ORDER_CANCELED_TABLE = `${DB_SCHEMA.ORDER_CANCELED!.SCHEMA}.${DB_SCHEMA.ORDER_CANCELED!.TABLE}`;

/** Prefix id_order: MAVL (khách lẻ), MAVC (CTV), MAVK (Deal Sốc). */
export type IdOrderPrefix = "MAVL" | "MAVC" | "MAVK";

/** Sinh mã giao dịch MAVP... (dùng cho wallet_transaction.transaction_id). */
export function generateMavpTransactionId(): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  const n = String(Date.now()).slice(-6);
  return `MAVP${n}${r}`.slice(0, 16);
}

/** Sinh một id_order duy nhất (MAVL/MAVC/MAVK + timestamp + random). */
export function generateUniqueIdOrder(prefix: IdOrderPrefix): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  const n = String(Date.now()).slice(-6);
  return `${prefix}${n}${r}`.slice(0, 32);
}

/**
 * Tạo bộ mã đơn và transaction (gọi trước khi thanh toán để frontend dùng đúng mã, tránh trùng DB).
 * id_order: check order_list, order_expired, order_canceled, order_customer.
 * transaction_id: check wallet_transaction. Retry nếu trùng.
 */
const MAX_CODES_RETRY = 5;

export async function createPaymentCodes(
  itemCount: number,
  idOrderPrefix: IdOrderPrefix = "MAVL"
): Promise<{ orderIds: string[]; transactionId: string }> {
  if (itemCount < 1 || itemCount > 100) {
    throw new Error("itemCount must be between 1 and 100");
  }

  const COLS_OL = DB_SCHEMA.ORDER_LIST!.COLS as Record<string, string>;
  const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
  const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
  const idOrderColOl = (COLS_OL.ID_ORDER ?? "id_order") as string;
  const idOrderColOc = (COLS_OC.ID_ORDER ?? "id_order") as string;
  const txIdCol = COLS_WT.TRANSACTION_ID as string;
  // order_expired, order_canceled có thể dùng cột id_order (theo migration)
  const idOrderCol = "id_order";

  for (let attempt = 0; attempt < MAX_CODES_RETRY; attempt++) {
    const orderIds: string[] = [];
    for (let i = 0; i < itemCount; i++) {
      orderIds.push(generateUniqueIdOrder(idOrderPrefix));
    }
    const transactionId = generateMavpTransactionId();

    // Check trùng id_order: bất kỳ bảng order_list, order_expired, order_canceled, order_customer đã có thì sinh lại
    const existsOrderList = await pool.query(
      `SELECT 1 FROM ${ORDER_LIST_TABLE} WHERE ${idOrderColOl} = ANY($1::text[]) LIMIT 1`,
      [orderIds]
    );
    if (existsOrderList.rows.length > 0) continue;

    const existsOrderExpired = await pool.query(
      `SELECT 1 FROM ${ORDER_EXPIRED_TABLE} WHERE ${idOrderCol} = ANY($1::text[]) LIMIT 1`,
      [orderIds]
    );
    if (existsOrderExpired.rows.length > 0) continue;

    const existsOrderCanceled = await pool.query(
      `SELECT 1 FROM ${ORDER_CANCELED_TABLE} WHERE ${idOrderCol} = ANY($1::text[]) LIMIT 1`,
      [orderIds]
    );
    if (existsOrderCanceled.rows.length > 0) continue;

    const existsOrderCustomer = await pool.query(
      `SELECT 1 FROM ${ORDER_CUSTOMER_TABLE} WHERE ${idOrderColOc} = ANY($1::text[]) LIMIT 1`,
      [orderIds]
    );
    if (existsOrderCustomer.rows.length > 0) continue;

    // Check trùng transaction_id: bảng wallet_transaction
    const existsTx = await pool.query(
      `SELECT 1 FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1 LIMIT 1`,
      [transactionId]
    );
    if (existsTx.rows.length > 0) continue;

    return { orderIds, transactionId };
  }

  throw new Error("Không thể tạo mã đơn duy nhất sau vài lần thử. Vui lòng thử lại.");
}

export interface BalanceOrderItem {
  id_product: string;
  name?: string;
  variant_name?: string;
  duration?: string;
  note?: string;
  quantity: number;
  price: number; // unit price; line total = price * quantity
  /** Thông tin bổ sung (cart_item.extra_info) cho Telegram */
  extraInfo?: Record<string, string>;
}

export interface ConfirmBalancePaymentParams {
  accountId: number;
  amount: number; // total to deduct (must equal sum of item line totals)
  items: BalanceOrderItem[];
  /** MAVL | MAVC | MAVK. Default MAVL. */
  idOrderPrefix?: IdOrderPrefix;
  /** Nếu cung cấp thì dùng thay vì sinh mới (số phần tử phải bằng items.length). */
  orderIds?: string[];
  /** Nếu cung cấp cùng orderIds thì dùng thay vì sinh mới. */
  transactionId?: string;
}

export interface ConfirmBalancePaymentResult {
  newBalance: number;
  transactionId: string; // MAVPXXXXXX
  orderIds: string[]; // id_order per item
}

/**
 * Confirm balance payment: deduct Coin, update wallet, record in wallet_transactions, save to order_customer and ghi tạm order_list.
 * All in one transaction for wallet + order_customer; order_list insert chạy sau COMMIT.
 */
export async function confirmBalancePayment(
  params: ConfirmBalancePaymentParams
): Promise<ConfirmBalancePaymentResult> {
  const { accountId, amount, items, idOrderPrefix = "MAVL", orderIds: providedOrderIds, transactionId: providedTxId } = params;

  if (!items.length || amount <= 0) {
    throw new Error("Invalid order: no items or invalid amount");
  }

  const useOrderIds =
    Array.isArray(providedOrderIds) &&
    providedOrderIds.length === items.length &&
    providedTxId != null &&
    String(providedTxId).trim() !== ""
      ? providedOrderIds
      : null;
  const transactionId = useOrderIds != null && providedTxId != null ? String(providedTxId).trim() : generateMavpTransactionId();
  const orderIds: string[] = useOrderIds ?? [];

  const client = await pool.connect();
  const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
  const txIdCol = COLS_WT.TRANSACTION_ID;
  const methodCol = COLS_WT.METHOD;

  try {
    await client.query("BEGIN");

    // 1) Wallet: lock and get balance
    const walletResult = await client.query(
      `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1 FOR UPDATE`,
      [accountId]
    );

    if (walletResult.rows.length === 0) {
      await client.query(
        `INSERT INTO ${WALLET_TABLE} (account_id, balance, created_at, updated_at)
         VALUES ($1, 0, NOW(), NOW())`,
        [accountId]
      );
    }

    const balanceResult = await client.query(
      `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1 FOR UPDATE`,
      [accountId]
    );
    const currentBalance = parseInt(balanceResult.rows[0]?.balance || "0", 10);

    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = currentBalance - amount;

    // 2) Update wallet
    await client.query(
      `UPDATE ${WALLET_TABLE} SET balance = $1, updated_at = NOW() WHERE account_id = $2`,
      [newBalance, accountId]
    );

    const insertTx = await client.query(
      `INSERT INTO ${WALLET_TX_TABLE}
       (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, ${methodCol}, created_at)
       VALUES ($1, $2, 'PURCHASE', 'DEBIT', $3, $4, $5, 'Mcoin', NOW())
       RETURNING id`,
      [transactionId, accountId, amount, currentBalance, newBalance]
    );
    const paymentId = insertTx.rows[0]?.id;

    const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
    const idOrderCol = COLS_OC.ID_ORDER;
    const paymentIdCol = COLS_OC.PAYMENT_ID;

    // 4) order_customer: one row per item, each with unique id_order (dùng orderIds đã có hoặc sinh mới)
    for (let i = 0; i < items.length; i++) {
      const idOrder = orderIds[i] ?? generateUniqueIdOrder(idOrderPrefix);
      if (i >= orderIds.length) orderIds.push(idOrder);
      await client.query(
        `INSERT INTO ${ORDER_CUSTOMER_TABLE}
         (${idOrderCol}, account_id, status, ${paymentIdCol}, created_at, updated_at)
         VALUES ($1, $2, 'Đang Tạo Đơn', $3, NOW(), NOW())`,
        [idOrder, accountId, paymentId]
      );
    }

    await client.query("COMMIT");

    // 5) Success payment chung: ghi order_list + Telegram (component dùng chung Mcoin & QR)
    const orderListItems = items.map((item, i) => ({
      id_order: orderIds[i]!,
      id_product: parseInt(String(item.id_product), 10) || 0,
      price: item.price * Math.max(1, item.quantity || 1),
      information_order:
        item.extraInfo && Object.keys(item.extraInfo).length > 0 ? JSON.stringify(item.extraInfo) : null,
      duration: item.duration ?? null,
    }));
    const linesForTelegram = items.map((item, i) => ({
      idOrder: orderIds[i] ?? "",
      variantIdOrProductId: item.id_product,
      variantName: item.variant_name,
      productName: item.name,
      duration: item.duration,
      extraInfo: item.extraInfo,
    }));
    handlePaymentSuccess({
      orderIds,
      accountId,
      paymentMethod: "Mcoin",
      totalAmount: amount,
      itemsForOrderList: orderListItems,
      linesForTelegram,
      contact: process.env.FRONTEND_URL || undefined,
    });

    return { newBalance, transactionId, orderIds };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
