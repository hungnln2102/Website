import { useMemo, useState, useCallback, useEffect } from "react";
import type { NormalizedProduct } from "./useHomeData";

interface UseHomeFiltersOptions {
  products: NormalizedProduct[];
  categoryProductsMap: Map<string, Set<string>>;
  perPage?: number;
}

// Helper function to check if product is new (created within 7 days)
const isNewProduct = (createdAt: string | null): boolean => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

export function useHomeFilters({
  products,
  categoryProductsMap,
  perPage = 12,
}: UseHomeFiltersOptions) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Listen for URL changes
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

  // Get new products (created within 7 days)
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

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategory !== null) {
      result = result.filter((p) => {
        const productIds = categoryProductsMap.get(selectedCategory);
        if (!productIds || productIds.size === 0) return false;
        return productIds.has(String(p.id));
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Sort: Best Selling (sold_count_30d > 10) > Hot (5 <= sold_count_30d <= 10) > others
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Display mode
  const isDefaultView = !searchQuery && !selectedCategory;
  const isPreviewMode = isDefaultView && !showAllProducts;
  const displayedProducts = isPreviewMode ? pageProducts.slice(0, 5) : pageProducts;

  // Handlers
  const handleCategorySelect = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleLogoClick = useCallback(() => {
    setSelectedCategory(null);
    setCurrentPage(1);
    setShowAllProducts(false);
    setSearchQuery("");

    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new Event("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return {
    // State
    selectedCategory,
    currentPage,
    searchQuery,
    showAllProducts,

    // Computed
    newProducts,
    filteredProducts,
    displayedProducts,
    totalPages,
    isPreviewMode,

    // Handlers
    setCurrentPage,
    setSearchQuery: handleSearchChange,
    handleCategorySelect,
    handleLogoClick,
  };
}
