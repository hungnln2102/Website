type RouteAgg = {
  requests: number;
  errors5xx: number;
  errors4xx: number;
  sumMs: number;
};

const byRoute = new Map<string, RouteAgg>();

function routeKey(method: string, path: string): string {
  const clean = path.split("?")[0] || "/";
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) return `${method} /`;
  const prefix = parts.slice(0, 3).join("/");
  return `${method} /${prefix}${parts.length > 3 ? "/*" : ""}`;
}

/**
 * Ghi một request đã hoàn thành (gọi từ response logger `res.on("finish")`).
 */
export function recordRequestMetric(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
): void {
  const key = routeKey(method, path);
  let a = byRoute.get(key);
  if (!a) {
    a = { requests: 0, errors5xx: 0, errors4xx: 0, sumMs: 0 };
    byRoute.set(key, a);
  }
  a.requests += 1;
  a.sumMs += durationMs;
  if (statusCode >= 500) a.errors5xx += 1;
  else if (statusCode >= 400) a.errors4xx += 1;
}

const startedAt = Date.now();

export function getRequestMetricsSnapshot(): {
  uptimeSec: number;
  since: string;
  routes: Record<
    string,
    { requests: number; avgMs: number; errors4xx: number; errors5xx: number }
  >;
} {
  const routes: Record<
    string,
    { requests: number; avgMs: number; errors4xx: number; errors5xx: number }
  > = {};
  for (const [k, a] of byRoute) {
    routes[k] = {
      requests: a.requests,
      avgMs: a.requests ? Math.round(a.sumMs / a.requests) : 0,
      errors4xx: a.errors4xx,
      errors5xx: a.errors5xx,
    };
  }
  return {
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    since: new Date(startedAt).toISOString(),
    routes,
  };
}
