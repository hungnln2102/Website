import rateLimit from 'express-rate-limit';

/**
 * General rate limiter for all API endpoints
 * Allows 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip for health check endpoint
    return req.path === '/';
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
