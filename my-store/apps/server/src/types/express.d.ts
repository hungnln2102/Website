import "express";

declare global {
  namespace Express {
    interface Request {
      /** Request correlation id (header X-Request-Id / X-Correlation-Id or generated). */
      correlationId?: string;
    }
  }
}

export {};
