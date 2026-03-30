import { getApiBase, handleApiError, apiFetch } from "./client";
import type { ProductDto } from "../types";

const API_BASE = getApiBase();

export async function fetchProducts(): Promise<ProductDto[]> {
  try {
    const res = await apiFetch(`${API_BASE}/products`, undefined, 20_000);
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
