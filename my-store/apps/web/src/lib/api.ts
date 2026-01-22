export type ProductDto = {
  id: number;
  slug: string;
  name: string;
  package: string;
  description: string;
  image_url: string;
  base_price: number;
  discount_percentage: number;
  has_promo?: boolean;
  sales_count: number;
  average_rating: number;
  package_count?: number;
};

export type ProductPackageDto = {
  id: number;
  package: string | null;
  package_product?: string | null;
  id_product?: string | null;
  cost: number;
};

export type CategoryDto = {
  id: number;
  name: string;
  created_at: string | null;
  product_ids: number[];
};

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export async function fetchProducts(): Promise<ProductDto[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    throw new Error(`Fetch products failed: ${res.status}`);
  }
  const body = await res.json();
  return (body?.data ?? []) as ProductDto[];
}

export async function fetchCategories(): Promise<CategoryDto[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) {
    throw new Error(`Fetch categories failed: ${res.status}`);
  }
  const body = await res.json();
  const list = (body?.data ?? []) as CategoryDto[];
  return list.map((c) => ({
    ...c,
    product_ids: (c.product_ids ?? []).map((id) => Number(id)).filter(Number.isFinite),
  }));
}

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

export type VariantDetailDto = {
  variant_id: number;
  display_name: string;
  variant_name: string;
  product_id: number;
  base_name: string;
  duration: string;
  description: string | null;
  image_url: string | null;
  sold_count: number;
};

export type ProductInfoDto = {
  base_name: string;
  description: string | null;
  image_url: string | null;
  total_sold_count: number;
  variants: VariantDetailDto[];
};

export async function fetchVariantDetail(variantId: number): Promise<VariantDetailDto | null> {
  const res = await fetch(`${API_BASE}/api/variants/${variantId}/detail`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Fetch variant detail failed: ${res.status}`);
  }
  const body = await res.json();
  return body?.data ?? null;
}

export async function fetchProductInfo(baseName: string): Promise<ProductInfoDto | null> {
  const res = await fetch(`${API_BASE}/api/variants/product-info/${encodeURIComponent(baseName)}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Fetch product info failed: ${res.status}`);
  }
  const body = await res.json();
  return body?.data ?? null;
}
