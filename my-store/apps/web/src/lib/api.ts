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

export type PromotionDto = ProductDto & {
  variant_id: number;
  id_product: string;
};

export type ProductPackageDto = {
  id: number;
  package: string | null;
  package_product?: string | null;
  id_product?: string | null;
  cost: number;
  pct_promo?: number;
  description?: string | null;
  image_url?: string | null;
  purchase_rules?: string | null;
};

export type CategoryDto = {
  id: number;
  name: string;
  created_at: string | null;
  product_ids: number[];
};

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

/**
 * Generic error handler that sanitizes error messages to prevent information leakage
 */
function handleApiError(res: Response, defaultMessage: string): never {
  // Don't expose internal error details to users
  if (res.status >= 500) {
    throw new Error("Máy chủ đang gặp sự cố. Vui lòng thử lại sau.");
  }
  if (res.status === 404) {
    throw new Error("Không tìm thấy dữ liệu yêu cầu.");
  }
  if (res.status === 403) {
    throw new Error("Bạn không có quyền truy cập.");
  }
  if (res.status === 401) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
  throw new Error(defaultMessage);
}

export async function fetchProducts(): Promise<ProductDto[]> {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return (body?.data ?? []) as ProductDto[];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
  }
}

export async function fetchPromotions(): Promise<PromotionDto[]> {
  try {
    const res = await fetch(`${API_BASE}/promotions`);
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return (body?.data ?? []) as PromotionDto[];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
  }
}

export async function fetchCategories(): Promise<CategoryDto[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) {
      handleApiError(res, "Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    const list = (body?.data ?? []) as CategoryDto[];
    return list.map((c) => ({
      ...c,
      product_ids: (c.product_ids ?? []).map((id) => String(id)),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.");
  }
}

export async function fetchProductPackages(packageName: string): Promise<ProductPackageDto[]> {
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
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể tải thông tin gói sản phẩm. Vui lòng thử lại sau.");
  }
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
  purchase_rules: string | null;
  total_sold_count: number;
  variants: any[];
};

export async function fetchVariantDetail(variantId: number): Promise<VariantDetailDto | null> {
  try {
    if (!variantId || variantId <= 0) {
      return null;
    }
    const res = await fetch(`${API_BASE}/api/variants/${variantId}/detail`);
    if (!res.ok) {
      if (res.status === 404) return null;
      handleApiError(res, "Không thể tải thông tin chi tiết sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return body?.data ?? null;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    return null;
  }
}

export async function fetchProductInfo(baseName: string): Promise<ProductInfoDto | null> {
  try {
    if (!baseName || !baseName.trim()) {
      return null;
    }
    const res = await fetch(`${API_BASE}/api/variants/product-info/${encodeURIComponent(baseName.trim())}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      handleApiError(res, "Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
    }
    const body = await res.json();
    return body?.data ?? null;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    return null;
  }
}
