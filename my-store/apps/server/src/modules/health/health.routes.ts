import type { Request, Response } from "express";
import prisma from "@my-store/db";
import { isRedisAvailable } from "../../config/redis";
import { getCatalogSchemaReport } from "./catalog-schema.service";
import { getRequestMetricsSnapshot } from "../../shared/middleware/request-metrics";
import logger from "../../shared/utils/logger";

/**
 * Basic health check endpoint
 */
export async function healthCheck(_req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
}

/**
 * Database health check endpoint
 */
export async function healthCheckDatabase(_req: Request, res: Response) {
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database health check failed", { error });
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Readiness probe - checks if the application is ready to serve traffic
 */
export async function readinessCheck(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const redisOk = isRedisAvailable();
    /** `fallback` = Redis không kết nối; app vẫn ready (cache in-memory). Xem `docs/RUNBOOKS_COMPACT.md`. */
    const redis: "ok" | "fallback" = redisOk ? "ok" : "fallback";

    res.status(200).json({
      status: "ready",
      checks: {
        database: "ok",
        redis,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Readiness check failed", { error });
    res.status(503).json({
      status: "not ready",
      checks: {
        database: "failed",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Liveness probe - checks if the application is alive
 */
export function livenessCheck(_req: Request, res: Response) {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Schema + MV + hàm refresh phục vụ /products và /promotions (mục 1.1).
 * HTTP 200 + `catalogReady`; vận hành cảnh báo khi `catalogReady === false`.
 */
/**
 * Metrics nhẹ (RPS theo nhóm path, 4xx/5xx, avg latency). Bật khi đặt `METRICS_TOKEN`.
 * Gửi `Authorization: Bearer <token>` hoặc header `x-metrics-token`.
 */
export function metricsJson(req: Request, res: Response) {
  const token = process.env.METRICS_TOKEN?.trim();
  if (!token) {
    res.status(404).json({
      enabled: false,
      hint: "Set METRICS_TOKEN in apps/server env to enable this endpoint.",
    });
    return;
  }
  const auth = req.headers.authorization;
  const hdr = req.headers["x-metrics-token"];
  const ok =
    auth === `Bearer ${token}` ||
    (typeof hdr === "string" && hdr === token);
  if (!ok) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.status(200).json({
    ...getRequestMetricsSnapshot(),
    pid: process.pid,
  });
}

export async function catalogDependencyCheck(_req: Request, res: Response) {
  try {
    const report = await getCatalogSchemaReport();
    const status = report.catalogReady ? 200 : 503;
    const { catalogReady, items, rowCounts, refreshFunctions } = report;
    res.status(status).json({
      status: catalogReady ? "ok" : "degraded",
      catalogReady,
      timestamp: new Date().toISOString(),
      items,
      rowCounts,
      refreshFunctions,
    });
  } catch (error) {
    logger.error("Catalog dependency check failed", { error });
    res.status(503).json({
      status: "error",
      catalogReady: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
