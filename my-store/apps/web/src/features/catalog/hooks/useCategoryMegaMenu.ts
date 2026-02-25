import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProducts, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";

export type CategoryItem = { id: string; name: string; slug: string; icon?: string | null };

export function useCategoryMegaMenu(
  propsCategories?: CategoryItem[] | null,
  propsSelectedCategory?: string | null,
  hoveredCategorySlug: string | null = null
) {
  const { data: fetchedCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: !propsCategories?.length,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const categories = useMemo((): CategoryItem[] => {
    if (propsCategories?.length) return propsCategories;
    return fetchedCategories.map((c: CategoryDto) => ({
      id: String(c.id),
      name: c.name,
      slug: slugify(c.name),
      icon: null,
    }));
  }, [propsCategories, fetchedCategories]);

  const activeHoveredSlug =
    hoveredCategorySlug ??
    propsSelectedCategory ??
    (categories.length > 0 ? categories[0].slug : null);

  const filteredProducts = useMemo(() => {
    if (activeHoveredSlug == null) return [];
    const categoryData = fetchedCategories.find(
      (c: CategoryDto) => slugify(c.name) === activeHoveredSlug
    );
    if (!categoryData) return [];
    const productIds = new Set(
      (categoryData.product_ids ?? []).map(String)
    );
    const filtered = allProducts.filter((p: { id: unknown }) =>
      productIds.has(String(p.id))
    );
    return filtered.slice(0, 6).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      name: p.name,
      description: p.description ?? null,
      base_price: p.base_price ?? 0,
      image_url: p.image_url ?? null,
      discount_percentage: p.discount_percentage ?? 0,
      sales_count: p.sales_count ?? 0,
      average_rating: p.average_rating ?? 0,
      package_count: p.package_count ?? 1,
      slug: (p.slug as string) || slugify(String(p.name)),
      category_id: p.category_id ?? null,
      created_at: p.created_at ?? new Date().toISOString(),
      full_description: null,
      is_featured: false,
      purchase_rules: null,
    }));
  }, [activeHoveredSlug, fetchedCategories, allProducts]);

  return { categories, activeHoveredSlug, filteredProducts };
}
