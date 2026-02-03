/**
 * API Security Middleware
 * Comprehensive security measures for API endpoints
 */

import type { Request, Response, NextFunction } from "express";
import { captchaService } from "../services/captcha.service";
import { tokenBlacklistService } from "../services/token-blacklist.service";
import { auditService } from "../services/audit.service";
import { authService } from "../services/auth.service";

/**
 * Get client IP from request
 */
const getClientIP = (req: Request): string => {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.ip ||
    "unknown"
  ).trim();
};

/**
 * CAPTCHA verification middleware
 * Requires CAPTCHA token in request body when needed
 */
export const requireCaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = getClientIP(req);

  // Check if CAPTCHA is required for this IP
  if (!captchaService.requiresCaptcha(ip)) {
    return next();
  }

  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({
      error: "Vui lòng xác nhận CAPTCHA",
      requireCaptcha: true,
      siteKey: captchaService.getSiteKey(),
    });
  }

  const result = await captchaService.verify(captchaToken, ip);

  if (!result.success) {
    await auditService.logSecurity("CAPTCHA_FAILED", req, {
      path: req.path,
      error: result.error,
    });

    return res.status(400).json({
      error: result.error || "CAPTCHA không hợp lệ",
      requireCaptcha: true,
      siteKey: captchaService.getSiteKey(),
    });
  }

  next();
};

/**
 * Always require CAPTCHA middleware
 * Use for sensitive operations that always need CAPTCHA
 */
export const alwaysRequireCaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = getClientIP(req);
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({
      error: "CAPTCHA là bắt buộc cho thao tác này",
      requireCaptcha: true,
      siteKey: captchaService.getSiteKey(),
    });
  }

  const result = await captchaService.verify(captchaToken, ip);

  if (!result.success) {
    await auditService.logSecurity("CAPTCHA_FAILED", req, {
      path: req.path,
      error: result.error,
    });

    return res.status(400).json({
      error: result.error || "CAPTCHA không hợp lệ",
      requireCaptcha: true,
      siteKey: captchaService.getSiteKey(),
    });
  }

  next();
};

/**
 * JWT Authentication middleware
 * Verifies access token and checks blacklist
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Yêu cầu xác thực" });
  }

  const token = authHeader.substring(7);

  // Check if token is blacklisted
  if (await tokenBlacklistService.isBlacklisted(token)) {
    await auditService.logSecurity("INVALID_TOKEN", req, {
      reason: "blacklisted",
    });
    return res.status(401).json({ error: "Token đã bị vô hiệu hóa" });
  }

  try {
    const decoded = authService.verifyAccessToken(token);
    
    // Attach user info to request
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token đã hết hạn" });
    }
    
    await auditService.logSecurity("INVALID_TOKEN", req, {
      reason: err.message,
    });
    
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);

  // Check if token is blacklisted
  if (await tokenBlacklistService.isBlacklisted(token)) {
    return next(); // Just continue without auth
  }

  try {
    const decoded = authService.verifyAccessToken(token);
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch {
    // Token invalid - just continue without auth
  }

  next();
};

/**
 * API Key authentication middleware
 * For server-to-server communication
 */
export const requireApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.API_SECRET_KEY;

  if (!validApiKey) {
    console.error("API_SECRET_KEY not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!apiKey || apiKey !== validApiKey) {
    auditService.logSecurity("INVALID_TOKEN", req, {
      reason: "invalid_api_key",
    });
    return res.status(401).json({ error: "API key không hợp lệ" });
  }

  next();
};

/**
 * Request validation middleware
 * Validates common security patterns in request body VALUES (not JSON structure)
 * 
 * NOTE: We check individual VALUES to avoid false positives from JSON syntax
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // SQL injection patterns - check values only, not JSON structure quotes
  // Match: single quotes, semicolons, comments, SQL keywords
  const sqlPatterns = /(';|'--|;\s*--|'\s*OR\s+|'\s*AND\s+|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\s+\w)/i;
  
  // XSS patterns
  const xssPatterns = /<script|javascript:|on\w+\s*=/i;
  
  // Extract and check values from request body
  const checkValue = (value: unknown): boolean => {
    if (typeof value === 'string') {
      if (sqlPatterns.test(value)) {
        auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
          type: "sql_injection_attempt",
          path: req.path,
        });
        return false;
      }
      if (xssPatterns.test(value)) {
        auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
          type: "xss_attempt",
          path: req.path,
        });
        return false;
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const v of Object.values(value)) {
        if (!checkValue(v)) return false;
      }
    }
    return true;
  };
  
  if (!checkValue(req.body)) {
    return res.status(400).json({ error: "Yêu cầu không hợp lệ" });
  }

  next();
};

/**
 * Content-Type validation middleware
 * Ensures proper Content-Type for POST/PUT/PATCH requests
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    
    // Allow JSON and form data
    if (
      contentType &&
      !contentType.includes("application/json") &&
      !contentType.includes("multipart/form-data") &&
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      return res.status(415).json({ error: "Unsupported Media Type" });
    }
  }

  next();
};

/**
 * Request size limiter
 * Prevents large payload attacks
 */
export const limitPayloadSize = (maxSizeKB: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    const maxSize = maxSizeKB * 1024;

    if (contentLength > maxSize) {
      auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
        type: "large_payload",
        size: contentLength,
        maxAllowed: maxSize,
      });
      return res.status(413).json({ error: "Payload quá lớn" });
    }

    next();
  };
};

/**
 * IP blocking middleware
 * Blocks requests from banned IPs
 */
const bannedIPs = new Set<string>();
const banDuration = 24 * 60 * 60 * 1000; // 24 hours

export const addBannedIP = (ip: string) => {
  bannedIPs.add(ip);
  setTimeout(() => bannedIPs.delete(ip), banDuration);
};

export const checkBannedIP = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = getClientIP(req);

  if (bannedIPs.has(ip)) {
    return res.status(403).json({ error: "Truy cập bị từ chối" });
  }

  next();
};

/**
 * Honeypot field detection
 * Detects bots that fill in hidden honeypot fields
 */
export const checkHoneypot = (fieldName: string = "_hp_field") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body[fieldName]) {
      const ip = getClientIP(req);
      
      auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
        type: "honeypot_triggered",
        ip,
      });

      // Ban the IP
      addBannedIP(ip);

      // Return success to confuse bots
      return res.json({ success: true });
    }

    next();
  };
};

/**
 * Request timing attack prevention
 * Adds random delay to prevent timing-based attacks
 */
export const preventTimingAttack = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add random delay between 50-150ms
  const delay = 50 + Math.random() * 100;
  setTimeout(next, delay);
};

/**
 * Security headers middleware (additional to helmet)
 */
export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent caching of sensitive data
  if (req.path.includes("/api/auth/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  // Add additional security headers
  res.setHeader("X-Request-Id", `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  next();
};

/**
 * Combine multiple security middlewares
 */
export const apiSecurityMiddleware = [
  checkBannedIP,
  validateContentType,
  validateRequest,
  additionalSecurityHeaders,
];
