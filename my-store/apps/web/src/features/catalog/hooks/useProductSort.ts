import { useMemo, useState, useEffect } from "react";
import type { SortOption } from "../components/SortToolbar";
import { useCatalogGridColumnCount } from "./useCatalogGridColumnCount";

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

export interface ProductSortLoadMore {
  remainingCount: number;
  onLoadMore: () => void;
  itemLabel: string;
}

interface UseProductSortOptions {
  products: Product[];
  searchQuery?: string;
  /**
   * Phân trang theo số bản ghi mỗi trang (client).
   * Chỉ dùng khi không bật `rowsPerReveal`.
   */
  perPage?: number;
  /**
   * Mỗi lần hiển thị / mỗi lần "Xem thêm" = N hàng đầy (N × số cột theo màn hình).
   * Ví dụ `2` → 2 hàng; bấm thêm → +2 hàng, đến khi hết danh sách.
   */
  rowsPerReveal?: number;
  /** Danh từ trong nút "Xem thêm …" — mặc định "sản phẩm". */
  loadMoreItemLabel?: string;
  defaultSort?: SortOption;
}

const SHOW_ALL = Number.MAX_SAFE_INTEGER;

export function useProductSort({
  products,
  searchQuery = "",
  perPage,
  rowsPerReveal,
  loadMoreItemLabel = "sản phẩm",
  defaultSort = "featured",
}: UseProductSortOptions) {
  const gridCols = useCatalogGridColumnCount();
  const rowMode = rowsPerReveal != null && rowsPerReveal > 0;
  const pageSize = rowMode ? SHOW_ALL : perPage ?? SHOW_ALL;

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);
  const [revealSteps, setRevealSteps] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    if (rowMode) setRevealSteps(1);
  }, [sortBy, searchQuery, rowMode, products]);

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

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return sortedProducts;
    const query = searchQuery.toLowerCase();
    return sortedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [sortedProducts, searchQuery]);

  const rowChunk = rowMode ? rowsPerReveal! * gridCols : 0;
  const visibleCap = rowMode ? Math.min(filteredProducts.length, revealSteps * rowChunk) : filteredProducts.length;

  const totalPages = rowMode
    ? 1
    : Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const paginatedProducts = useMemo(() => {
    if (rowMode) {
      return filteredProducts.slice(0, visibleCap);
    }
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize, rowMode, visibleCap]);

  const loadMore = useMemo((): ProductSortLoadMore | undefined => {
    if (!rowMode) return undefined;
    const remaining = filteredProducts.length - visibleCap;
    if (remaining <= 0) return undefined;
    return {
      remainingCount: remaining,
      onLoadMore: () => setRevealSteps((s) => s + 1),
      itemLabel: loadMoreItemLabel,
    };
  }, [rowMode, filteredProducts.length, visibleCap, loadMoreItemLabel]);

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
    loadMore,
  };
}
