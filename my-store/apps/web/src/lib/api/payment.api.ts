import { getApiBase } from "./client";
import { authFetch } from "./auth";
import { fetchWithTimeoutAndRetry } from "../utils/fetchWithRetry";
import type {
  PaymentHealthResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  ConfirmBalancePaymentItem,
} from "../types";

const API_BASE = getApiBase();
const PAYMENT_FETCH_OPTIONS = { timeoutMs: 15000, retries: 2 };

export async function checkPaymentHealth(): Promise<PaymentHealthResponse> {
  try {
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/payment/health`,
      undefined,
      { timeoutMs: 10000, retries: 1 }
    );
    if (!res.ok) {
      return { success: false, configured: false };
    }
    return await res.json();
  } catch {
    return { success: false, configured: false };
  }
}

export async function createPayment(
  data: CreatePaymentRequest,
  accessToken?: string
): Promise<CreatePaymentResponse> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/payment/create`,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(data),
      },
      PAYMENT_FETCH_OPTIONS
    );
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || body.message || "Không thể tạo thanh toán. Vui lòng thử lại.",
      };
    }
    return body;
  } catch {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}

export async function checkPaymentStatus(
  orderId: string,
  accessToken?: string
): Promise<PaymentStatusResponse> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const res = await fetchWithTimeoutAndRetry(
      `${API_BASE}/api/payment/status/${encodeURIComponent(orderId)}`,
      { headers, credentials: "include" },
      PAYMENT_FETCH_OPTIONS
    );
    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error || "Không thể kiểm tra trạng thái thanh toán.",
      };
    }
    return body;
  } catch {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}

export function generateOrderId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
}

export async function confirmBalancePayment(
  amount: number,
  items: ConfirmBalancePaymentItem[]
): Promise<{
  success: boolean;
  data?: { newBalance: number; transactionId?: string; orderIds?: string[] };
  error?: string;
}> {
  try {
    const res = await authFetch(`${API_BASE}/api/payment/balance/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, items }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.error || "Xác nhận thanh toán thất bại." };
    }
    return body;
  } catch {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}

/** Xác nhận đã chuyển khoản/QR → ghi vào lịch sử giao dịch (cần đăng nhập) */
export async function confirmTransfer(
  orderId: string,
  amount: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api/payment/confirm-transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.error || "Xác nhận thanh toán thất bại." };
    }
    return body;
  } catch {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}
