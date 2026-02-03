/**
 * CSRF Protection Middleware
 * 
 * Implements Double Submit Cookie pattern for SPA applications.
 * 
 * How it works:
 * 1. Client requests CSRF token from /api/auth/csrf-token
 * 2. Server returns token in both cookie and response body
 * 3. Client includes token in X-CSRF-Token header for state-changing requests
 * 4. Server validates that cookie token matches header token
 */

import type { Request, Response, NextFunction } from "express";
import { csrfService } from "../services/csrf.service";
import { auditService } from "../services/audit.service";

// Cookie name for CSRF token
const CSRF_COOKIE_NAME = "csrf-token";

// Header names to check for CSRF token
const CSRF_HEADER_NAMES = ["x-csrf-token", "x-xsrf-token"];

// Methods that require CSRF protection
const PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Paths that are exempt from CSRF protection (public APIs, webhooks, etc.)
// NOTE: When using app.use("/api", csrfProtection), req.path does NOT include "/api"
const EXEMPT_PATHS = [
  // Auth endpoints - these either don't change state or have other protections
  "/auth/login",        // Protected by CAPTCHA after failed attempts
  "/auth/register",     // Protected by CAPTCHA
  "/auth/refresh",      // Protected by refresh token validation
  "/auth/logout",       // Low risk - worst case user gets logged out
  "/auth/logout-all",   // Low risk - user wants to logout everywhere
  "/auth/csrf-token",   // Used to get CSRF token
  "/auth/captcha-required",
  "/auth/check-user",   // Rate limited, doesn't change state
  "/auth/sessions",     // Session management
  // Payment webhooks use signature verification instead of CSRF
  "/payment/webhook",
  "/payment/callback",
  "/payment/success",
  "/payment/error",
  "/payment/create",    // Has its own validation
  // Topup test endpoint (development only)
  "/topup/test",
];

/**
 * Check if path is exempt from CSRF protection
 */
function isExemptPath(path: string): boolean {
  return EXEMPT_PATHS.some(exempt => 
    path === exempt || path.startsWith(exempt + "/")
  );
}

/**
 * Get CSRF token from request headers
 */
function getTokenFromHeader(req: Request): string | null {
  for (const headerName of CSRF_HEADER_NAMES) {
    const token = req.headers[headerName];
    if (token && typeof token === "string") {
      return token;
    }
  }
  return null;
}

/**
 * Get CSRF token from cookie
 */
function getTokenFromCookie(req: Request): string | null {
  return req.cookies?.[CSRF_COOKIE_NAME] || null;
}

/**
 * CSRF Protection Middleware
 * 
 * Validates CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
 */
export const csrfProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF check for safe methods
  if (!PROTECTED_METHODS.includes(req.method)) {
    return next();
  }

  // Skip CSRF check for exempt paths
  if (isExemptPath(req.path)) {
    return next();
  }

  const headerToken = getTokenFromHeader(req);
  const cookieToken = getTokenFromCookie(req);

  // Both tokens must be present
  if (!headerToken || !cookieToken) {
    auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
      type: "csrf_token_missing",
      path: req.path,
      hasHeader: !!headerToken,
      hasCookie: !!cookieToken,
    });

    return res.status(403).json({
      error: "CSRF token missing",
      code: "CSRF_TOKEN_REQUIRED",
    });
  }

  // Tokens must match
  if (headerToken !== cookieToken) {
    auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
      type: "csrf_token_mismatch",
      path: req.path,
    });

    return res.status(403).json({
      error: "CSRF token invalid",
      code: "CSRF_TOKEN_INVALID",
    });
  }

  // Validate token exists in store and not expired
  if (!(await csrfService.validateToken(headerToken))) {
    auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
      type: "csrf_token_expired",
      path: req.path,
    });

    return res.status(403).json({
      error: "CSRF token expired",
      code: "CSRF_TOKEN_EXPIRED",
    });
  }

  next();
};

/**
 * Generate and set CSRF token
 * Call this after successful login or when token is requested
 */
export const setCsrfToken = async (
  res: Response,
  userId: string | null = null
): Promise<string> => {
  const token = await csrfService.generateToken(userId);

  // Set token in cookie (httpOnly: false so JavaScript can read it)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour
    path: "/",
  });

  return token;
};

/**
 * Clear CSRF token on logout
 */
export const clearCsrfToken = (res: Response): void => {
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};
