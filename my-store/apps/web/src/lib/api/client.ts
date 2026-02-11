/**
 * Shared API base URL and error handling for all API modules.
 */

export const getApiBase = (): string =>
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

// SECURITY: Enforce HTTPS in production
const API_BASE = getApiBase();
if (import.meta.env.PROD && API_BASE && !API_BASE.startsWith("https://")) {
  console.error("SECURITY WARNING: API_BASE must use HTTPS in production!");
}

/**
 * Generic error handler that sanitizes error messages to prevent information leakage.
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
