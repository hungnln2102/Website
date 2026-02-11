import { getApiBase } from "./client";
import type {
  CartResponse,
  CartAddResponse,
  CartCountResponse,
} from "../types";

const API_BASE = getApiBase();

export async function fetchCart(accessToken: string): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể tải giỏ hàng." };
    }
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function addToCart(
  accessToken: string,
  data: {
    variantId: string;
    quantity?: number;
    extraInfo?: {
      name?: string;
      packageName?: string;
      duration?: string;
      price?: number;
      originalPrice?: number;
      discountPercentage?: number;
      imageUrl?: string;
    };
  }
): Promise<CartAddResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể thêm vào giỏ hàng." };
    }
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function updateCartItem(
  accessToken: string,
  variantId: string,
  quantity: number
): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/${encodeURIComponent(variantId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ quantity }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể cập nhật giỏ hàng." };
    }
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function removeFromCart(
  accessToken: string,
  variantId: string
): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/${encodeURIComponent(variantId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể xóa khỏi giỏ hàng." };
    }
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function clearCartApi(accessToken: string): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể xóa giỏ hàng." };
    }
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function syncCart(
  accessToken: string,
  items: Array<{
    variantId: string;
    quantity: number;
    extraInfo?: {
      name?: string;
      packageName?: string;
      duration?: string;
      price?: number;
      originalPrice?: number;
      discountPercentage?: number;
      imageUrl?: string;
    };
  }>
): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ items }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể đồng bộ giỏ hàng." };
    }
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function getCartCount(accessToken: string): Promise<CartCountResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/count`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message };
    }
    return body;
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}
