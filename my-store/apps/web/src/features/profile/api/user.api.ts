import { getApiBase } from "@/lib/api/client";
import { authFetch } from "@/features/auth/api/auth";
import type {
  UserOrder,
  WalletTransactionDto,
  UserProfileDto,
  UserSessionDto,
  UserActivityLogDto,
} from "@/lib/types";

const API_BASE = getApiBase();

/** Kết quả chuẩn { success, error? } cho các API cập nhật */
type ApiResult = { success: boolean; error?: string; message?: string };

export async function fetchUserProfile(): Promise<UserProfileDto | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/profile`);
    const data = await res.json().catch(() => null);
    if (!res.ok) return null;
    return data as UserProfileDto;
  } catch {
    return null;
  }
}

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

export async function fetchUserTransactions(params?: { limit?: number }): Promise<{
  success: boolean;
  data?: WalletTransactionDto[];
  error?: string;
}> {
  try {
    const url = new URL(`${API_BASE}/api/user/transactions`);
    if (params?.limit != null) url.searchParams.set("limit", String(params.limit));
    const res = await authFetch(url.toString());
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

export async function updateProfile(payload: {
  firstName: string;
  lastName: string;
}): Promise<ApiResult> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (data as any).error || "Cập nhật thất bại." };
    }
    return { success: true, message: (data as any).message };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." };
  }
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResult> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (data as any).error || "Đổi mật khẩu thất bại." };
    }
    return { success: true, message: (data as any).message };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." };
  }
}

export async function changeEmail(payload: {
  newEmail: string;
  password: string;
}): Promise<ApiResult> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/email`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (data as any).error || "Cập nhật email thất bại." };
    }
    return { success: true, message: (data as any).message };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." };
  }
}

export async function getSessions(): Promise<{
  success: boolean;
  sessions?: UserSessionDto[];
  error?: string;
}> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/sessions`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (data as any).error || "Không thể tải phiên đăng nhập." };
    }
    return { success: true, sessions: (data as any).sessions ?? [] };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." };
  }
}

export async function revokeSession(sessionId: number): Promise<ApiResult> {
  try {
    const res = await authFetch(
      `${API_BASE}/api/user/sessions/${encodeURIComponent(String(sessionId))}`,
      { method: "DELETE" }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (data as any).error || "Xóa phiên thất bại." };
    }
    return { success: true, message: (data as any).message };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." };
  }
}

export interface UserReviewDto {
  id: number;
  productId: number;
  productName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function fetchUserReviews(): Promise<{
  success: boolean;
  data?: UserReviewDto[];
  error?: string;
}> {
  try {
    const res = await authFetch(`${API_BASE}/api/user/reviews`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (body as any).error || "Không thể tải bình luận." };
    }
    return { success: true, data: (body as any).data ?? [] };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

export async function getActivity(params?: { limit?: number }): Promise<{
  success: boolean;
  logs?: UserActivityLogDto[];
  error?: string;
}> {
  try {
    const url = new URL(`${API_BASE}/api/user/activity`);
    if (params?.limit != null) url.searchParams.set("limit", String(params.limit));
    const res = await authFetch(url.toString());
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (data as any).error || "Không thể tải lịch sử hoạt động." };
    }
    return { success: true, logs: (data as any).logs ?? [] };
  } catch {
    return { success: false, error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau." };
  }
}
