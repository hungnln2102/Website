/**
 * Balance (MCoin) payment: deduct wallet, record transaction, save order to order_customer only.
 * Không ghi vào order_list khi thanh toán; Lịch sử đơn hàng vẫn tham chiếu order_list để lấy dữ liệu (khi đã có).
 * Mỗi sản phẩm = 1 id_order unique; payment_id = wallet_transaction.id (integer).
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { notifyNewOrder } from "./telegram.service";

const WALLET_TABLE = `${DB_SCHEMA.WALLET!.SCHEMA}.${DB_SCHEMA.WALLET!.TABLE}`;
const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;

/** Prefix id_order: MAVL (khách lẻ), MAVC (CTV), MAVK (Deal Sốc). */
export type IdOrderPrefix = "MAVL" | "MAVC" | "MAVK";

export function generateMavpTransactionId(): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  const n = String(Date.now()).slice(-6);
  return `MAVP${n}${r}`.slice(0, 16);
}

export function generateUniqueIdOrder(prefix: IdOrderPrefix): string {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  const n = String(Date.now()).slice(-6);
  return `${prefix}${n}${r}`.slice(0, 32);
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
}

export interface ConfirmBalancePaymentResult {
  newBalance: number;
  transactionId: string; // MAVPXXXXXX
  orderIds: string[]; // id_order per item
}

/**
 * Confirm balance payment: deduct Coin, update wallet, record in wallet_transactions, save to order_customer only (no order_list insert).
 * All in one transaction.
 */
export async function confirmBalancePayment(
  params: ConfirmBalancePaymentParams
): Promise<ConfirmBalancePaymentResult> {
  const { accountId, amount, items, idOrderPrefix = "MAVL" } = params;

  if (!items.length || amount <= 0) {
    throw new Error("Invalid order: no items or invalid amount");
  }

  const client = await pool.connect();
  const transactionId = generateMavpTransactionId();
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
    const orderIds: string[] = [];

    // 4) order_customer only: one row per item, each with unique id_order (không ghi order_list)
    for (const _ of items) {
      const idOrder = generateUniqueIdOrder(idOrderPrefix);
      orderIds.push(idOrder);
      await client.query(
        `INSERT INTO ${ORDER_CUSTOMER_TABLE}
         (${idOrderCol}, account_id, status, ${paymentIdCol}, created_at, updated_at)
         VALUES ($1, $2, 'Đang Tạo Đơn', $3, NOW(), NOW())`,
        [idOrder, accountId, paymentId]
      );
    }

    await client.query("COMMIT");

    // Gửi thông báo Telegram (component dùng chung Mcoin + QR)
    console.log("[BalancePayment] Sending Telegram notification for orderIds:", orderIds);
    notifyNewOrder({
      paymentMethod: "Mcoin",
      orderIds,
      lines: items.map((item, i) => ({
        idOrder: orderIds[i] ?? "",
        variantIdOrProductId: item.id_product,
        variantName: item.variant_name,
        productName: item.name,
        duration: item.duration,
        extraInfo: item.extraInfo,
      })),
      totalAmount: amount,
    }).catch((err) => {
      console.error("[BalancePayment] Telegram notification failed:", err);
    });

    return { newBalance, transactionId, orderIds };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
