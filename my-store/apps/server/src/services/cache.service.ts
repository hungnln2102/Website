import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');

// Create Redis client
let redis: Redis | null = null;

try {
  redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DB,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
  });
} catch (error) {
  console.warn('⚠️  Redis not available. Caching disabled.');
  redis = null;
}

export class CacheService {
  private redis: Redis | null;
  private defaultTTL = 300; // 5 minutes

  constructor() {
    this.redis = redis;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.redis!.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const serialized = JSON.stringify(value);
      await this.redis!.setex(key, ttl, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      return await this.redis!.incr(key);
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decr(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      return await this.redis!.decr(key);
    } catch (error) {
      console.error('Cache decr error:', error);
      return 0;
    }
  }

  /**
   * Set expiration time
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.expire(key, seconds);
    } catch (error) {
      console.error('Cache expire error:', error);
    }
  }

  /**
   * Flush all cache
   */
  async flushAll(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.redis!.flushdb();
      console.log('✅ Cache flushed');
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
}

// Export singleton
export const cacheService = new CacheService();

// Export Redis client for advanced usage
export { redis };
