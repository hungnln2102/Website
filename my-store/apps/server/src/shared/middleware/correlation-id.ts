import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const SAFE_ID = /^[a-zA-Z0-9-]{8,128}$/;

/**
 * Propagate or assign a correlation id for tracing (logs + response header X-Request-Id).
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const fromHeader = (req.get("X-Request-Id") ?? req.get("X-Correlation-Id"))?.trim();
  const id =
    fromHeader && SAFE_ID.test(fromHeader) ? fromHeader : randomUUID();
  req.correlationId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
