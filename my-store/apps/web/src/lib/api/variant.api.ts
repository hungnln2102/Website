import { getApiBase, handleApiError } from "./client";
import type { VariantDetailDto, ProductInfoDto } from "../types";

const API_BASE = getApiBase();

/** Dữ liệu đầy đủ sản phẩm theo variant_id (tên, giá, hình, mô tả, quy tắc). */
export type VariantFullDataDto = {
  variantId: string;
  name: string;
  packageName: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  priceType: string;
  imageUrl?: string | null;
  description?: string | null;
  purchaseRules?: string | null;
};

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

export async function fetchVariantFullData(
  variantId: string,
  priceType: "retail" | "promo" | "ctv" = "retail"
): Promise<VariantFullDataDto | null> {
  try {
    if (!variantId?.trim()) return null;
    const url = `${API_BASE}/api/variants/${encodeURIComponent(variantId)}/full`;
    const res = await fetch(`${url}${priceType !== "retail" ? `?priceType=${priceType}` : ""}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      handleApiError(res, "Không thể tải thông tin sản phẩm.");
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
