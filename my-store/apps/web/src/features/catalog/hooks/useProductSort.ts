import { useMemo, useState, useEffect } from "react";
import type { SortOption } from "../components/SortToolbar";

interface Product {
  id: string;
  name: string;
  base_price: number;
  discount_percentage: number;
  sales_count: number;
  sold_count_30d?: number;
  created_at: string;
  [key: string]: any;
}

interface UseProductSortOptions {
  products: Product[];
  searchQuery?: string;
  perPage?: number;
  defaultSort?: SortOption;
}

export function useProductSort({
  products,
  searchQuery = "",
  perPage = 12,
  defaultSort = "featured",
}: UseProductSortOptions) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);

  // Reset page when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, searchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    switch (sortBy) {
      case "featured":
        return sorted.sort((a, b) => {
          const sold30dA = a.sold_count_30d ?? 0;
          const sold30dB = b.sold_count_30d ?? 0;
          const categoryA = sold30dA > 10 ? 2 : sold30dA >= 5 ? 1 : 0;
          const categoryB = sold30dB > 10 ? 2 : sold30dB >= 5 ? 1 : 0;
          if (categoryA !== categoryB) return categoryB - categoryA;
          if (sold30dA !== sold30dB) return sold30dB - sold30dA;
          const discountDiff = (b.discount_percentage ?? 0) - (a.discount_percentage ?? 0);
          if (discountDiff !== 0) return discountDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      case "best-selling":
        return sorted.sort((a, b) => (b.sold_count_30d ?? b.sales_count ?? 0) - (a.sold_count_30d ?? a.sales_count ?? 0));
      case "discount":
        return sorted.sort((a, b) => (b.discount_percentage ?? 0) - (a.discount_percentage ?? 0));
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "price-asc":
        return sorted.sort((a, b) => {
          const priceA = a.base_price * (1 - (a.discount_percentage ?? 0) / 100);
          const priceB = b.base_price * (1 - (b.discount_percentage ?? 0) / 100);
          return priceA - priceB;
        });
      case "price-desc":
        return sorted.sort((a, b) => {
          const priceA = a.base_price * (1 - (a.discount_percentage ?? 0) / 100);
          const priceB = b.base_price * (1 - (b.discount_percentage ?? 0) / 100);
          return priceB - priceA;
        });
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "vi"));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name, "vi"));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  // Filter by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return sortedProducts;
    const query = searchQuery.toLowerCase();
    return sortedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [sortedProducts, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, currentPage, perPage]);

  return {
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    sortedProducts,
    filteredProducts,
    paginatedProducts,
    totalPages,
    totalCount: filteredProducts.length,
  };
}
