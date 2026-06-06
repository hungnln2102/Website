/**
 * Shared API base URL and error handling for all API modules.
 *
 * Dev: `getApiBase()` = '' — Vite proxy (vite.config.ts) gửi mọi prefix dưới đây → my-store server :4000;
 * server (`ADMIN_ORDERLIST_API_URL` trong apps/server/.env) forward tới admin_orderlist (dev thường :3001):
 *   - `/api/public/content/*`, `/api/renew-adobe/public/*`, `/image/articles/*`, `/image_variant/*`
 *   - còn lại `/api/*` do chính apps/server xử lý / tRPC
 *
 * Prod: `VITE_API_URL` trỏ tới my-store server (vd. https://api…). Cùng host đó phải có proxy
 * tới admin_orderlist (`ADMIN_ORDERLIST_API_URL` trên apps/server) cho các prefix:
 *   - `/api/public/content/*` (tin tức, banner trang chủ)
 *   - `/api/renew-adobe/public/*` (Renew Adobe trên web)
 *   - `/image/articles/*` (ảnh bìa bài viết)
 */
import { isSystemHubPath } from "@/lib/constants";
import { MSG_SESSION_EXPIRED } from "@/lib/messages/apiUserErrors";

export const getApiBase = (): string => {
  if (import.meta.env.DEV) return '';
  const fromEnv = (
    import.meta.env.VITE_API_URL ?? import.meta.env.VITE_SERVER_URL
  )?.replace(/\/$/, '');
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('mavrykpremium.com')) {
      return 'https://api.mavrykpremium.com';
    }
  }
  return fromEnv || 'http://localhost:4000';
};

/** Same-origin trên production web — tránh CORS khi kiểm tra bảo trì. */
export const getMaintenanceStatusUrl = (): string => {
  if (typeof window === "undefined") {
    return `${getApiBase()}/api/maintenance/status`;
  }
  if (import.meta.env.DEV) {
    return "/api/maintenance/status";
  }
  const host = window.location.hostname;
  if (host.includes("mavrykpremium.com")) {
    return "/api/maintenance/status";
  }
  return `${getApiBase()}/api/maintenance/status`;
};

// SECURITY: Enforce HTTPS in production
const API_BASE = getApiBase();
if (import.meta.env.PROD && API_BASE && !API_BASE.startsWith("https://")) {
  console.error("SECURITY WARNING: API must use HTTPS in production. Set VITE_API_URL.");
}

// ─── Maintenance mode detection ─────────────────────────────────────────────
let _maintenanceMode = false;
const _maintenanceListeners = new Set<(on: boolean) => void>();

export function isMaintenanceMode() {
  return _maintenanceMode;
}
export function onMaintenanceChange(cb: (on: boolean) => void) {
  _maintenanceListeners.add(cb);
  return () => { _maintenanceListeners.delete(cb); };
}
function setMaintenanceMode(on: boolean) {
  if (_maintenanceMode === on) return;
  _maintenanceMode = on;
  _maintenanceListeners.forEach((cb) => cb(on));
}

/**
 * Đồng bộ trạng thái bảo trì từ GET /api/maintenance/status.
 * Trả về true nếu user nên bị chặn (maintenance ON và không whitelist).
 */
export async function syncMaintenanceStatusFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (isSystemHubPath(window.location.pathname)) {
    if (_maintenanceMode) setMaintenanceMode(false);
    return false;
  }

  try {
    const res = await fetch(getMaintenanceStatusUrl(), {
      credentials: "include",
    });
    if (!res.ok) return _maintenanceMode;

    const body = (await res.json()) as {
      maintenance?: boolean;
      whitelisted?: boolean;
    };
    const shouldBlock = Boolean(body.maintenance) && !body.whitelisted;
    setMaintenanceMode(shouldBlock);
    return shouldBlock;
  } catch {
    return _maintenanceMode;
  }
}

/** Fetch with timeout to avoid hanging when backend is slow or down. */
const DEFAULT_API_TIMEOUT_MS = 12_000;

function requestIdHeader(): Record<string, string> {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return { "X-Request-Id": crypto.randomUUID() };
  }
  return {};
}

export async function apiFetch(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init?.headers ?? undefined);
  const rid = requestIdHeader()["X-Request-Id"];
  if (rid && !headers.has("X-Request-Id")) {
    headers.set("X-Request-Id", rid);
  }
  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Detect maintenance mode from 503 response
    if (res.status === 503) {
      try {
        const cloned = res.clone();
        const body = await cloned.json();
        if (body?.maintenance === true) {
          const onSystemHub =
            typeof window !== "undefined" &&
            isSystemHubPath(window.location.pathname);
          if (!onSystemHub) {
            setMaintenanceMode(true);
          }
        }
      } catch { /* ignore parse errors */ }
    }
    // Không tự tắt maintenance khi API khác trả 200 — /categories, /products bypass guard
    // và vẫn 200 trong lúc bảo trì. syncMaintenanceStatusFromServer() là nguồn tắt/bật chính xác.

    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      const isRenewActivate =
        typeof url === "string" && url.includes("/api/renew-adobe/public/activate");
      const hint = import.meta.env.DEV
        ? isRenewActivate
          ? " Hết thời gian chờ (hoặc proxy đóng sớm). Kích hoạt Renew Adobe có thể mất vài phút — thử bấm Kiểm tra profile lại sau; đảm bảo Vite/apps/server proxy tới admin_orderlist đủ lâu (vài trăm giây)."
          : " Kiểm tra apps/server :4000 và `ADMIN_ORDERLIST_API_URL` (admin_orderlist, thường :3001) nếu dùng tin tức."
        : isRenewActivate
          ? " Thao tác kích hoạt có thể vẫn đang chạy trên máy chủ — thử kiểm tra profile lại sau vài phút."
          : "";
      throw new Error("Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau." + hint);
    }
    const msg = err instanceof Error ? err.message : "";
    if (
      err instanceof TypeError ||
      /failed to fetch|networkerror|load failed/i.test(msg)
    ) {
      const hint = import.meta.env.DEV
        ? " Trên dev, Vite :4001 → apps/server :4000 → admin_orderlist (theo `ADMIN_ORDERLIST_API_URL`). Bật cả server Website và admin_orderlist/backend."
        : " Kiểm tra kết nối mạng hoặc thử lại sau.";
      throw new Error("Không kết nối được máy chủ." + hint);
    }
    throw err;
  }
}

/**
 * Generic error handler that sanitizes error messages to prevent information leakage.
 * Gọi sau khi đã đọc response body (res.json()/res.text()) để tránh "Failed to load response data" trong DevTools.
 */
export function handleApiError(res: Response, defaultMessage: string): never {
  if (res.status === 503 && _maintenanceMode) {
    throw new Error("Website đang bảo trì. Vui lòng quay lại sau.");
  }
  if (res.status === 502 || res.status === 504) {
    throw new Error(
      "Máy chủ tạm thời không phản hồi (gateway / timeout). Vui lòng thử lại sau.",
    );
  }
  if (res.status >= 500) {
    throw new Error("Máy chủ đang gặp sự cố. Vui lòng thử lại sau.");
  }
  if (res.status === 404) {
    throw new Error("Không tìm thấy dữ liệu yêu cầu.");
  }
  if (res.status === 403) {
    throw new Error("Bạn không có quyền truy cập.");
  }
  if (res.status === 401) {
    throw new Error(MSG_SESSION_EXPIRED);
  }
  throw new Error(defaultMessage);
}
