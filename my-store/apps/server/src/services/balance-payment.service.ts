/**
 * Balance (MCoin) payment: deduct wallet, record transaction, save order to order_list
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const WALLET_TABLE = `${DB_SCHEMA.WALLET!.SCHEMA}.${DB_SCHEMA.WALLET!.TABLE}`;
const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
const ORDER_LIST_TABLE = `${DB_SCHEMA.ORDER_LIST!.SCHEMA}.${DB_SCHEMA.ORDER_LIST!.TABLE}`;

export interface BalanceOrderItem {
  id_product: string;
  name?: string;
  quantity: number;
  price: number; // unit price; line total = price * quantity
}

export interface ConfirmBalancePaymentParams {
  accountId: number;
  orderId: string;
  amount: number; // total to deduct (must equal sum of item line totals)
  items: BalanceOrderItem[];
}

export interface ConfirmBalancePaymentResult {
  newBalance: number;
}

/**
 * Confirm balance payment: deduct Coin, update user balance, save order to order_list, record in wallet_transactions.
 * All in one transaction.
 */
export async function confirmBalancePayment(
  params: ConfirmBalancePaymentParams
): Promise<ConfirmBalancePaymentResult> {
  const { accountId, orderId, amount, items } = params;

  if (!items.length || amount <= 0) {
    throw new Error("Invalid order: no items or invalid amount");
  }

  const client = await pool.connect();

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

    // 3) Insert wallet transaction (Lịch sử giao dịch - trừ Coin)
    const txId = `TX${accountId}${Date.now().toString(36).toUpperCase()}`;
    await client.query(
      `INSERT INTO ${WALLET_TX_TABLE}
       (id, account_id, type, direction, amount, balance_before, balance_after, ref_type, ref_id, description, created_at)
       VALUES ($1, $2, 'PURCHASE', 'DEBIT', $3, $4, $5, 'ORDER', $6, $7, NOW())`,
      [
        txId,
        accountId,
        amount,
        currentBalance,
        newBalance,
        orderId,
        `Thanh toán đơn hàng ${orderId}`,
      ]
    );

    // 4) Insert order_list rows (Lịch sử đơn hàng) - one row per line item
    for (const item of items) {
      const lineTotal = item.price * item.quantity;
      const informationOrder = JSON.stringify({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      });
      await client.query(
        `INSERT INTO ${ORDER_LIST_TABLE}
         (id_order, id_product, account_id, price, order_date, status, information_order)
         VALUES ($1, $2, $3, $4, NOW(), 'paid', $5)`,
        [orderId, item.id_product, accountId, lineTotal, informationOrder]
      );
    }

    await client.query("COMMIT");

    return { newBalance };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
