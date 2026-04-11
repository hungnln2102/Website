import type { Request, Response, NextFunction } from "express";
import {
  shouldLogRequestLine,
  shouldLogResponseLine,
} from "../utils/access-log-policy";
import { recordRequestMetric } from "./request-metrics";
import { emitInfraRouteAlert } from "./request-alerts";

function cid(req: Request): string {
  return req.correlationId ?? "-";
}

/**
 * Request logging middleware (after correlationIdMiddleware).
 * Production mặc định: tắt dòng request (chỉ metrics + response khi lỗi) — xem `HTTP_ACCESS_LOG`.
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  if (!shouldLogRequestLine()) {
    next();
    return;
  }
  const timestamp = new Date().toISOString();
  const { method, path, ip } = req;

  console.log(`[${timestamp}] [${cid(req)}] ${method} ${path} - ${ip}`);

  next();
}

/**
 * Response time logger + metrics (không log body).
 */
export function responseTimeLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;

    recordRequestMetric(method, path || "/", statusCode, duration);
    emitInfraRouteAlert(method, path || "/", statusCode, duration, cid(req));

    if (shouldLogResponseLine(statusCode)) {
      console.log(
        `[Response] [${cid(req)}] ${method} ${path} - ${statusCode} (${duration}ms)`,
      );
    }
  });

  next();
}
