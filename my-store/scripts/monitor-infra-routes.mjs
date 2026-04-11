#!/usr/bin/env node
/**
 * Infrastructure monitor check for critical routes.
 *
 * Usage:
 *   MONITOR_BASE_URL=https://api.example.com METRICS_TOKEN=xxx node scripts/monitor-infra-routes.mjs
 */
const base = (process.env.MONITOR_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
const metricsToken = process.env.METRICS_TOKEN;
const paymentSlowMs = Math.max(
  200,
  parseInt(process.env.ALERT_PAYMENT_SLOW_MS || "1500", 10) || 1500,
);
const healthDbSlowMs = Math.max(
  100,
  parseInt(process.env.ALERT_HEALTH_DB_SLOW_MS || "800", 10) || 800,
);

function fail(msg) {
  console.error(`ALERT ${msg}`);
  process.exitCode = 1;
}

// 1) Active DB check
const dbStart = Date.now();
try {
  const dbRes = await fetch(`${base}/health/db`, { signal: AbortSignal.timeout(15_000) });
  const dbDuration = Date.now() - dbStart;
  if (!dbRes.ok) {
    fail(`/health/db status=${dbRes.status}`);
  }
  if (dbDuration >= healthDbSlowMs) {
    fail(`/health/db latency=${dbDuration}ms threshold=${healthDbSlowMs}ms`);
  }
} catch (e) {
  fail(`/health/db request failed: ${e instanceof Error ? e.message : String(e)}`);
}

// 2) Metrics snapshot check for payment + health/db routes
if (!metricsToken) {
  console.log("WARN METRICS_TOKEN missing: skip /health/metrics check.");
} else {
  try {
    const res = await fetch(`${base}/health/metrics`, {
      headers: { Authorization: `Bearer ${metricsToken}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      fail(`/health/metrics status=${res.status}`);
    } else {
      const payload = await res.json();
      const routes = payload?.routes && typeof payload.routes === "object" ? payload.routes : {};
      for (const [route, stats] of Object.entries(routes)) {
        if (!stats || typeof stats !== "object") continue;
        const routeStats = stats;
        const isPayment = route.includes("/api/payment");
        const isHealthDb = route.includes("/health/db");
        if (!isPayment && !isHealthDb) continue;

        const errors5xx = Number(routeStats.errors5xx || 0);
        const avgMs = Number(routeStats.avgMs || 0);
        const threshold = isHealthDb ? healthDbSlowMs : paymentSlowMs;

        if (errors5xx > 0) {
          fail(`${route} has ${errors5xx} 5xx responses`);
        }
        if (avgMs >= threshold) {
          fail(`${route} avgMs=${avgMs} threshold=${threshold}`);
        }
      }
    }
  } catch (e) {
    fail(`/health/metrics request failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}
console.log("OK infra route monitor checks passed.");

