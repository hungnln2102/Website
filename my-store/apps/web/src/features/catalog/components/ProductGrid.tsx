"use client";

import { LucideIcon, Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  base_price: number;
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
  perPage?: number;
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
  perPage = 12,
  emptyIcon: EmptyIcon = Package,
  emptyTitle = "Chưa có sản phẩm",
  emptyMessage = "Hiện chưa có sản phẩm nào.",
  isNew = false,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: perPage }).map((_, i) => (
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onClick={() => onProductClick(product.slug)}
            isNew={isNew}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </>
  );
}
