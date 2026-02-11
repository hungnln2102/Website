import { getApiBase, handleApiError } from "./client";
import type { CategoryDto } from "../types";

const API_BASE = getApiBase();

export async function fetchCategories(): Promise<CategoryDto[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    const list = (body?.data ?? []) as CategoryDto[];
    return list.map((c) => ({
      ...c,
      product_ids: (c.product_ids ?? []).map((id) => (typeof id === "number" ? id : Number(id) || 0)),
    }));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.");
  }
}
