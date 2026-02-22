"use client";

import { Package, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  discount_percentage: number;
  has_promo: boolean;
  sales_count: number;
  sold_count_30d: number;
  average_rating: number;
  package_count: number;
  created_at: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AllProductsSectionProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  currentPage: number;
  totalPages: number;
  isPreviewMode: boolean;
  onProductClick: (slug: string) => void;
  onPageChange: (page: number) => void;
}

export function AllProductsSection({
  products,
  categories,
  loading,
  searchQuery,
  selectedCategory,
  currentPage,
  totalPages,
  isPreviewMode,
  onProductClick,
  onPageChange,
}: AllProductsSectionProps) {
  const handleViewAll = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/tat-ca-san-pham");
      window.dispatchEvent(new Event("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getSectionTitle = () => {
    if (searchQuery) {
      return (
        <>
          Tìm thấy{" "}
          <span className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text font-black text-transparent dark:from-slate-400 dark:to-slate-300">
            &ldquo;{searchQuery}&rdquo;
          </span>
        </>
      );
    }
    if (selectedCategory) {
      return categories.find((c) => c.slug === selectedCategory)?.name ?? "Sản phẩm";
    }
    return (
      <>
        Tất cả{" "}
        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text font-black text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
          Sản Phẩm
        </span>
      </>
    );
  };

  return (
    <section className="mb-6 sm:mb-8" aria-labelledby="all-products-heading">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-gray-50/60 shadow-lg shadow-slate-500/5 dark:border-slate-700/60 dark:from-slate-900/95 dark:via-slate-900 dark:to-slate-950/50 dark:shadow-slate-950/20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/30 to-transparent" />
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex shrink-0">
                <div className="absolute inset-0 animate-pulse rounded-xl bg-slate-400/20" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-lg shadow-slate-500/25 ring-2 ring-slate-400/20 dark:from-slate-600 dark:via-slate-700 dark:to-slate-800 dark:ring-slate-500/30 sm:h-12 sm:w-12">
                  <Package className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <h2
                  id="all-products-heading"
                  className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl"
                >
                  {getSectionTitle()}
                </h2>
              </div>
            </div>

            {isPreviewMode && (
              <button
                onClick={handleViewAll}
                className="group inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-4 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 sm:self-auto"
              >
                <span>Xem tất cả sản phẩm</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-fr">
                {products.map((product) => (
                  <div key={product.id} className="w-full sm:max-w-[300px] h-full">
                    <ProductCard
                      {...product}
                      onClick={() => onProductClick(product.slug)}
                    />
                  </div>
                ))}
              </div>
              {!isPreviewMode && totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50/50 py-16 text-center dark:border-slate-700/60 dark:bg-slate-900/30">
              <Package className="mb-4 h-14 w-14 text-slate-300 dark:text-slate-600" />
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {searchQuery
                  ? `Không có sản phẩm nào phù hợp với "${searchQuery}".`
                  : "Thử đổi bộ lọc hoặc danh mục."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
