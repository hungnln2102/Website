import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts } from "@/lib/api";
import type { ProductDto } from "@/lib/types";
import { QUERY_KEYS } from "@/lib/constants";

export interface NormalizedProduct {
  id: string;
  category_id: string | null;
  name: string;
  package: string | null;
  slug: string;
  description: string | null;
  full_description: string | null;
  base_price: number;
  image_url: string | null;
  is_featured: boolean;
  discount_percentage: number;
  has_promo: boolean;
  sales_count: number;
  average_rating: number;
  purchase_rules: string | null;
  package_count: number;
  created_at: string;
}

/**
 * Custom hook to fetch and normalize products
 */
export const useProducts = () => {
  const {
    data: products = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: fetchProducts,
  });

  const normalizedProducts = useMemo<NormalizedProduct[]>(
    () =>
      products.map((p: ProductDto) => ({
        id: String(p.id),
        category_id: p.category_id,
        name: p.name,
        package: p.package,
        slug: p.slug,
        description: p.description,
        full_description: null,
        base_price: p.base_price ?? 0,
        image_url: p.image_url,
        is_featured: false,
        discount_percentage: p.discount_percentage ?? 0,
        has_promo: p.has_promo ?? false,
        sales_count: p.sales_count ?? 0,
        average_rating: p.average_rating ?? 0,
        purchase_rules: null,
        package_count: p.package_count ?? 1,
        created_at: p.created_at ?? new Date().toISOString(),
      })),
    [products]
  );

  const error = fetchError ? "Không lấy được danh sách sản phẩm" : null;

  return {
    products: normalizedProducts,
    isLoading,
    error,
  };
};
