import { getApiBase, handleApiError } from "./client";
import type { VariantDetailDto, ProductInfoDto } from "../types";

const API_BASE = getApiBase();

export async function fetchVariantDetail(
  variantId: number
): Promise<VariantDetailDto | null> {
  try {
    if (!variantId || variantId <= 0) return null;
    const res = await fetch(`${API_BASE}/api/variants/${variantId}/detail`);
    if (!res.ok) {
      if (res.status === 404) return null;
      handleApiError(res, "Không thể tải thông tin chi tiết sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return body?.data ?? null;
  } catch (error) {
    if (error instanceof Error) throw error;
    return null;
  }
}

export async function fetchProductInfo(
  baseName: string
): Promise<ProductInfoDto | null> {
  try {
    if (!baseName?.trim()) return null;
    const res = await fetch(
      `${API_BASE}/api/variants/product-info/${encodeURIComponent(baseName.trim())}`
    );
    if (!res.ok) {
      if (res.status === 404) return null;
      handleApiError(res, "Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return body?.data ?? null;
  } catch (error) {
    if (error instanceof Error) throw error;
    return null;
  }
}
