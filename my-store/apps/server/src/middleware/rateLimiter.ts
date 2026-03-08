import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
/** Use Redis store when REDIS_URL or REDIS_HOST is set in production */
const useRedis = process.env.NODE_ENV === 'production' && !!(REDIS_URL || process.env.REDIS_HOST);

let redisStore: RedisStore | undefined;
if (useRedis) {
  try {
    const client = REDIS_URL
      ? new Redis(REDIS_URL)
      : new Redis({
          host: REDIS_HOST,
          port: REDIS_PORT,
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          maxRetriesPerRequest: 3,
        });
    redisStore = new RedisStore({
      sendCommand: (command: string, ...args: string[]) =>
        client.call(command, ...args) as Promise<number>,
    });
  } catch {
    redisStore = undefined;
  }
}

function createLimiter(baseOptions: Parameters<typeof rateLimit>[0]) {
  return rateLimit({
    ...baseOptions,
    ...(redisStore && { store: redisStore }),
  });
}

/**
 * General rate limiter for all API endpoints
 * Allows 1000 requests per 15 minutes per IP (increased for development)
 * Uses Redis store in production when REDIS_URL or REDIS_HOST is set
 */
export const generalLimiter = createLimiter({
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
export const strictLimiter = createLimiter({
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
export const veryStrictLimiter = createLimiter({
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
export const authLimiter = createLimiter({
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
export const checkUserLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    error: 'Quá nhiều requests kiểm tra, vui lòng thử lại sau',
    retryAfter: '5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
