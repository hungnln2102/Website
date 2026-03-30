import { getApiBase, handleApiError, apiFetch } from "./client";
import type { PromotionDto } from "../types";

const API_BASE = getApiBase();

export async function fetchPromotions(): Promise<PromotionDto[]> {
  try {
    const res = await apiFetch(`${API_BASE}/promotions`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
    }
    return (body?.data ?? []) as PromotionDto[];
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
  }
}
