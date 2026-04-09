import { useMemo, useState, useCallback, useEffect } from "react";
import type { NormalizedProduct } from "./useHomeData";
import { ROUTES } from "@/lib/constants";
import { useCatalogGridColumnCount } from "@/features/catalog/hooks/useCatalogGridColumnCount";
import type { ProductSortLoadMore } from "@/features/catalog/hooks/useProductSort";

interface UseHomeFiltersOptions {
  products: NormalizedProduct[];
  categoryProductsMap: Map<string, Set<string>>;
}

const PREVIEW_COUNT = 5;
const ROWS_PER_REVEAL = 2;

const isNewProduct = (createdAt: string | null): boolean => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

export function useHomeFilters({ products, categoryProductsMap }: UseHomeFiltersOptions) {
  const gridCols = useCatalogGridColumnCount();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [revealSteps, setRevealSteps] = useState(1);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setShowAllProducts(params.get("view") === "all-products");
    };

    updateFromUrl();
    window.addEventListener("popstate", updateFromUrl);

    return () => {
      window.removeEventListener("popstate", updateFromUrl);
    };
  }, []);

  useEffect(() => {
    setRevealSteps(1);
  }, [selectedCategory, searchQuery, showAllProducts, products.length]);

  const newProducts = useMemo(() => {
    return [...products]
      .filter((p) => isNewProduct(p.created_at))
      .sort((a, b) => {
        const dateA = new Date(a.created_at!).getTime();
        const dateB = new Date(b.created_at!).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [products]);

  const bestSellingProducts = useMemo(() => {
    return [...products]
      .filter((p) => (p.sold_count_30d ?? 0) > 10)
      .sort((a, b) => {
        const sold30dA = a.sold_count_30d ?? 0;
        const sold30dB = b.sold_count_30d ?? 0;

        if (sold30dA !== sold30dB) {
          return sold30dB - sold30dA;
        }

        return (b.sales_count ?? 0) - (a.sales_count ?? 0);
      })
      .slice(0, 10);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== null) {
      result = result.filter((p) => {
        const productIds = categoryProductsMap.get(selectedCategory);
        if (!productIds || productIds.size === 0) return false;
        return productIds.has(String(p.id));
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    result = result.sort((a, b) => {
      const sold30dA = a.sold_count_30d ?? 0;
      const sold30dB = b.sold_count_30d ?? 0;

      const categoryA = sold30dA > 10 ? 2 : sold30dA >= 5 && sold30dA <= 10 ? 1 : 0;
      const categoryB = sold30dB > 10 ? 2 : sold30dB >= 5 && sold30dB <= 10 ? 1 : 0;

      if (categoryA !== categoryB) {
        return categoryB - categoryA;
      }

      if (sold30dA !== sold30dB) {
        return sold30dB - sold30dA;
      }

      return (b.sales_count ?? 0) - (a.sales_count ?? 0);
    });

    return result;
  }, [products, selectedCategory, categoryProductsMap, searchQuery]);

  const isDefaultView = !searchQuery && !selectedCategory;
  const isPreviewMode = isDefaultView && !showAllProducts;

  const displayedProducts = useMemo(() => {
    if (isPreviewMode) return filteredProducts.slice(0, PREVIEW_COUNT);
    const cap = Math.min(filteredProducts.length, revealSteps * ROWS_PER_REVEAL * gridCols);
    return filteredProducts.slice(0, cap);
  }, [isPreviewMode, filteredProducts, revealSteps, gridCols]);

  const productsLoadMore = useMemo((): ProductSortLoadMore | undefined => {
    if (isPreviewMode) return undefined;
    const cap = Math.min(filteredProducts.length, revealSteps * ROWS_PER_REVEAL * gridCols);
    const remaining = filteredProducts.length - cap;
    if (remaining <= 0) return undefined;
    return {
      remainingCount: remaining,
      onLoadMore: () => setRevealSteps((s) => s + 1),
      itemLabel: "sản phẩm",
    };
  }, [isPreviewMode, filteredProducts.length, revealSteps, gridCols]);

  const handleCategorySelect = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleLogoClick = useCallback(() => {
    setSelectedCategory(null);
    setShowAllProducts(false);
    setSearchQuery("");

    if (typeof window !== "undefined") {
      window.history.pushState({}, "", ROUTES.home);
      window.dispatchEvent(new Event("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return {
    selectedCategory,
    searchQuery,
    showAllProducts,
    newProducts,
    bestSellingProducts,
    filteredProducts,
    displayedProducts,
    isPreviewMode,
    productsLoadMore,
    setSearchQuery: handleSearchChange,
    handleCategorySelect,
    handleLogoClick,
  };
}
