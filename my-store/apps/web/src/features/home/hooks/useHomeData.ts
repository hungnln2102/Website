import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCategories, fetchProducts, fetchPromotions, type CategoryDto, type PromotionDto } from "@/lib/api";
import { categoriesMock } from "@/lib/mockData";
import { slugify } from "@/lib/utils";

export interface NormalizedProduct {
  id: string;
  category_id: null;
  name: string;
  package: any;
  slug: string;
  description: string | null;
  full_description: null;
  base_price: number;
  image_url: string | null;
  is_featured: boolean;
  discount_percentage: number;
  has_promo: boolean;
  sales_count: number;
  sold_count_30d: number;
  average_rating: number;
  purchase_rules: null;
  package_count: number;
  created_at: string | null;
}

export interface CategoryUI {
  id: string;
  name: string;
  slug: string;
  description: null;
  icon: string;
  created_at: string;
}

export function useHomeData() {
  const queryClient = useQueryClient();

  // Fetch products
  const {
    data: products = [],
    isLoading: loading,
    error: fetchError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Fetch promotions
  const {
    data: promotions = [] as PromotionDto[],
    isLoading: loadingPromotions,
    error: promotionsError,
    refetch: refetchPromotions,
  } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  // Fetch categories
  const {
    data: categories = [],
    isLoading: loadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Error messages
  const productsError =
    fetchError instanceof Error
      ? fetchError.message
      : fetchError
      ? "Không lấy được danh sách sản phẩm"
      : null;
  const categoriesErrorMsg =
    categoriesError instanceof Error
      ? categoriesError.message
      : categoriesError
      ? "Không lấy được danh sách danh mục"
      : null;
  const promotionsErrorMsg =
    promotionsError instanceof Error
      ? promotionsError.message
      : promotionsError
      ? "Không lấy được danh sách khuyến mãi"
      : null;

  // Retry handlers
  const handleRetryProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleRetryCategories = () => {
    refetchCategories();
  };

  const handleRetryPromotions = () => {
    refetchPromotions();
  };

  // Transform categories for UI
  const categoriesUi = useMemo<CategoryUI[]>(() => {
    if (loadingCategories && categories.length === 0) {
      return [];
    }
    if (categories.length === 0) {
      return categoriesMock as CategoryUI[];
    }
    return categories.map((c: CategoryDto) => {
      const slug = slugify(c.name);
      return {
        id: String(c.id),
        name: c.name,
        slug,
        description: null,
        icon: "FileText",
        created_at: c.created_at ?? new Date().toISOString(),
      };
    });
  }, [categories, loadingCategories]);

  // Build category products map
  const categoryProductsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    categories.forEach((c: CategoryDto) => {
      const slug = slugify(c.name);
      const ids = (c.product_ids ?? []).map((id) => String(id));
      map.set(slug, new Set(ids));
    });
    return map;
  }, [categories]);

  // Normalize products
  const normalizedProducts = useMemo<NormalizedProduct[]>(
    () =>
      products.map((p: any) => ({
        id: String(p.id),
        category_id: null,
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
        sold_count_30d: p.sold_count_30d ?? 0,
        average_rating: p.average_rating ?? 0,
        purchase_rules: null,
        package_count: p.package_count ?? 1,
        created_at: p.created_at || null,
      })),
    [products]
  );

  return {
    // Raw data
    products: normalizedProducts,
    promotions,
    categories: categoriesUi,
    categoryProductsMap,

    // Loading states
    loading,
    loadingPromotions,
    loadingCategories,

    // Errors
    productsError,
    categoriesError: categoriesErrorMsg,
    promotionsError: promotionsErrorMsg,

    // Retry handlers
    handleRetryProducts,
    handleRetryCategories,
    handleRetryPromotions,
  };
}
