import type { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && {
      message: err.message,
      stack: err.stack,
    }),
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}
