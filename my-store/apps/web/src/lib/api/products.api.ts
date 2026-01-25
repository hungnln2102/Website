import type { ProductDto } from "../types";

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

/**
 * Fetches all products from the API
 */
export async function fetchProducts(): Promise<ProductDto[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    throw new Error(`Fetch products failed: ${res.status}`);
  }
  const body = await res.json();
  return (body?.data ?? []) as ProductDto[];
}
