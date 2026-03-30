import { getApiBase } from "./client";

export interface TopupPackageDto {
  id: string;
  product_id: string;
  amount: number;
  promotion_percent: number;
}

export async function fetchTopupPackages(): Promise<TopupPackageDto[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/topup/packages`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Lỗi lấy danh sách gói nạp");
  }
  const data = await res.json();
  return data.packages ?? [];
}

/** Lấy mã nội dung chuyển khoản MAVNAPXXXXX (unique, không trùng wallet_transactions). Cần đăng nhập. */
export async function fetchTopupTransferCode(authFetch: (url: string, init?: RequestInit) => Promise<Response>): Promise<string> {
  const base = getApiBase();
  const res = await authFetch(`${base}/api/topup/transfer-code`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Lỗi tạo mã chuyển khoản");
  return data.transactionCode ?? "";
}
