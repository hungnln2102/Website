import type { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const { method, path, ip } = req;
  
  console.log(`[${timestamp}] ${method} ${path} - ${ip}`);
  
  next();
}

/**
 * Response time logger middleware
 */
export function responseTimeLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;
    
    console.log(`[Response] ${method} ${path} - ${statusCode} (${duration}ms)`);
  });
  
  next();
}
