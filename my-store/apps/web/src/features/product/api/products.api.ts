import { getApiBase, handleApiError, apiFetch } from "@/lib/api/client";
import type { ProductDto } from "@/lib/types";

const API_BASE = getApiBase();

const VALID_PRICE_SCOPE = new Set(["MAV", "MAVC", "MAVL", "MAVK", "MAVT", "MAVN", "MAVS"]);

/** Khóa React Query theo mã giá (cookie JWT + phiên đăng nhập). */
export function productsQueryKey(roleCode?: string | null): readonly [string, string] {
  const c = roleCode?.trim().toUpperCase().slice(0, 4) ?? "";
  const scope = c && VALID_PRICE_SCOPE.has(c) ? c : "MAVL";
  return ["products", scope] as const;
}

export async function fetchProducts(): Promise<ProductDto[]> {
  try {
    const res = await apiFetch(`${API_BASE}/products`, { credentials: "include" }, 20_000);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
    }
    return (body?.data ?? []) as ProductDto[];
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
  }
}
