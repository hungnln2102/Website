/**
 * In-memory cache + singleflight (tránh stampede) + TTL jitter tùy chọn.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function ttlJitterSeconds(baseTtl: number): number {
  const maxJitter = Number(process.env.CACHE_TTL_JITTER_SEC ?? "48");
  if (!Number.isFinite(maxJitter) || maxJitter <= 0) return baseTtl;
  return baseTtl + Math.floor(Math.random() * (maxJitter + 1));
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private inflight = new Map<string, Promise<unknown>>();

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL in seconds.
   * `applyJitter` — cộng ngẫu nhiên 0…`CACHE_TTL_JITTER_SEC` (tránh expire đồng loạt).
   */
  set<T>(
    key: string,
    data: T,
    ttlSeconds: number = 300,
    applyJitter = false,
  ): void {
    const ttl = applyJitter ? ttlJitterSeconds(ttlSeconds) : ttlSeconds;
    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, { data, expiresAt });
  }

  /**
   * Lấy hoặc tính một lần cho cùng key (singleflight — nhiều request đồng thời chỉ gọi factory một lần).
   * `cacheHit === false` chỉ trên request “leader” chạy factory; request chờ chung promise có `cacheHit === true`.
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<{ value: T; cacheHit: boolean }> {
    const hit = this.get<T>(key);
    if (hit !== null) {
      return { value: hit, cacheHit: true };
    }

    let created = false;
    let work = this.inflight.get(key) as Promise<T> | undefined;
    if (!work) {
      created = true;
      work = (async () => {
        try {
          const data = await factory();
          this.set(key, data, ttlSeconds, true);
          return data;
        } finally {
          this.inflight.delete(key);
        }
      })();
      this.inflight.set(key, work);
    }

    const value = await work;
    return { value, cacheHit: !created };
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.store.delete(key);
    this.inflight.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new Cache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

/**
 * Cache decorator for async functions
 */
export function cached<T>(
  keyPrefix: string,
  ttlSeconds: number = 300
) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = cache.get<T>(cacheKey);
      if (cached !== null) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
      }

      // Execute original method
      console.log(`Cache miss: ${cacheKey}`);
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      cache.set(cacheKey, result, ttlSeconds);
      
      return result;
    };

    return descriptor;
  };
}
