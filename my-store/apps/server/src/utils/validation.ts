import { body, param, query, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

/**
 * Validation result handler
 * Returns 400 error if validation fails
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg,
      })),
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
export const validationRules = {
  // Email validation
  email: () =>
    body('email')
      .trim()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),

  // Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
  password: () =>
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),

  // Phone number validation (Vietnam format)
  phone: () =>
    body('phone')
      .optional()
      .trim()
      .matches(/^(0|\+84)[0-9]{9,10}$/)
      .withMessage('Invalid phone number'),

  // Amount validation (positive number)
  amount: () =>
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => value > 0)
      .withMessage('Amount must be greater than 0'),

  // Order ID validation
  orderId: () =>
    body('orderId')
      .trim()
      .notEmpty()
      .withMessage('Order ID is required')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Invalid order ID format'),

  // ID parameter validation
  idParam: () =>
    param('id')
      .trim()
      .notEmpty()
      .withMessage('ID is required')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Invalid ID format'),

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // String length validation
  stringLength: (field: string, min: number, max: number) =>
    body(field)
      .trim()
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`),

  // Required field validation
  required: (field: string) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} is required`),

  // Optional string validation
  optionalString: (field: string, maxLength: number = 255) =>
    body(field)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${field} must be less than ${maxLength} characters`),
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate and sanitize object
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as any;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
};
