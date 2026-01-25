import type { CategoryDto } from "../types";

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

/**
 * Fetches all categories from the API
 */
export async function fetchCategories(): Promise<CategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) {
    throw new Error(`Fetch categories failed: ${res.status}`);
  }
  const body = await res.json();
  const list = (body?.data ?? []) as CategoryDto[];
  return list.map((c) => ({
    ...c,
    product_ids: (c.product_ids ?? []).map((id) => String(id)),
  }));
}
