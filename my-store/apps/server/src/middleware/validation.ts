import type { Request, Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { ZodError, type ZodSchema } from 'zod';

/**
 * Middleware to validate request parameters using Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as ParamsDictionary;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((issue) => ({
            field: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate request query using Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as ParsedQs;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((issue) => ({
            field: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate request body using Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((issue) => ({
            field: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
}
