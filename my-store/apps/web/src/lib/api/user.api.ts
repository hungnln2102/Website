import { getApiBase } from "./client";
import { authFetch } from "./auth";
import type { UserOrder } from "../types";

const API_BASE = getApiBase();

export async function fetchUserOrders(): Promise<{
  success: boolean;
  data?: UserOrder[];
  error?: string;
}> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/orders`);
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.error || "Không thể tải đơn hàng." };
    }
    return { success: true, data: body.data || [] };
  } catch {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}
