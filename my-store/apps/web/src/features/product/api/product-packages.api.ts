import { getApiBase, handleApiError } from "./client";
import type { ProductPackageDto } from "../types";

const API_BASE = getApiBase();

export async function fetchProductPackages(
  packageName: string
): Promise<ProductPackageDto[]> {
  try {
    const normalized = packageName.trim();
    if (!normalized) {
      throw new Error("Tên gói sản phẩm không hợp lệ.");
    }
    const encoded = encodeURIComponent(normalized);
    const res = await fetch(`${API_BASE}/product-packages/${encoded}`);
    if (!res.ok) {
      handleApiError(res, "Không thể tải thông tin gói sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    const list = (body?.data ?? []) as ProductPackageDto[];
    return list.map((p) => ({
      ...p,
      cost: Number(p.cost) || 0,
    }));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Không thể tải thông tin gói sản phẩm. Vui lòng thử lại sau.");
  }
}
