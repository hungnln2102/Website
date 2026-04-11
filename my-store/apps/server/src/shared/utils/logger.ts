import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { notifyError, notifyWarn } from "./telegram-error-notifier";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const winstonLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function extractTelegramPayload(
  level: "error" | "warn",
  message: unknown,
  meta?: Record<string, unknown>,
) {
  const msg = typeof message === "string" ? message : safeStringify(message);
  const status = meta?.statusCode ?? meta?.status;
  const url = typeof meta?.url === "string" ? meta.url : undefined;
  const method = typeof meta?.method === "string" ? meta.method : undefined;
  const stack = typeof meta?.stack === "string" ? meta.stack : undefined;
  const extraParts: string[] = [];
  if (status != null) extraParts.push(`HTTP ${String(status)}`);
  if (meta && Object.keys(meta).length > 0) {
    extraParts.push(safeStringify(meta));
  }
  return {
    source: "backend" as const,
    message: msg,
    url,
    method,
    stack,
    extra: extraParts.length > 0 ? extraParts.join(" | ") : undefined,
    level,
  };
}

// Create logger instance
const logger = winston.createLogger({
  level: winstonLevel,
  format: logFormat,
  transports: [
    // Security logs (warnings and errors)
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'warn',
    }),
    
    // Payment logs (all payment-related events)
    new DailyRotateFile({
      filename: path.join(logsDir, 'payment-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d', // Keep payment logs for 90 days
    }),
    
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Console: dev luôn bật; production chỉ khi ENABLE_CONSOLE_LOG=true (level theo LOG_LEVEL)
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
} else if (String(process.env.ENABLE_CONSOLE_LOG ?? "").toLowerCase() === "true") {
  logger.add(
    new winston.transports.Console({
      level: winstonLevel,
      format: consoleFormat,
    }),
  );
}

/**
 * Log security event
 */
export const logSecurityEvent = (event: string, details: any) => {
  logger.warn('SECURITY_EVENT', {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log payment event
 */
export const logPaymentEvent = (event: string, details: any) => {
  logger.info('PAYMENT_EVENT', {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log authentication event
 */
export const logAuthEvent = (event: string, details: any) => {
  logger.info('AUTH_EVENT', {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log failed login attempt
 */
export const logFailedLogin = (email: string, ipAddress: string, reason: string) => {
  logSecurityEvent('FAILED_LOGIN', {
    email,
    ipAddress,
    reason,
  });
};

/**
 * Log suspicious activity
 */
export const logSuspiciousActivity = (activity: string, details: any) => {
  logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    activity,
    details,
  });
};

const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.error = ((message: unknown, ...meta: unknown[]) => {
  originalError(message as any, ...(meta as any[]));
  const payload = extractTelegramPayload("error", message, (meta[0] as Record<string, unknown>) || {});
  notifyError(payload);
}) as typeof logger.error;

logger.warn = ((message: unknown, ...meta: unknown[]) => {
  originalWarn(message as any, ...(meta as any[]));
  // Skip self-notifier internal logs if ever routed through logger.
  if (String(message || "").includes("TelegramErrorNotifier")) return;
  const payload = extractTelegramPayload("warn", message, (meta[0] as Record<string, unknown>) || {});
  notifyWarn(payload);
}) as typeof logger.warn;

export default logger;
