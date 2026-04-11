/**
 * Retry + backoff có jitter cho GET idempotent (React Query `queries`).
 * Tránh bão request đồng thời khi mạng / CDN phục hồi.
 */
export function idempotentGetRetryDelay(attemptIndex: number): number {
  const cap = 25_000;
  const base = Math.min(1000 * 2 ** attemptIndex, cap);
  const jitter = Math.floor(Math.random() * 500);
  return base + jitter;
}

export function shouldRetryIdempotentQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 4) return false;
  if (error instanceof Error) {
    const m = error.message;
    if (m.includes("404") || m.includes("403") || m.includes("401")) return false;
  }
  return true;
}
