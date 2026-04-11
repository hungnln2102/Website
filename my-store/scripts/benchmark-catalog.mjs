#!/usr/bin/env node
/**
 * Đo thời gian phản hồi GET /products và /promotions (baseline p50 / p95 / p99).
 *
 *   SMOKE_BASE_URL=http://127.0.0.1:4000 node scripts/benchmark-catalog.mjs
 *   SMOKE_BASE_URL=https://api.example.com BENCH_ITERATIONS=30 node scripts/benchmark-catalog.mjs
 */
const base = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
const iterations = Math.max(5, Number(process.env.BENCH_ITERATIONS ?? 20) || 20);

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, idx)];
}

async function bench(path) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    const res = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(120_000),
    });
    const ms = performance.now() - t0;
    if (!res.ok) {
      console.error(`${path} -> ${res.status}`);
      process.exit(1);
    }
    await res.arrayBuffer();
    times.push(ms);
  }
  times.sort((a, b) => a - b);
  return {
    path,
    n: times.length,
    p50: Math.round(percentile(times, 50)),
    p95: Math.round(percentile(times, 95)),
    p99: Math.round(percentile(times, 99)),
    min: Math.round(times[0]),
    max: Math.round(times[times.length - 1]),
  };
}

const products = await bench("/products");
const promotions = await bench("/promotions");
console.log(JSON.stringify({ base, iterations, products, promotions }, null, 2));
