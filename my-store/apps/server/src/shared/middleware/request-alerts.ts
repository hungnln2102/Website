import { logSecurityEvent } from "../utils/logger";

const ALERT_COOLDOWN_MS = Math.max(
  5_000,
  parseInt(process.env.ALERT_COOLDOWN_MS || "60000", 10) || 60_000,
);
const ALERT_PAYMENT_SLOW_MS = Math.max(
  200,
  parseInt(process.env.ALERT_PAYMENT_SLOW_MS || "1500", 10) || 1_500,
);
const ALERT_HEALTH_DB_SLOW_MS = Math.max(
  100,
  parseInt(process.env.ALERT_HEALTH_DB_SLOW_MS || "800", 10) || 800,
);

const lastAlertAt = new Map<string, number>();

function isWatchedRoute(path: string): boolean {
  if (path === "/health/db") return true;
  return path.startsWith("/api/payment");
}

function latencyThresholdMs(path: string): number {
  if (path === "/health/db") return ALERT_HEALTH_DB_SLOW_MS;
  return ALERT_PAYMENT_SLOW_MS;
}

function shouldEmit(key: string, now: number): boolean {
  const prev = lastAlertAt.get(key);
  if (prev && now - prev < ALERT_COOLDOWN_MS) return false;
  lastAlertAt.set(key, now);
  return true;
}

export function emitInfraRouteAlert(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  correlationId: string,
): void {
  const cleanPath = (path || "/").split("?")[0] || "/";
  if (!isWatchedRoute(cleanPath)) return;

  const now = Date.now();

  if (statusCode >= 500) {
    const key = `5xx:${method}:${cleanPath}:${Math.floor(now / ALERT_COOLDOWN_MS)}`;
    if (shouldEmit(key, now)) {
      logSecurityEvent("INFRA_ROUTE_5XX_ALERT", {
        method,
        path: cleanPath,
        statusCode,
        durationMs,
        correlationId,
      });
    }
  }

  const threshold = latencyThresholdMs(cleanPath);
  if (durationMs >= threshold) {
    const key = `latency:${method}:${cleanPath}:${Math.floor(now / ALERT_COOLDOWN_MS)}`;
    if (shouldEmit(key, now)) {
      logSecurityEvent("INFRA_ROUTE_LATENCY_ALERT", {
        method,
        path: cleanPath,
        durationMs,
        thresholdMs: threshold,
        statusCode,
        correlationId,
      });
    }
  }
}

