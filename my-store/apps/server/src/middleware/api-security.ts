/**
 * API Security Middleware
 * Comprehensive security measures for API endpoints
 */

import type { Request, Response, NextFunction } from "express";
import { captchaService } from "../services/captcha.service";
import { tokenBlacklistService } from "../services/token-blacklist.service";
import { auditService } from "../services/audit.service";
import { authService } from "../services/auth.service";
import {
  getClientIP,
  addBannedIP,
  checkBannedIP,
  checkHoneypot,
} from "./security/banned-ip";
import { limitPayloadSize } from "./security/limit-payload";
import { additionalSecurityHeaders } from "./security/security-headers";

export { getClientIP, addBannedIP, checkBannedIP, checkHoneypot };
export { limitPayloadSize, additionalSecurityHeaders };

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
  _res: Response,
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
 * Request timing attack prevention
 */
export const preventTimingAttack = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  const delay = 50 + Math.random() * 100;
  setTimeout(next, delay);
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
