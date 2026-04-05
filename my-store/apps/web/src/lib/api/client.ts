/**
 * Shared API base URL and error handling for all API modules.
 *
 * Dev: `getApiBase()` = '' — Vite proxy (vite.config.ts) gửi:
 *   - `/api/*` (chung) → my-store server :4000
 *   - `/api/public/content/*`, `/api/renew-adobe/public/*`, `/image/articles/*` → admin_orderlist :3001
 *
 * Prod: `VITE_API_URL` trỏ tới my-store server (vd. https://api…). Cùng host đó phải có proxy
 * tới admin_orderlist (`ADMIN_ORDERLIST_API_URL` trên apps/server) cho các prefix:
 *   - `/api/public/content/*` (tin tức)
 *   - `/api/renew-adobe/public/*` (Renew Adobe trên web)
 *   - `/image/articles/*` (ảnh bìa bài viết)
 */
import { isSystemHubPath } from "@/lib/constants";

export const getApiBase = (): string => {
  if (import.meta.env.DEV) return '';
  const fromEnv =
    import.meta.env.VITE_API_URL ?? import.meta.env.VITE_SERVER_URL;
  return fromEnv || 'http://localhost:4000';
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

/** Fetch with timeout to avoid hanging when backend is slow or down. */
const DEFAULT_API_TIMEOUT_MS = 12_000;

export async function apiFetch(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
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
    } else if (_maintenanceMode) {
      // Backend responded normally → maintenance is off
      setMaintenanceMode(false);
    }

    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      const hint = import.meta.env.DEV
        ? " Kiểm tra my-store server (4000) và admin_orderlist (3001) nếu dùng tin tức."
        : "";
      throw new Error("Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau." + hint);
    }
    const msg = err instanceof Error ? err.message : "";
    if (
      err instanceof TypeError ||
      /failed to fetch|networkerror|load failed/i.test(msg)
    ) {
      const hint = import.meta.env.DEV
        ? " Trên dev, trình duyệt gọi Vite :4001 — proxy chuyển tiếp /api/renew-adobe/public tới admin_orderlist. Hãy bật `npm run dev` trong admin_orderlist/backend (cổng 3001) và chạy `npm run dev` ở Website/my-store (web+server). Có thể đặt `VITE_ADMIN_API_URL=http://127.0.0.1:3001` trong apps/web/.env."
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
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
  throw new Error(defaultMessage);
}
