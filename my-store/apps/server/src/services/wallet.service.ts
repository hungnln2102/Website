/**
 * Wallet Service
 * Manages customer wallet balance and transactions
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const WALLET_TABLE = `${DB_SCHEMA.WALLET!.SCHEMA}.${DB_SCHEMA.WALLET!.TABLE}`;
const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;

export interface WalletTransaction {
  id: string;
  accountId: number;
  type: "TOPUP" | "PURCHASE" | "REFUND" | "ADJUST";
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  refType?: string;
  refId?: string;
  description?: string;
  method?: string | null;
  promotionId?: number | null;
  status?: string | null;
  createdAt: Date;
}

/**
 * Get wallet balance for a user
 * Creates wallet if not exists
 */
export async function getBalance(accountId: number): Promise<number> {
  // Try to get existing wallet
  const result = await pool.query(
    `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1`,
    [accountId]
  );

  if (result.rows.length > 0) {
    return parseInt(result.rows[0].balance) || 0;
  }

  // Create wallet if not exists
  await pool.query(
    `INSERT INTO ${WALLET_TABLE} (account_id, balance, created_at, updated_at)
     VALUES ($1, 0, NOW(), NOW())
     ON CONFLICT (account_id) DO NOTHING`,
    [accountId]
  );

  return 0;
}

/**
 * Add funds to wallet (CREDIT)
 */
export async function addFunds(
  accountId: number,
  amount: number,
  type: "TOPUP" | "REFUND" | "ADJUST",
  options?: {
    refType?: string;
    refId?: string;
    description?: string;
    method?: string;
    promotionId?: number | null;
  }
): Promise<{ newBalance: number; transaction: WalletTransaction }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current balance (with lock)
    const balanceResult = await client.query(
      `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1 FOR UPDATE`,
      [accountId]
    );

    let currentBalance = 0;

    if (balanceResult.rows.length === 0) {
      // Create wallet
      await client.query(
        `INSERT INTO ${WALLET_TABLE} (account_id, balance, created_at, updated_at)
         VALUES ($1, 0, NOW(), NOW())`,
        [accountId]
      );
    } else {
      currentBalance = parseInt(balanceResult.rows[0].balance) || 0;
    }

    const newBalance = currentBalance + amount;

    // Update balance
    await client.query(
      `UPDATE ${WALLET_TABLE} SET balance = $1, updated_at = NOW() WHERE account_id = $2`,
      [newBalance, accountId]
    );

    // Create transaction record (id bigserial; business key = transaction_id)
    const txId = `TX${accountId}${Date.now().toString(36).toUpperCase()}`;
    const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
    const txIdCol = COLS_WT.TRANSACTION_ID as string;
    const methodCol = COLS_WT.METHOD as string;
    const promotionIdCol = COLS_WT.PROMOTION_ID as string;
    await client.query(
      `INSERT INTO ${WALLET_TX_TABLE}
       (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, ${methodCol}, ${promotionIdCol}, created_at)
       VALUES ($1, $2, $3, 'CREDIT', $4, $5, $6, $7, $8, NOW())`,
      [
        txId,
        accountId,
        type,
        amount,
        currentBalance,
        newBalance,
        options?.method || (type === "TOPUP" ? "topup" : type.toLowerCase()),
        options?.promotionId ?? null,
      ]
    );

    await client.query("COMMIT");

    return {
      newBalance,
      transaction: {
        id: txId,
        accountId,
        type,
        direction: "CREDIT",
        amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        refType: options?.refType,
        refId: options?.refId,
        description: options?.description,
        method: options?.method ?? (type === "TOPUP" ? "topup" : type.toLowerCase()),
        promotionId: options?.promotionId ?? null,
        status: "completed",
        createdAt: new Date(),
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Deduct funds from wallet (DEBIT)
 */
export async function deductFunds(
  accountId: number,
  amount: number,
  type: "PURCHASE" | "ADJUST",
  options?: {
    refType?: string;
    refId?: string;
    description?: string;
    method?: string;
    promotionId?: number | null;
  }
): Promise<{ newBalance: number; transaction: WalletTransaction }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current balance (with lock)
    const balanceResult = await client.query(
      `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1 FOR UPDATE`,
      [accountId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error("Wallet not found");
    }

    const currentBalance = parseInt(balanceResult.rows[0].balance) || 0;

    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = currentBalance - amount;

    // Update balance
    await client.query(
      `UPDATE ${WALLET_TABLE} SET balance = $1, updated_at = NOW() WHERE account_id = $2`,
      [newBalance, accountId]
    );

    // Create transaction record (id bigserial; business key = transaction_id)
    const txId = `TX${accountId}${Date.now().toString(36).toUpperCase()}`;
    const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
    const txIdCol = COLS_WT.TRANSACTION_ID as string;
    const methodCol = COLS_WT.METHOD as string;
    const promotionIdCol = COLS_WT.PROMOTION_ID as string;
    await client.query(
      `INSERT INTO ${WALLET_TX_TABLE}
       (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, ${methodCol}, ${promotionIdCol}, created_at)
       VALUES ($1, $2, $3, 'DEBIT', $4, $5, $6, $7, $8, NOW())`,
      [
        txId,
        accountId,
        type,
        amount,
        currentBalance,
        newBalance,
        options?.method ?? (type === "PURCHASE" ? "balance" : "adjust"),
        options?.promotionId ?? null,
      ]
    );

    await client.query("COMMIT");

    return {
      newBalance,
      transaction: {
        id: txId,
        accountId,
        type,
        direction: "DEBIT",
        amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        refType: options?.refType,
        refId: options?.refId,
        description: options?.description,
        method: options?.method ?? (type === "PURCHASE" ? "balance" : "adjust"),
        promotionId: options?.promotionId ?? null,
        status: "completed",
        createdAt: new Date(),
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get transaction history from wallet_transactions (đầy đủ thông tin).
 * Mã đơn = transaction_id, Số dư = balance_after, Số tiền = amount (theo method),
 * Thời gian = created_at, Phương thức = method, Khuyến mãi = promo_code, Trạng thái = type.
 * LEFT JOIN order_customer để lấy id_order khi có (payment_id = wt.id).
 */
export async function getTransactions(
  accountId: number,
  limit: number = 20
): Promise<WalletTransaction[]> {
  const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
  const txIdCol = COLS_WT.TRANSACTION_ID as string;
  const methodCol = COLS_WT.METHOD as string;
  const idCol = COLS_WT.ID as string;
  const promotionIdCol = COLS_WT.PROMOTION_ID as string;
  const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
  const OC_PAYMENT_ID = DB_SCHEMA.ORDER_CUSTOMER!.COLS.PAYMENT_ID;

  const result = await pool.query(
    `SELECT wt.id, wt.${txIdCol}, wt.account_id, wt.type, wt.direction, wt.amount,
            wt.balance_before, wt.balance_after, wt.${methodCol}, wt.${promotionIdCol}, wt.created_at,
            oc.id_order
     FROM ${WALLET_TX_TABLE} wt
     LEFT JOIN ${ORDER_CUSTOMER_TABLE} oc ON (oc.account_id = wt.account_id AND oc.${OC_PAYMENT_ID} = wt.${idCol})
     WHERE wt.account_id = $1
     ORDER BY wt.created_at DESC
     LIMIT $2`,
    [accountId, limit]
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    id: String(row[txIdCol] ?? row.id),
    accountId: Number(row.account_id) || 0,
    type: row.type as WalletTransaction["type"],
    direction: row.direction as WalletTransaction["direction"],
    amount: parseInt(String(row.amount)) || 0,
    balanceBefore: parseInt(String(row.balance_before)) || 0,
    balanceAfter: parseInt(String(row.balance_after)) || 0,
    refType: row.id_order ? "ORDER" : undefined,
    refId: (row.id_order as string) ?? undefined,
    description: undefined,
    method: (row[methodCol] as string | null) ?? null,
    promotionId: (row[promotionIdCol] as number | null) ?? null,
    status: (row.type as string) ?? undefined,
    createdAt: row.created_at as Date,
  }));
}

export const walletService = {
  getBalance,
  addFunds,
  deductFunds,
  getTransactions,
};
