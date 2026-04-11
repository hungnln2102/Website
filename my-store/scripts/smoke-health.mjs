#!/usr/bin/env node
/**
 * Smoke HTTP: /health, /health/db, /health/ready
 *
 * Usage:
 *   SMOKE_BASE_URL=https://api.example.com node scripts/smoke-health.mjs
 *   node scripts/smoke-health.mjs   # defaults http://127.0.0.1:4000
 */
const base = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
const paths = ["/health", "/health/db", "/health/ready"];

let failed = false;
for (const p of paths) {
  const url = `${base}${p}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.error(`FAIL ${res.status} ${url}`);
      failed = true;
    } else {
      console.log(`OK ${res.status} ${url}`);
    }
  } catch (e) {
    console.error(`FAIL ${url}`, e);
    failed = true;
  }
}

if (failed) process.exit(1);
