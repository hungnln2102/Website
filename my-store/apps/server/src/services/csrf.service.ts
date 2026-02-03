/**
 * CSRF Protection Service
 * 
 * Implements Double Submit Cookie pattern.
 * Uses Redis when available, falls back to in-memory storage.
 */

import crypto from "crypto";
import { csrfTokenMap } from "../config/redis";

// Token expiry time (1 hour)
const TOKEN_EXPIRY_SECONDS = 60 * 60;

class CsrfService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired tokens every 15 minutes (for fallback mode)
    this.cleanupInterval = setInterval(() => csrfTokenMap.cleanup(), 15 * 60 * 1000);
  }

  /**
   * Generate a new CSRF token
   */
  async generateToken(userId: string | null = null): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    
    await csrfTokenMap.set(token, {
      userId,
      createdAt: Date.now(),
    }, TOKEN_EXPIRY_SECONDS);

    return token;
  }

  /**
   * Validate a CSRF token
   */
  async validateToken(token: string, userId: string | null = null): Promise<boolean> {
    if (!token) return false;

    const stored = await csrfTokenMap.get(token);
    if (!stored) return false;

    // Check if token has expired
    if (Date.now() - stored.createdAt > TOKEN_EXPIRY_SECONDS * 1000) {
      await csrfTokenMap.delete(token);
      return false;
    }

    // If userId is provided, verify it matches
    if (userId && stored.userId && stored.userId !== userId) {
      return false;
    }

    return true;
  }

  /**
   * Invalidate a token (after use or on logout)
   */
  async invalidateToken(token: string): Promise<void> {
    await csrfTokenMap.delete(token);
  }

  /**
   * Destroy the service (cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const csrfService = new CsrfService();
