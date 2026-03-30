import { getRedisClient, isRedisAvailable } from "../config/redis";

interface FallbackCacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private readonly defaultTTL = 300;
  private readonly fallbackStore = new Map<string, FallbackCacheEntry<unknown>>();

  private getFallbackEntry<T>(key: string): T | null {
    const entry = this.fallbackStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.fallbackStore.delete(key);
      return null;
    }

    return entry.value as T;
  }

  private setFallbackValue<T>(key: string, value: T, ttl: number): void {
    this.fallbackStore.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  private currentRedis() {
    return getRedisClient();
  }

  isAvailable(): boolean {
    return isRedisAvailable();
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        const value = await redis.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
      } catch (error) {
        console.error("Cache get error:", error);
      }
    }

    return this.getFallbackEntry<T>(key);
  }

  async set(key: string, value: unknown, ttl: number = this.defaultTTL): Promise<void> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        const serialized = JSON.stringify(value);
        await redis.set(key, serialized, "EX", ttl);
        return;
      } catch (error) {
        console.error("Cache set error:", error);
      }
    }

    this.setFallbackValue(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        console.error("Cache delete error:", error);
      }
    }

    this.fallbackStore.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (error) {
        console.error("Cache delete pattern error:", error);
      }
    }

    if (!pattern.includes("*")) {
      this.fallbackStore.delete(pattern);
      return;
    }

    const regex = new RegExp(
      `^${pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")}$`
    );

    for (const key of this.fallbackStore.keys()) {
      if (regex.test(key)) {
        this.fallbackStore.delete(key);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        const result = await redis.exists(key);
        return result === 1;
      } catch (error) {
        console.error("Cache exists error:", error);
      }
    }

    return this.getFallbackEntry(key) !== null;
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  async incr(key: string): Promise<number> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        return await redis.incr(key);
      } catch (error) {
        console.error("Cache incr error:", error);
      }
    }

    const current = this.getFallbackEntry<number>(key) ?? 0;
    const next = current + 1;
    this.setFallbackValue(key, next, this.defaultTTL);
    return next;
  }

  async decr(key: string): Promise<number> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        return await redis.decr(key);
      } catch (error) {
        console.error("Cache decr error:", error);
      }
    }

    const current = this.getFallbackEntry<number>(key) ?? 0;
    const next = current - 1;
    this.setFallbackValue(key, next, this.defaultTTL);
    return next;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        await redis.expire(key, seconds);
      } catch (error) {
        console.error("Cache expire error:", error);
      }
    }

    const entry = this.fallbackStore.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }

  async flushAll(): Promise<void> {
    const redis = this.currentRedis();

    if (redis) {
      try {
        await redis.flushdb();
        console.log("Cache flushed from Redis");
      } catch (error) {
        console.error("Cache flush error:", error);
      }
    }

    this.fallbackStore.clear();
  }
}

export const cacheService = new CacheService();
