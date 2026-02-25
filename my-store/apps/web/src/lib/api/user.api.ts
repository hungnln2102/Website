import { getApiBase } from "./client";
import { authFetch } from "./auth";
import type { UserOrder, WalletTransactionDto } from "../types";

const API_BASE = getApiBase();

export async function fetchUserOrders(): Promise<{
  success: boolean;
  data?: UserOrder[];
  error?: string;
}> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/orders`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (body as any).error || "Không thể tải đơn hàng." };
    }
    return { success: true, data: (body as any).data || [] };
  } catch {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}

export async function fetchUserTransactions(): Promise<{
  success: boolean;
  data?: WalletTransactionDto[];
  error?: string;
}> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/transactions`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (body as any).error || "Không thể tải lịch sử giao dịch." };
    }
    return { success: true, data: (body as any).data || [] };
  } catch {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}
