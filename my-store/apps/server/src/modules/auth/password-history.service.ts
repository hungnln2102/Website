/**
 * Password History Service
 * 
 * Prevents users from reusing recent passwords.
 * Stores password hashes and checks new passwords against history.
 * 
 * Security best practice: Store the last N passwords (default: 5)
 * to prevent password cycling.
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { authService } from "./auth.service";

const PASSWORD_HISTORY_TABLE = `${DB_SCHEMA.PASSWORD_HISTORY!.SCHEMA}.${DB_SCHEMA.PASSWORD_HISTORY!.TABLE}`;

// Number of recent passwords to check against
const PASSWORD_HISTORY_COUNT = 5;

class PasswordHistoryService {
  /**
   * Check if a password was recently used
   * @param userId User ID
   * @param plainPassword Plain text password to check
   * @returns true if password was recently used, false otherwise
   */
  async isPasswordReused(userId: number | string, plainPassword: string): Promise<boolean> {
    try {
      // Get recent password hashes for this user
      const result = await pool.query(
        `SELECT password_hash 
         FROM ${PASSWORD_HISTORY_TABLE} 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, PASSWORD_HISTORY_COUNT]
      );

      if (result.rows.length === 0) {
        return false;
      }

      // Check if the new password matches any recent password
      for (const row of result.rows) {
        const isMatch = await authService.verifyPassword(plainPassword, row.password_hash);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Password history check error:", error);
      // On error, allow the password change to proceed
      return false;
    }
  }

  /**
   * Add a password to history
   * Called after successful password change
   * @param userId User ID
   * @param passwordHash Hashed password (already hashed by auth service)
   */
  async addToHistory(userId: number | string, passwordHash: string): Promise<void> {
    try {
      // Insert new password hash
      await pool.query(
        `INSERT INTO ${PASSWORD_HISTORY_TABLE} (user_id, password_hash, created_at)
         VALUES ($1, $2, NOW())`,
        [userId, passwordHash]
      );

      // Clean up old entries (keep only the most recent N)
      await pool.query(
        `DELETE FROM ${PASSWORD_HISTORY_TABLE}
         WHERE user_id = $1
         AND id NOT IN (
           SELECT id FROM ${PASSWORD_HISTORY_TABLE}
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         )`,
        [userId, PASSWORD_HISTORY_COUNT]
      );
    } catch (error) {
      console.error("Password history add error:", error);
      // Don't throw - history logging should not break the main flow
    }
  }

  /**
   * Initialize password history for a user
   * Called on registration to store the initial password
   * @param userId User ID
   * @param passwordHash Hashed password
   */
  async initializeHistory(userId: number | string, passwordHash: string): Promise<void> {
    await this.addToHistory(userId, passwordHash);
  }

  /**
   * Clear password history for a user
   * Use with caution - typically only for testing or account deletion
   * @param userId User ID
   */
  async clearHistory(userId: number | string): Promise<void> {
    try {
      await pool.query(
        `DELETE FROM ${PASSWORD_HISTORY_TABLE} WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      console.error("Password history clear error:", error);
    }
  }

  /**
   * Get the number of stored passwords for a user
   * Useful for debugging/admin purposes
   */
  async getHistoryCount(userId: number | string): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM ${PASSWORD_HISTORY_TABLE} WHERE user_id = $1`,
        [userId]
      );
      return parseInt(result.rows[0]?.count || "0", 10);
    } catch (error) {
      console.error("Password history count error:", error);
      return 0;
    }
  }
}

export const passwordHistoryService = new PasswordHistoryService();
