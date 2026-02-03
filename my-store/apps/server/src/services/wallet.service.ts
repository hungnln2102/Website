/**
 * Wallet Service
 * Manages customer wallet balance and transactions
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const WALLET_TABLE = `${DB_SCHEMA.WALLET.SCHEMA}.${DB_SCHEMA.WALLET.TABLE}`;
const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION.TABLE}`;

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

    // Create transaction record
    const txId = `TX${accountId}${Date.now().toString(36).toUpperCase()}`;
    await client.query(
      `INSERT INTO ${WALLET_TX_TABLE} 
       (id, account_id, type, direction, amount, balance_before, balance_after, ref_type, ref_id, description, created_at)
       VALUES ($1, $2, $3, 'CREDIT', $4, $5, $6, $7, $8, $9, NOW())`,
      [
        txId,
        accountId,
        type,
        amount,
        currentBalance,
        newBalance,
        options?.refType || null,
        options?.refId || null,
        options?.description || null,
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

    // Create transaction record
    const txId = `TX${accountId}${Date.now().toString(36).toUpperCase()}`;
    await client.query(
      `INSERT INTO ${WALLET_TX_TABLE} 
       (id, account_id, type, direction, amount, balance_before, balance_after, ref_type, ref_id, description, created_at)
       VALUES ($1, $2, $3, 'DEBIT', $4, $5, $6, $7, $8, $9, NOW())`,
      [
        txId,
        accountId,
        type,
        amount,
        currentBalance,
        newBalance,
        options?.refType || null,
        options?.refId || null,
        options?.description || null,
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
 * Get transaction history
 */
export async function getTransactions(
  accountId: number,
  limit: number = 20
): Promise<WalletTransaction[]> {
  const result = await pool.query(
    `SELECT id, account_id, type, direction, amount, balance_before, balance_after, 
            ref_type, ref_id, description, created_at
     FROM ${WALLET_TX_TABLE}
     WHERE account_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [accountId, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    accountId: row.account_id,
    type: row.type,
    direction: row.direction,
    amount: parseInt(row.amount) || 0,
    balanceBefore: parseInt(row.balance_before) || 0,
    balanceAfter: parseInt(row.balance_after) || 0,
    refType: row.ref_type,
    refId: row.ref_id,
    description: row.description,
    createdAt: row.created_at,
  }));
}

export const walletService = {
  getBalance,
  addFunds,
  deductFunds,
  getTransactions,
};
