import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchCategories } from "@/lib/api";
import type { CategoryDto } from "@/lib/types";
import { categoriesMock } from "@/lib/mockData";
import { slugify } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/constants";

export interface CategoryUI {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  created_at: string;
  product_ids: string[];
}

/**
 * Custom hook to fetch and normalize categories
 */
export const useCategories = () => {
  const {
    data: categories = [],
    isLoading: loadingCategories,
  } = useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchCategories,
  });

  const categoriesUi = useMemo<CategoryUI[]>(() => {
    if (loadingCategories && categories.length === 0) {
      return [];
    }
    if (categories.length === 0) {
      return categoriesMock.map((c) => ({
        id: String(c.id),
        name: c.name,
        slug: slugify(c.name),
        description: null,
        icon: "FileText",
        created_at: c.created_at ?? new Date().toISOString(),
        product_ids: c.product_ids ?? [],
      }));
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
        product_ids: c.product_ids ?? [],
      };
    });
  }, [categories, loadingCategories]);

  const categoryProductsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    categories.forEach((c) => {
      const slug = slugify(c.name);
      const ids = (c.product_ids ?? []).map((id) => String(id));
      map.set(slug, new Set(ids));
    });
    return map;
  }, [categories]);

  return {
    categories: categoriesUi,
    categoryProductsMap,
    isLoading: loadingCategories,
  };
};
