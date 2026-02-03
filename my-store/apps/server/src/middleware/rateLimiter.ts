import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * 
 * TODO: PRODUCTION - Use Redis store for distributed systems:
 * ```
 * npm install rate-limit-redis ioredis
 * 
 * import RedisStore from 'rate-limit-redis';
 * import Redis from 'ioredis';
 * 
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * const limiter = rateLimit({
 *   store: new RedisStore({
 *     sendCommand: (...args) => redis.call(...args),
 *   }),
 *   windowMs: 15 * 60 * 1000,
 *   max: 100,
 *   // ... other options
 * });
 * ```
 */

/**
 * General rate limiter for all API endpoints
 * Allows 1000 requests per 15 minutes per IP (increased for development)
 */
export const generalLimiter = rateLimit({
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
    // Skip for health check and public read endpoints
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
export const strictLimiter = rateLimit({
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
export const veryStrictLimiter = rateLimit({
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
export const authLimiter = rateLimit({
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
export const checkUserLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    error: 'Quá nhiều requests kiểm tra, vui lòng thử lại sau',
    retryAfter: '5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
