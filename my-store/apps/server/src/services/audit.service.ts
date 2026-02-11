/**
 * Audit Logging Service
 * Records all important actions for security and compliance
 */

import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const AUDIT_TABLE = `${DB_SCHEMA.AUDIT_LOG!.SCHEMA}.${DB_SCHEMA.AUDIT_LOG!.TABLE}`;

// Audit action types
export type AuditAction =
  // Authentication
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS"
  | "TOKEN_REFRESH"
  | "SESSION_EXPIRED"
  // Account
  | "PROFILE_UPDATE"
  | "EMAIL_CHANGE"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "2FA_ENABLED"
  | "2FA_DISABLED"
  // Orders
  | "ORDER_CREATE"
  | "ORDER_CANCEL"
  | "ORDER_REFUND"
  // Payments
  | "PAYMENT_INITIATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUND"
  | "TOPUP"
  // Admin actions
  | "ADMIN_USER_BAN"
  | "ADMIN_USER_UNBAN"
  | "ADMIN_ORDER_MODIFY"
  | "ADMIN_PRICE_CHANGE"
  // Security events
  | "SUSPICIOUS_ACTIVITY"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_TOKEN"
  | "CAPTCHA_FAILED";

export type AuditStatus = "success" | "failed" | "error";

export interface AuditLogEntry {
  userId?: number | string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status?: AuditStatus;
}

// SECURITY: Fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'api_key',
  'creditCard',
  'cardNumber',
  'cvv',
  'pin',
  'ssn',
  'socialSecurity',
];

/**
 * Sanitize details object by removing sensitive fields
 */
function sanitizeDetails(details: Record<string, any> | undefined): Record<string, any> | null {
  if (!details) return null;
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(details)) {
    // Skip sensitive fields
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeDetails(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

class AuditService {
  /**
   * Log an audit event
   * SECURITY: Automatically sanitizes sensitive fields from details
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const {
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        details,
        status = "success",
      } = entry;
      
      // SECURITY: Sanitize details before logging
      const sanitizedDetails = sanitizeDetails(details);

      await pool.query(
        `INSERT INTO ${AUDIT_TABLE} 
          (user_id, action, resource_type, resource_id, ip_address, user_agent, details, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          userId || null,
          action,
          resourceType || null,
          resourceId || null,
          ipAddress || null,
          userAgent?.substring(0, 500) || null, // Truncate user agent
          sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
          status,
        ]
      );
    } catch (err) {
      // Don't throw - audit logging should not break the main flow
      console.error("Audit logging error:", err);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: AuditAction,
    userId: number | string | null,
    req: { ip?: string; headers?: Record<string, any> },
    details?: Record<string, any>,
    status: AuditStatus = "success"
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: "auth",
      ipAddress: req.ip || req.headers?.["x-forwarded-for"]?.toString().split(",")[0],
      userAgent: req.headers?.["user-agent"],
      details,
      status,
    });
  }

  /**
   * Log payment events
   */
  async logPayment(
    action: AuditAction,
    userId: number | string | null,
    orderId: string,
    req: { ip?: string; headers?: Record<string, any> },
    details?: Record<string, any>,
    status: AuditStatus = "success"
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: "payment",
      resourceId: orderId,
      ipAddress: req.ip || req.headers?.["x-forwarded-for"]?.toString().split(",")[0],
      userAgent: req.headers?.["user-agent"],
      details,
      status,
    });
  }

  /**
   * Log order events
   */
  async logOrder(
    action: AuditAction,
    userId: number | string | null,
    orderId: string,
    req: { ip?: string; headers?: Record<string, any> },
    details?: Record<string, any>,
    status: AuditStatus = "success"
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: "order",
      resourceId: orderId,
      ipAddress: req.ip || req.headers?.["x-forwarded-for"]?.toString().split(",")[0],
      userAgent: req.headers?.["user-agent"],
      details,
      status,
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    action: AuditAction,
    req: { ip?: string; headers?: Record<string, any> },
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId: null,
      action,
      resourceType: "security",
      ipAddress: req.ip || req.headers?.["x-forwarded-for"]?.toString().split(",")[0],
      userAgent: req.headers?.["user-agent"],
      details,
      status: "failed",
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId: number, limit = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM ${AUDIT_TABLE} 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(limit = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM ${AUDIT_TABLE} 
       WHERE action IN ('LOGIN_FAILED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'INVALID_TOKEN', 'CAPTCHA_FAILED')
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

export const auditService = new AuditService();
