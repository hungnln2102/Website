/**
 * Refresh Token Service
 * Manages refresh tokens stored in database for secure session management
 */

import crypto from "crypto";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const REFRESH_TOKEN_TABLE = `${DB_SCHEMA.REFRESH_TOKEN!.SCHEMA}.${DB_SCHEMA.REFRESH_TOKEN!.TABLE}`;

// Refresh token expiry: 7 days
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface CreateTokenParams {
  userId: number | string;
  deviceInfo?: string;
  ipAddress?: string;
}

interface RefreshTokenRecord {
  id: number;
  user_id: number;
  token_hash: string;
  device_info: string | null;
  ip_address: string | null;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}

class RefreshTokenService {
  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  /**
   * Hash a token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Create and store a new refresh token
   * Returns the plain token (only returned once, not stored)
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    const { userId, deviceInfo, ipAddress } = params;
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await pool.query(
      `INSERT INTO ${REFRESH_TOKEN_TABLE} 
        (user_id, token_hash, device_info, ip_address, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, tokenHash, deviceInfo || null, ipAddress || null, expiresAt]
    );

    return token;
  }

  /**
   * Validate a refresh token and return the user_id if valid
   */
  async validateToken(token: string): Promise<{ userId: number; tokenId: number } | null> {
    const tokenHash = this.hashToken(token);

    const result = await pool.query<RefreshTokenRecord>(
      `SELECT id, user_id, expires_at, revoked_at 
       FROM ${REFRESH_TOKEN_TABLE}
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const record = result.rows[0]!;

    if (record.revoked_at) {
      return null;
    }

    if (new Date() > new Date(record.expires_at)) {
      return null;
    }

    return { userId: record.user_id, tokenId: record.id };
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const result = await pool.query(
      `UPDATE ${REFRESH_TOKEN_TABLE} 
       SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Revoke all refresh tokens for a user (e.g., on password change or logout all)
   */
  async revokeAllUserTokens(userId: number | string): Promise<number> {
    const result = await pool.query(
      `UPDATE ${REFRESH_TOKEN_TABLE} 
       SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );

    return result.rowCount ?? 0;
  }

  /**
   * Revoke a specific token by ID
   */
  async revokeTokenById(tokenId: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE ${REFRESH_TOKEN_TABLE} 
       SET revoked_at = NOW()
       WHERE id = $1 AND revoked_at IS NULL`,
      [tokenId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: number | string): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, device_info, ip_address, created_at, expires_at
       FROM ${REFRESH_TOKEN_TABLE}
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await pool.query(
      `DELETE FROM ${REFRESH_TOKEN_TABLE}
       WHERE expires_at < NOW() OR revoked_at IS NOT NULL`
    );

    return result.rowCount ?? 0;
  }

  /**
   * Rotate a refresh token (revoke old, create new)
   * This provides additional security - each token can only be used once
   */
  async rotateToken(
    oldToken: string,
    params: CreateTokenParams
  ): Promise<string | null> {
    const validation = await this.validateToken(oldToken);
    if (!validation) {
      return null;
    }

    // Revoke old token
    await this.revokeToken(oldToken);

    // Create new token
    return this.createToken(params);
  }
}

export const refreshTokenService = new RefreshTokenService();
