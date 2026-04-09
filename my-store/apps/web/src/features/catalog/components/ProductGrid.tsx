"use client";

import { ChevronDown, LucideIcon, Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import type { ProductSortLoadMore } from "../hooks/useProductSort";

interface Product {
  id: string;
  name: string;
  package: string;
  package_product?: string | null;
  slug: string;
  description?: string | null;
  base_price: number;
  from_price?: number;
  image_url?: string | null;
  discount_percentage: number;
  sales_count: number;
  average_rating: number;
  package_count: number;
}

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onProductClick: (slug: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Hiển thị nút "Xem thêm" (ưu tiên hơn phân trang khi có). */
  loadMore?: ProductSortLoadMore | null;
  /** Số skeleton khi loading (không liên quan số SP thật trên trang). */
  loadingSkeletonCount?: number;
  /** Ẩn giá và mô tả (dùng trong trang danh mục). */
  hidePriceAndDescription?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyMessage?: string;
  isNew?: boolean;
}

export function ProductGrid({
  products,
  loading,
  error,
  onRetry,
  onProductClick,
  currentPage,
  totalPages,
  onPageChange,
  loadMore = null,
  loadingSkeletonCount = 20,
  emptyIcon: EmptyIcon = Package,
  hidePriceAndDescription = false,
  emptyTitle = "Chưa có sản phẩm",
  emptyMessage = "Hiện chưa có sản phẩm nào.",
  isNew = false,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: loadingSkeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && onRetry) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <EmptyIcon className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-700" />
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{error}</h2>
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <EmptyIcon className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-700" />
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{emptyTitle}</h2>
        <p className="text-gray-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onClick={() => onProductClick(product.slug)}
            isNew={isNew}
            hidePriceAndDescription={hidePriceAndDescription}
          />
        ))}
      </div>
      {loadMore ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore.onLoadMore}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-500 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            Xem thêm {loadMore.remainingCount} {loadMore.itemLabel}
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      ) : (
        totalPages > 1 && (
          <div className="mt-8">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        )
      )}
    </>
  );
}
