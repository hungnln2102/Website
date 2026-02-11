import { getApiBase, handleApiError } from "./client";
import type { ProductDto } from "../types";

const API_BASE = getApiBase();

export async function fetchProducts(): Promise<ProductDto[]> {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return (body?.data ?? []) as ProductDto[];
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
  }
}
