/**
 * Auth client: token storage and authenticated fetch wrapper.
 */

import { fetchWithTimeoutAndRetry } from "@/lib/utils/fetchWithRetry";
import { getApiBase } from "@/lib/api/client";

/** Phải khớp key lưu user trong useAuth (phiên tab). */
export const MAVRYK_AUTH_SESSION_KEY = "mavryk_auth_session";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem("accessToken") ||
    window.localStorage.getItem("accessToken")
  );
}

/** Xóa toàn bộ dữ liệu đăng nhập client. */
export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (const s of [window.sessionStorage, window.localStorage]) {
    s.removeItem("accessToken");
    s.removeItem("refreshToken");
    s.removeItem("auth_data");
    s.removeItem(MAVRYK_AUTH_SESSION_KEY);
  }
}

const STORAGE_PROBE_KEY = "__mavryk_storage_probe__";

function probeStorageWritable(store: Storage): boolean {
  try {
    const t = String(Date.now());
    store.setItem(STORAGE_PROBE_KEY, t);
    if (store.getItem(STORAGE_PROBE_KEY) !== t) return false;
    store.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cặp storage: ưu tiên phiên tab (sessionStorage), lỗi thì localStorage (Safari private / quota).
 */
export function getSessionAuthStoragePair(): { primary: Storage; secondary: Storage } {
  if (typeof window === "undefined") {
    throw new Error("getSessionAuthStoragePair: no window");
  }

  if (probeStorageWritable(window.sessionStorage)) {
    return { primary: window.sessionStorage, secondary: window.localStorage };
  }
  if (probeStorageWritable(window.localStorage)) {
    return { primary: window.localStorage, secondary: window.sessionStorage };
  }
  throw new Error("Không ghi được storage trên trình duyệt này.");
}

/**
 * Lưu Bearer + refresh vào cùng cặp storage với mavryk_auth_session (chỉ phiên tab).
 * @returns false nếu không ghi được storage (trình duyệt chặn).
 */
export function persistClientTokens(
  accessToken: string | undefined,
  refreshToken: string | undefined
): boolean {
  if (typeof window === "undefined") return false;
  let primary: Storage;
  let secondary: Storage;
  try {
    ({ primary, secondary } = getSessionAuthStoragePair());
  } catch {
    return false;
  }

  try {
    if (accessToken) primary.setItem("accessToken", accessToken);
    else primary.removeItem("accessToken");

    if (refreshToken) primary.setItem("refreshToken", refreshToken);
    else primary.removeItem("refreshToken");

    secondary.removeItem("accessToken");
    secondary.removeItem("refreshToken");
  } catch {
    return false;
  }
  return true;
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
    clearClientAuthStorage();
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

  const runFetch = (h: Record<string, string>) =>
    fetchWithTimeoutAndRetry(
      url,
      { ...options, headers: h, credentials: "include" },
      { timeoutMs: 15000, retries: 2 }
    );

  let response = await runFetch(headers);

  // Cookie còn nhưng Redis/phiên hết hạn → 403 CSRF_* — lấy token mới (giống cart.api) rồi thử 1 lần.
  if (response.status === 403 && CSRF_PROTECTED_METHODS.has(method)) {
    const body = await response.clone().json().catch(() => ({} as { code?: string }));
    if (typeof body?.code === "string" && body.code.startsWith("CSRF_")) {
      const refreshed = await ensureCsrfToken(true);
      if (refreshed) {
        const nextHeaders = { ...headers, [CSRF_HEADER_NAME]: refreshed };
        response = await runFetch(nextHeaders);
      }
    }
  }

  if (response.status === 401) {
    handleUnauthorized();
  }
  return response;
}
