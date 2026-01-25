import type { PromotionDto } from "../types";

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

/**
 * Fetches all promotions from the API
 */
export async function fetchPromotions(): Promise<PromotionDto[]> {
  const res = await fetch(`${API_BASE}/promotions`);
  if (!res.ok) {
    throw new Error(`Fetch promotions failed: ${res.status}`);
  }
  const body = await res.json();
  return (body?.data ?? []) as PromotionDto[];
}
