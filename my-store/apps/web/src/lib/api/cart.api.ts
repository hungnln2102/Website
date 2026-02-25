import { getApiBase } from "./client";
import { ensureCsrfToken, handleUnauthorized } from "./auth";
import { fetchWithTimeoutAndRetry } from "../utils/fetchWithRetry";
import type {
  CartResponse,
  CartAddResponse,
  CartCountResponse,
} from "../types";

/** Khi API trả 401: clear session và thông báo đăng nhập lại (không hiển thị lỗi server). */
const SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

const API_BASE = getApiBase();
const CART_FETCH_OPTIONS = { timeoutMs: 15000, retries: 2 };

function handleCartResponse(res: Response, body: any, fallbackError: string): { success: false; error: string } | null {
  if (res.ok) return null;
  if (res.status === 401) {
    handleUnauthorized();
    return { success: false, error: SESSION_EXPIRED_MESSAGE };
  }
  return { success: false, error: body?.message || fallbackError };
}

/** accessToken có thể null khi đăng nhập bằng httpOnly cookie */
export async function fetchCart(accessToken: string | null): Promise<CartResponse> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/cart`,
      { headers, credentials: "include" },
      CART_FETCH_OPTIONS
    );
    const body = await res.json();
    const err = handleCartResponse(res, body, "Không thể tải giỏ hàng.");
    if (err) return err;
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/** Thông tin bổ sung lưu vào cart_items.extra_info: { "input_name": "Dữ liệu ô input" } */
export type CartExtraInfoPayload = Record<string, string>;

/** retail = khách lẻ, promo = khuyến mãi, ctv = cộng tác viên */
export type CartPriceType = "retail" | "promo" | "ctv";

/**
 * Thêm sản phẩm vào giỏ (ghi vào bảng cart_items).
 * extraInfo: object dạng { "input_name": "giá trị người dùng nhập" } → lưu vào cart_items.extra_info.
 */
export async function addToCart(
  accessToken: string | null,
  data: {
    variantId: string;
    quantity?: number;
    priceType?: CartPriceType;
    /** Thông tin bổ sung: key = input_name, value = dữ liệu ô input → lưu JSON vào extra_info */
    extraInfo?: CartExtraInfoPayload | null;
  }
): Promise<CartAddResponse> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/cart/add`,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(data),
      },
      CART_FETCH_OPTIONS
    );
    const body = await res.json();
    // CSRF token may be expired in Redis even if cookie exists → refresh once and retry
    if (res.status === 403 && body?.code?.startsWith?.("CSRF_")) {
      const refreshed = await ensureCsrfToken(true);
      if (refreshed) headers["x-csrf-token"] = refreshed;
      const retryRes = await fetchWithTimeoutAndRetry(
        `${API_BASE}/api/cart/add`,
        { method: "POST", headers, credentials: "include", body: JSON.stringify(data) },
        CART_FETCH_OPTIONS
      );
      const retryBody = await retryRes.json();
      const retryErr = handleCartResponse(retryRes, retryBody, "Không thể thêm vào giỏ hàng.");
      if (retryErr) return retryErr;
      return retryBody;
    }
    const err = handleCartResponse(res, body, "Không thể thêm vào giỏ hàng.");
    if (err) return err;
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function updateCartItem(
  accessToken: string | null,
  variantId: string,
  quantity: number
): Promise<CartResponse> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/cart/${encodeURIComponent(variantId)}`,
      { method: "PUT", headers, credentials: "include", body: JSON.stringify({ quantity }) },
      CART_FETCH_OPTIONS
    );
    const body = await res.json();
    const err = handleCartResponse(res, body, "Không thể cập nhật giỏ hàng.");
    if (err) return err;
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function removeFromCart(
  accessToken: string | null,
  variantId: string
): Promise<CartResponse> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/cart/${encodeURIComponent(variantId)}`,
      { method: "DELETE", headers, credentials: "include" },
      CART_FETCH_OPTIONS
    );
    const body = await res.json();
    const err = handleCartResponse(res, body, "Không thể xóa khỏi giỏ hàng.");
    if (err) return err;
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function clearCartApi(accessToken: string | null): Promise<CartResponse> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/cart`,
      { method: "DELETE", headers, credentials: "include" },
      CART_FETCH_OPTIONS
    );
    const body = await res.json();
    const err = handleCartResponse(res, body, "Không thể xóa giỏ hàng.");
    if (err) return err;
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function syncCart(
  accessToken: string | null,
  items: Array<{
    variantId: string;
    quantity: number;
    priceType?: CartPriceType;
    extraInfo?: CartExtraInfoPayload | null;
  }>
): Promise<CartResponse> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/cart/sync`,
      { method: "POST", headers, credentials: "include", body: JSON.stringify({ items }) },
      CART_FETCH_OPTIONS
    );
    const body = await res.json();
    const err = handleCartResponse(res, body, "Không thể đồng bộ giỏ hàng.");
    if (err) return err;
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function getCartCount(accessToken: string | null): Promise<CartCountResponse> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/cart/count`,
      { headers, credentials: "include" },
      CART_FETCH_OPTIONS
    );
    const body = await res.json();
    const err = handleCartResponse(res, body, "Không thể lấy số lượng giỏ hàng.");
    if (err) return err;
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}
