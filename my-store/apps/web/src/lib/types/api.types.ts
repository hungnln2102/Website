/**
 * API-related type definitions (DTOs and response shapes).
 */

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
  category_id?: string | null;
  created_at?: string;
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
  /** form_id từ variant → dùng để lấy form Thông tin bổ sung động (form_name + form_input + inputs) */
  form_id?: number | null;
};

export type CategoryDto = {
  id: number;
  name: string;
  created_at: string | null;
  product_ids: number[];
};

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

// ----- Payment -----
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

export type ConfirmBalancePaymentItem = {
  id_product: string;
  name?: string;
  variant_name?: string;
  duration?: string;
  note?: string;
  quantity: number;
  price: number;
};

// ----- User / Orders -----
export type UserOrderItem = {
  id_product: string;
  price: number;
  name?: string;
  variant_name?: string;
  duration?: string;
  note?: string;
  quantity?: number;
  unitPrice?: number;
};

export type UserOrder = {
  id_order: string;
  order_date: string;
  status: string;
  items: UserOrderItem[];
};

// ----- Form -----
export type FormFieldDto = {
  input_id: number;
  input_name: string;
  input_type: string;
  required: boolean;
  sort_order: number;
};

export type FormFieldsResponse = {
  form: { id: number; name: string; description: string | null };
  fields: FormFieldDto[];
};

// ----- Cart -----
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
