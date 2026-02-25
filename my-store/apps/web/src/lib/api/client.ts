/**
 * Shared API base URL and error handling for all API modules.
 * Dev: luôn dùng '' (cùng origin) để request qua Vite proxy → backend 4000, giữ đúng hành vi như trước.
 * Prod: dùng VITE_API_URL / VITE_SERVER_URL hoặc mặc định.
 */
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
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      const hint = import.meta.env.DEV
        ? " Kiểm tra backend đã chạy tại http://localhost:4000 (npm run dev từ thư mục my-store)."
        : "";
      throw new Error("Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau." + hint);
    }
    throw err;
  }
}

/**
 * Generic error handler that sanitizes error messages to prevent information leakage.
 * Gọi sau khi đã đọc response body (res.json()/res.text()) để tránh "Failed to load response data" trong DevTools.
 */
export function handleApiError(res: Response, defaultMessage: string): never {
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
