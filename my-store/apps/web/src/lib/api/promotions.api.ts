import { getApiBase, handleApiError } from "./client";
import type { PromotionDto } from "../types";

const API_BASE = getApiBase();

export async function fetchPromotions(): Promise<PromotionDto[]> {
  try {
    const res = await fetch(`${API_BASE}/promotions`);
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return (body?.data ?? []) as PromotionDto[];
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
  }
}
