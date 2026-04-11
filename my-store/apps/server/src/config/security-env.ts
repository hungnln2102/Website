import { env } from "@my-store/env/server";

const PLACEHOLDER_PATTERNS = [
  /^changeme$/i,
  /^change[-_]?me$/i,
  /^your[-_]/i,
  /^example/i,
  /^test/i,
  /^demo/i,
  /^12345/,
];

function isLikelyPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(value.trim()));
}

function assertStrongSecret(name: string, minLength = 32): void {
  const value = process.env[name];
  if (!value || value.trim().length < minLength) {
    throw new Error(
      `[SECURITY] ${name} must be set with at least ${minLength} characters in production.`,
    );
  }
  if (isLikelyPlaceholder(value)) {
    throw new Error(`[SECURITY] ${name} appears to be placeholder/test value.`);
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function assertHttpsUrl(name: string, value: string | undefined): void {
  if (!value) return;
  if (!isHttpsUrl(value)) {
    throw new Error(`[SECURITY] ${name} must use https:// in production.`);
  }
}

/**
 * Fail-fast guard for production config.
 * Keep this small and explicit so misconfigurations are caught before serving traffic.
 */
export function assertSecurityConfig(): void {
  if (env.NODE_ENV !== "production") return;

  // Secrets required for auth/session integrity.
  assertStrongSecret("JWT_SECRET");
  assertStrongSecret("JWT_REFRESH_SECRET");

  // CORS origin already validated in index.ts, keep defensive check here too.
  if (!env.CORS_ORIGIN || env.CORS_ORIGIN.length === 0) {
    throw new Error("[SECURITY] CORS_ORIGIN must be configured in production.");
  }
  for (const origin of env.CORS_ORIGIN) {
    if (!isHttpsUrl(origin)) {
      throw new Error(`[SECURITY] CORS_ORIGIN must contain only https origins in production (invalid: ${origin}).`);
    }
  }

  // HTTPS end-to-end: URL callback và frontend không được dùng http trong production.
  assertHttpsUrl("FRONTEND_URL", process.env.FRONTEND_URL);
  assertHttpsUrl("SEPAY_SUCCESS_URL", process.env.SEPAY_SUCCESS_URL);
  assertHttpsUrl("SEPAY_ERROR_URL", process.env.SEPAY_ERROR_URL);
  assertHttpsUrl("SEPAY_CANCEL_URL", process.env.SEPAY_CANCEL_URL);
}

