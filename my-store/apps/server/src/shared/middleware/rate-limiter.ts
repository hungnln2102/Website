import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from "../config/redis";

const REDIS_URL = process.env.REDIS_URL;
/** Use Redis store when REDIS_URL or REDIS_HOST is set in production */
const useRedis = process.env.NODE_ENV === 'production' && !!(REDIS_URL || process.env.REDIS_HOST);

function createRedisStore(prefix: string): RedisStore | undefined {
  if (!useRedis) return undefined;

  const redis = getRedisClient();
  if (!redis) {
    return undefined;
  }

  try {
    return new RedisStore({
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<number>,
      prefix,
    });
  } catch (error) {
    console.warn(
      "[RateLimiter] Redis store unavailable, using memory store:",
      (error as Error)?.message ?? error
    );
    return undefined;
  }
}

function createLimiter(name: string, baseOptions: Parameters<typeof rateLimit>[0]) {
  const store = createRedisStore(`rl:${name}:`);
  return rateLimit({
    ...baseOptions,
    ...(store && { store }),
    passOnStoreError: true,
  });
}

/**
 * General rate limiter for all API endpoints
 * Allows 1000 requests per 15 minutes per IP (increased for development)
 * Uses Redis store in production when REDIS_URL or REDIS_HOST is set
 */
export const generalLimiter = createLimiter('general', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain conditions
  skip: (req) => {
    const skipPaths = ['/', '/products', '/categories', '/promotions'];
    const isPublicRead = req.path.startsWith('/product-packages/') || 
                         req.path.startsWith('/api/variants/');
    return skipPaths.includes(req.path) || isPublicRead;
  },
});

/**
 * Strict rate limiter for data-heavy endpoints
 * Allows 10 requests per 15 minutes per IP
 */
export const strictLimiter = createLimiter('strict', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Quá nhiều requests cho endpoint này, vui lòng thử lại sau',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Very strict rate limiter for sensitive operations
 * Allows 5 requests per 15 minutes per IP
 */
export const veryStrictLimiter = createLimiter('very-strict', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Quá nhiều requests, vui lòng thử lại sau',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter for login/register - brute force protection
 * Allows 5 attempts per 15 minutes per IP
 */
export const authLimiter = createLimiter('auth', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login/register attempts per 15 minutes
  message: {
    error: 'Quá nhiều lần thử đăng nhập/đăng ký. Vui lòng đợi 15 phút.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Check user rate limiter - prevent username/email enumeration
 * Allows 10 checks per 5 minutes per IP
 */
export const checkUserLimiter = createLimiter('check-user', {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    error: 'Quá nhiều requests kiểm tra, vui lòng thử lại sau',
    retryAfter: '5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
