/**
 * Auth client: token storage and authenticated fetch wrapper.
 */

import { fetchWithTimeoutAndRetry } from "../utils/fetchWithRetry";
import { getApiBase } from "./client";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("accessToken");
}

export const AUTH_EXPIRED_EVENT = "auth:session-expired";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const pattern = new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`);
  const match = document.cookie.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfTokenFromCookie(): string | null {
  return getCookieValue(CSRF_COOKIE_NAME);
}

/**
 * Ensure CSRF token exists (Double Submit Cookie).
 * If missing/expired on server, call /api/auth/csrf-token (exempt from CSRF) to refresh.
 */
export async function ensureCsrfToken(forceRefresh: boolean = false): Promise<string | null> {
  const existing = getCsrfTokenFromCookie();
  if (existing && !forceRefresh) return existing;

  try {
    const res = await fetchWithTimeoutAndRetry(
      `${getApiBase()}/api/auth/csrf-token`,
      { credentials: "include" },
      { timeoutMs: 10000, retries: 1 }
    );
    if (!res.ok) return getCsrfTokenFromCookie();
    const body = await res.json().catch(() => null as any);
    return body?.csrfToken ?? getCsrfTokenFromCookie();
  } catch {
    return getCsrfTokenFromCookie();
  }
}

function handleUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("accessToken");
    window.sessionStorage.removeItem("refreshToken");
    window.sessionStorage.removeItem("auth_data");
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

/** Gọi khi API trả 401 (token hết hạn/revoked) — clear session và dispatch event để UI hiển thị "Đăng nhập lại". */
export { handleUnauthorized };

/**
 * Authenticated fetch wrapper – adds Bearer token, timeout+retry, and handles 401 by dispatching logout event.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // CSRF: required for state-changing requests under /api (except exempt paths).
  const method = (options.method ?? "GET").toUpperCase();
  if (CSRF_PROTECTED_METHODS.has(method) && !headers[CSRF_HEADER_NAME]) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken;
  }

  const response = await fetchWithTimeoutAndRetry(
    url,
    {
      ...options,
      headers,
      credentials: "include",
    },
    { timeoutMs: 15000, retries: 2 }
  );
  if (response.status === 401) {
    handleUnauthorized();
  }
  return response;
}
