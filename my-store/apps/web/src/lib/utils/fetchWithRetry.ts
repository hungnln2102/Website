/**
 * Fetch with timeout (AbortController) and retry with exponential backoff.
 * Used for critical API calls: auth, cart sync, payment.
 */

export interface FetchWithRetryOptions {
  /** Timeout in ms. Default 15000. */
  timeoutMs?: number;
  /** Number of retries after first attempt (total attempts = retries + 1). Default 2. */
  retries?: number;
  /** Initial delay before first retry (ms). Backoff: delay * 2^attempt. Default 1000. */
  retryDelayMs?: number;
  /** Retry on 5xx only when true; otherwise also retry on network errors. Default true for 5xx, always retry on network error. */
  retryOn5xx?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout and retry. Retries on network failure or 5xx responses.
 * Does not retry on 4xx (except 429 Too Many Requests if you add it later).
 */
export async function fetchWithTimeoutAndRetry(
  url: string,
  init?: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    retryOn5xx = true,
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const shouldRetry =
        retryOn5xx && res.status >= 500 && res.status < 600 && attempt < retries;
      if (shouldRetry) {
        const wait = retryDelayMs * Math.pow(2, attempt);
        await delay(wait);
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      const isAbort = err instanceof Error && err.name === "AbortError";
      const isNetwork = err instanceof TypeError && err.message?.includes("fetch");
      const canRetry = (isAbort || isNetwork) && attempt < retries;

      if (canRetry) {
        const wait = retryDelayMs * Math.pow(2, attempt);
        await delay(wait);
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}
