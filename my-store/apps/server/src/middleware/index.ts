export { authenticate, optionalAuth } from "./auth";
export { csrfProtection, setCsrfToken } from "./csrf";
export { errorHandler, asyncHandler, notFoundHandler } from "./errorHandler";
export { requestLogger } from "./logger";
export { generalLimiter, strictLimiter, veryStrictLimiter } from "./rateLimiter";
export { handleValidationErrors, validationRules } from "../utils/validation";
export {
  apiSecurityMiddleware,
  limitPayloadSize,
  requireAuth,
  alwaysRequireCaptcha,
} from "./api-security";

// Security sub-module
export { getClientIP, addBannedIP, checkBannedIP, checkHoneypot } from "./security/banned-ip";
export { limitPayloadSize as limitPayloadMiddleware } from "./security/limit-payload";
export { additionalSecurityHeaders } from "./security/security-headers";
