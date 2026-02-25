/**
 * Redis Configuration
 * 
 * Provides Redis client for caching and session management.
 * Falls back to in-memory storage if Redis is not available.
 */

import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || "0", 10);

let redisClient: Redis | null = null;
let isRedisConnected = false;

/**
 * Initialize Redis connection
 */
export function initRedis(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      redisClient = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD || undefined,
        db: REDIS_DB,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn("[Redis] Max retries reached, falling back to in-memory");
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 2000,
      });

      redisClient.on("connect", () => {
        console.log("[Redis] Connected successfully");
        isRedisConnected = true;
        resolve(true);
      });

      redisClient.on("error", (err) => {
        if (isRedisConnected) {
          console.error("[Redis] Connection error:", err.message);
        }
        isRedisConnected = false;
      });

      redisClient.on("close", () => {
        isRedisConnected = false;
      });

      // Timeout for initial connection (short so server can start without waiting)
      setTimeout(() => {
        if (!isRedisConnected) {
          redisClient?.disconnect?.();
          redisClient = null;
          console.warn("[Redis] Connection timeout, using in-memory fallback");
          resolve(false);
        }
      }, 2000);

    } catch (error) {
      console.warn("[Redis] Failed to initialize:", error);
      resolve(false);
    }
  });
}

/**
 * Get Redis client (may be null if not connected)
 */
export function getRedisClient(): Redis | null {
  return isRedisConnected ? redisClient : null;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isRedisConnected && redisClient !== null;
}

/**
 * Redis-backed Map with in-memory fallback
 * Use this for services that need to work with or without Redis
 */
export class RedisMap<T> {
  private prefix: string;
  private fallbackMap: Map<string, { value: T; expiresAt: number }> = new Map();
  private defaultTTL: number;

  constructor(prefix: string, defaultTTLSeconds: number = 900) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTLSeconds;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTTL;
    const redis = getRedisClient();

    if (redis) {
      await redis.set(this.getKey(key), JSON.stringify(value), "EX", ttl);
    } else {
      this.fallbackMap.set(key, {
        value,
        expiresAt: Date.now() + ttl * 1000,
      });
    }
  }

  async get(key: string): Promise<T | null> {
    const redis = getRedisClient();

    if (redis) {
      const data = await redis.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } else {
      const entry = this.fallbackMap.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.fallbackMap.delete(key);
        return null;
      }
      return entry.value;
    }
  }

  async delete(key: string): Promise<void> {
    const redis = getRedisClient();

    if (redis) {
      await redis.del(this.getKey(key));
    } else {
      this.fallbackMap.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    const redis = getRedisClient();

    if (redis) {
      return (await redis.exists(this.getKey(key))) === 1;
    } else {
      const entry = this.fallbackMap.get(key);
      if (!entry) return false;
      if (Date.now() > entry.expiresAt) {
        this.fallbackMap.delete(key);
        return false;
      }
      return true;
    }
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const ttl = ttlSeconds ?? this.defaultTTL;
    const redis = getRedisClient();

    if (redis) {
      const fullKey = this.getKey(key);
      const value = await redis.incr(fullKey);
      if (value === 1) {
        await redis.expire(fullKey, ttl);
      }
      return value;
    } else {
      const entry = this.fallbackMap.get(key);
      let newValue: number;
      
      if (!entry || Date.now() > entry.expiresAt) {
        newValue = 1;
      } else {
        newValue = (entry.value as unknown as number) + 1;
      }
      
      this.fallbackMap.set(key, {
        value: newValue as unknown as T,
        expiresAt: Date.now() + ttl * 1000,
      });
      
      return newValue;
    }
  }

  async getAll(pattern: string): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const redis = getRedisClient();

    if (redis) {
      const keys = await redis.keys(`${this.prefix}:${pattern}`);
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const shortKey = key.replace(`${this.prefix}:`, "");
          result.set(shortKey, JSON.parse(data));
        }
      }
    } else {
      const now = Date.now();
      for (const [key, entry] of this.fallbackMap.entries()) {
        if (now <= entry.expiresAt) {
          result.set(key, entry.value);
        }
      }
    }

    return result;
  }

  /**
   * Cleanup expired entries (only for fallback mode)
   */
  cleanup(): void {
    if (!isRedisAvailable()) {
      const now = Date.now();
      for (const [key, entry] of this.fallbackMap.entries()) {
        if (now > entry.expiresAt) {
          this.fallbackMap.delete(key);
        }
      }
    }
  }
}

// Export singleton maps for common use cases
export const tokenBlacklistMap = new RedisMap<boolean>("blacklist", 900); // 15 min
export const loginAttemptsMap = new RedisMap<{ count: number; lockedUntil: number }>("login", 900);
export const captchaAttemptsMap = new RedisMap<number>("captcha", 900);
export const csrfTokenMap = new RedisMap<{ userId: string | null; createdAt: number }>("csrf", 3600);
