/**
 * Simple in-memory cache implementation
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();

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
   * Set value in cache with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { data, expiresAt });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
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
