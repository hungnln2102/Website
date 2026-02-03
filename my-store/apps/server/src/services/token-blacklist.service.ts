/**
 * Token Blacklist Service
 * Invalidates access tokens before their natural expiry (e.g., on logout)
 * 
 * Uses Redis when available, falls back to in-memory storage.
 */

import crypto from "crypto";
import { tokenBlacklistMap } from "../config/redis";

class TokenBlacklistService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes (for fallback mode)
    this.cleanupInterval = setInterval(() => tokenBlacklistMap.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Hash a token for storage (don't store plain tokens)
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Add a token to the blacklist
   * @param token The JWT access token to blacklist
   * @param expiresInSeconds How long until the token naturally expires
   */
  async blacklist(token: string, expiresInSeconds: number = 900): Promise<void> {
    const tokenHash = this.hashToken(token);
    await tokenBlacklistMap.set(tokenHash, true, expiresInSeconds);
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    return await tokenBlacklistMap.exists(tokenHash);
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
