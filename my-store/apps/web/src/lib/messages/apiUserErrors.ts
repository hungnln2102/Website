/**
 * Thông báo lỗi API hiển thị cho người dùng (tránh câu tiếng Anh/technical như "CSRF token expired").
 */

/** 401 / phiên access token hết hạn */
export const MSG_SESSION_EXPIRED = "Trạng thái đăng nhập của quý khách đã hết hạn. Vui lòng đăng nhập lại.";

/** CSRF: cookie/Redis — khách thường thấy khi mở trang lâu, không cần gọi tên kỹ thuật */
export const MSG_CSRF_EXPIRED =
  "Phiên làm việc của quý khách đã hết hạn. Vui lòng tải lại trang rồi thử lại, hoặc đăng nhập lại để thao tác an toàn.";

export const MSG_CSRF_INVALID =
  "Yêu cầu không còn hợp lệ do phiên đã thay đổi. Vui lòng tải lại trang rồi thử lại.";

export const MSG_CSRF_MISSING =
  "Hệ thống không thể xác thực thao tác. Vui lòng tải lại trang và thử lại.";

/**
 * @param code — ví dụ CSRF_TOKEN_EXPIRED, UNAUTHORIZED
 * @param fallback — khi không map được và server không gửi câu rõ ràng
 */
export function toUserFacingApiError(
  raw: string | undefined | null,
  code?: string | null,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại sau."
): string {
  const c = (code ?? "").trim().toUpperCase();
  const r = (raw ?? "").trim();

  if (c === "CSRF_TOKEN_EXPIRED" || /csrf token expired/i.test(r)) {
    return MSG_CSRF_EXPIRED;
  }
  if (c === "CSRF_TOKEN_INVALID" || /csrf token invalid/i.test(r)) {
    return MSG_CSRF_INVALID;
  }
  if (c === "CSRF_TOKEN_REQUIRED" || /csrf token missing/i.test(r)) {
    return MSG_CSRF_MISSING;
  }
  if (/\bcsrf\b/i.test(r) && /token/i.test(r)) {
    return MSG_CSRF_EXPIRED;
  }
  if (
    c === "UNAUTHORIZED" ||
    /^unauthorized$/i.test(r) ||
    /token expired/i.test(r) ||
    /session (has )?expired/i.test(r)
  ) {
    return MSG_SESSION_EXPIRED;
  }
  if (r) return r;
  return fallback;
}
