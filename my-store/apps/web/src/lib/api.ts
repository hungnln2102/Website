// Get auth token from sessionStorage
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("accessToken");
}

// Event name for triggering logout on 401
export const AUTH_EXPIRED_EVENT = "auth:session-expired";

/**
 * Dispatch logout event when token expires (401 response)
 */
function handleUnauthorized(): void {
  if (typeof window !== "undefined") {
    // Clear tokens
    window.sessionStorage.removeItem("accessToken");
    window.sessionStorage.removeItem("refreshToken");
    window.sessionStorage.removeItem("auth_data");
    
    // Dispatch event to trigger logout in useAuth
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

/**
 * Authenticated fetch wrapper - automatically handles 401 by logging out
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
  
  // Auto logout on 401
  if (response.status === 401) {
    handleUnauthorized();
  }
  
  return response;
}

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
  is_active?: boolean;
  sales_count: number;
  sold_count_30d?: number;
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
  created_at?: string | null;
  sold_count_30d?: number;
  is_active?: boolean;
};

export type CategoryDto = {
  id: number;
  name: string;
  created_at: string | null;
  product_ids: number[];
};

const API_BASE = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

// SECURITY: Enforce HTTPS in production
if (import.meta.env.PROD && API_BASE && !API_BASE.startsWith('https://')) {
  console.error('SECURITY WARNING: API_BASE must use HTTPS in production!');
  // In production, this should throw to prevent insecure connections
  // throw new Error('HTTPS required for API connections in production');
}

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

// ============ Payment APIs ============

export type CreatePaymentRequest = {
  orderId: string;
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
};

export type CreatePaymentResponse = {
  success: boolean;
  data?: {
    checkoutUrl: string;
    orderId: string;
    amount: number;
    formFields?: Record<string, string>;
  };
  error?: string;
};

export type PaymentStatusResponse = {
  success: boolean;
  data?: {
    status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
    transactionId?: string;
    paidAt?: string;
  };
  error?: string;
};

export type PaymentHealthResponse = {
  success: boolean;
  configured: boolean;
};

/**
 * Check if payment service is configured
 */
export async function checkPaymentHealth(): Promise<PaymentHealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/health`);
    if (!res.ok) {
      return { success: false, configured: false };
    }
    return await res.json();
  } catch (error) {
    return { success: false, configured: false };
  }
}

/**
 * Create a new payment
 */
export async function createPayment(
  data: CreatePaymentRequest,
  accessToken?: string
): Promise<CreatePaymentResponse> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API_BASE}/api/payment/create`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(data),
    });

    const body = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: body.error || body.message || "Không thể tạo thanh toán. Vui lòng thử lại.",
      };
    }

    return body;
  } catch (error) {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  orderId: string,
  accessToken?: string
): Promise<PaymentStatusResponse> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API_BASE}/api/payment/status/${encodeURIComponent(orderId)}`, {
      headers,
      credentials: "include",
    });

    const body = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: body.error || "Không thể kiểm tra trạng thái thanh toán.",
      };
    }

    return body;
  } catch (error) {
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Generate unique order ID
 */
export function generateOrderId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
}

// ============ Cart APIs ============

export type CartItemDto = {
  id: string;
  variantId: string;
  quantity: number;
  name?: string;
  packageName?: string;
  duration?: string;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CartResponse = {
  success: boolean;
  data?: {
    items: CartItemDto[];
    totalItems: number;
  };
  message?: string;
  error?: string;
};

export type CartAddResponse = {
  success: boolean;
  data?: {
    item: CartItemDto;
    totalItems: number;
  };
  message?: string;
  error?: string;
};

export type CartCountResponse = {
  success: boolean;
  data?: {
    totalItems: number;
  };
  error?: string;
};

/**
 * Get cart items for authenticated user
 */
export async function fetchCart(accessToken: string): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể tải giỏ hàng." };
    }
    return body;
  } catch (error) {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  accessToken: string,
  data: {
    variantId: string;
    quantity?: number;
    extraInfo?: {
      name?: string;
      packageName?: string;
      duration?: string;
      price?: number;
      originalPrice?: number;
      discountPercentage?: number;
      imageUrl?: string;
    };
  }
): Promise<CartAddResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể thêm vào giỏ hàng." };
    }
    return body;
  } catch (error) {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  accessToken: string,
  variantId: string,
  quantity: number
): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/${encodeURIComponent(variantId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ quantity }),
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể cập nhật giỏ hàng." };
    }
    return body;
  } catch (error) {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  accessToken: string,
  variantId: string
): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/${encodeURIComponent(variantId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể xóa khỏi giỏ hàng." };
    }
    return body;
  } catch (error) {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Clear entire cart
 */
export async function clearCartApi(accessToken: string): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể xóa giỏ hàng." };
    }
    return body;
  } catch (error) {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Sync local cart to server (on login)
 */
export async function syncCart(
  accessToken: string,
  items: Array<{
    variantId: string;
    quantity: number;
    extraInfo?: {
      name?: string;
      packageName?: string;
      duration?: string;
      price?: number;
      originalPrice?: number;
      discountPercentage?: number;
      imageUrl?: string;
    };
  }>
): Promise<CartResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ items }),
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message || "Không thể đồng bộ giỏ hàng." };
    }
    return body;
  } catch (error) {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}

/**
 * Get cart item count
 */
export async function getCartCount(accessToken: string): Promise<CartCountResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/cart/count`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.message };
    }
    return body;
  } catch (error) {
    return { success: false, error: "Lỗi kết nối máy chủ." };
  }
}
