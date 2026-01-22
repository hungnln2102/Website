import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

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

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
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

export default logger;
