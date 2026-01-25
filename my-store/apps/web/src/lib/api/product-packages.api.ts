import type { ProductPackageDto, VariantDetailDto, ProductInfoDto } from "../types";

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

/**
 * Fetches product packages by package name
 */
export async function fetchProductPackages(packageName: string): Promise<ProductPackageDto[]> {
  const normalized = packageName.trim();
  const encoded = encodeURIComponent(normalized);
  const res = await fetch(`${API_BASE}/product-packages/${encoded}`);
  if (!res.ok) {
    throw new Error(`Fetch product packages failed: ${res.status}`);
  }
  const body = await res.json();
  const list = (body?.data ?? []) as ProductPackageDto[];
  return list.map((p) => ({
    ...p,
    cost: Number(p.cost) || 0,
  }));
}

/**
 * Fetches variant detail by variant ID
 */
export async function fetchVariantDetail(variantId: number): Promise<VariantDetailDto | null> {
  const res = await fetch(`${API_BASE}/api/variants/${variantId}/detail`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Fetch variant detail failed: ${res.status}`);
  }
  const body = await res.json();
  return body?.data ?? null;
}

/**
 * Fetches product info by base name
 */
export async function fetchProductInfo(baseName: string): Promise<ProductInfoDto | null> {
  const res = await fetch(`${API_BASE}/api/variants/product-info/${encodeURIComponent(baseName)}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Fetch product info failed: ${res.status}`);
  }
  const body = await res.json();
  return body?.data ?? null;
}
