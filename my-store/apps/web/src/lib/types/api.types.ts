/**
 * API-related type definitions
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
  sales_count: number;
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
