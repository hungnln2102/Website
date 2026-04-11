#!/usr/bin/env node
/**
 * Kiểm tra GET /health/catalog (schema + MV + hàm refresh cho /products, /promotions).
 *
 *   SMOKE_BASE_URL=http://127.0.0.1:4000 node scripts/smoke-catalog.mjs
 */
const base = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
const url = `${base}/health/catalog`;
const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
const body = await res.json().catch(() => ({}));
if (!res.ok || !body.catalogReady) {
  console.error("FAIL", url, res.status, JSON.stringify(body, null, 2));
  process.exit(1);
}
console.log("OK", url, "catalogReady=true");
