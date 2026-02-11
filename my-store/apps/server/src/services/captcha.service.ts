/**
 * CAPTCHA Service - Cloudflare Turnstile
 * More secure than Google reCAPTCHA, harder to bypass
 * 
 * Uses Redis when available, falls back to in-memory storage.
 */

import { captchaAttemptsMap } from "../config/redis";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

const CAPTCHA_THRESHOLD = 3; // Show CAPTCHA after 3 failed attempts
const ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 minutes

class CaptchaService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes (for fallback mode)
    this.cleanupInterval = setInterval(() => captchaAttemptsMap.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if CAPTCHA is configured
   */
  isConfigured(): boolean {
    return !!TURNSTILE_SECRET_KEY && !!TURNSTILE_SITE_KEY;
  }

  /**
   * Check if an IP requires CAPTCHA verification
   */
  async requiresCaptcha(ipAddress: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const count = await captchaAttemptsMap.get(ipAddress);
    return count !== null && count >= CAPTCHA_THRESHOLD;
  }

  /**
   * Sync version for middleware (checks cache)
   */
  requiresCaptchaSync(_ipAddress: string): boolean {
    // For sync check, we need to maintain a local cache
    // This is called from middleware where async isn't ideal
    return false; // Will be checked async in the route handler
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(ipAddress: string): Promise<void> {
    await captchaAttemptsMap.incr(ipAddress, ATTEMPT_WINDOW_SECONDS);
  }

  /**
   * Clear failed attempts on successful login
   */
  async clearFailedAttempts(ipAddress: string): Promise<void> {
    await captchaAttemptsMap.delete(ipAddress);
  }

  /**
   * Verify a Cloudflare Turnstile token
   */
  async verify(
    token: string,
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!TURNSTILE_SECRET_KEY) {
      console.warn("[CAPTCHA] Turnstile secret key not configured, skipping verification");
      return { success: true };
    }

    if (!token) {
      return { success: false, error: "CAPTCHA token is required" };
    }

    try {
      const formData = new URLSearchParams();
      formData.append("secret", TURNSTILE_SECRET_KEY);
      formData.append("response", token);
      
      if (ipAddress) {
        formData.append("remoteip", ipAddress);
      }

      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = (await response.json()) as TurnstileResponse;

      if (!data.success) {
        const errorCodes = data["error-codes"]?.join(", ") || "unknown";
        console.warn(`[CAPTCHA] Turnstile verification failed: ${errorCodes}`);
        return { success: false, error: `Xác minh CAPTCHA thất bại` };
      }

      return { success: true };
    } catch (error) {
      console.error("[CAPTCHA] Turnstile verification error:", error);
      return { success: false, error: "Lỗi xác minh CAPTCHA" };
    }
  }

  /**
   * Get the site key for frontend
   */
  getSiteKey(): string | undefined {
    return TURNSTILE_SITE_KEY;
  }

  /**
   * Destroy service (cleanup intervals)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const captchaService = new CaptchaService();
