"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flame } from "lucide-react";

import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { fetchPromotions, fetchCategories, type PromotionDto, type CategoryDto } from "@/lib/api";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { useScroll } from "@/hooks/useScroll";
import { slugify } from "@/lib/utils";

interface PromotionsPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

type SortOption =
  | "featured"
  | "best-selling"
  | "discount"
  | "newest"
  | "price-asc"
  | "price-desc";

export default function PromotionsPage({
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: PromotionsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const isScrolled = useScroll();
  const queryClient = useQueryClient();

  const PER_PAGE = 12;

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const {
    data: promotions = [] as PromotionDto[],
    isLoading: loadingPromotions,
    error: promotionsError,
  } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  const promotionsErrorMsg =
    promotionsError instanceof Error
      ? promotionsError.message
      : promotionsError
      ? "Không thể tải danh sách khuyến mãi"
      : null;

  const normalizedPromotions = useMemo(
    () =>
      promotions.map((p) => ({
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
        has_promo: p.has_promo ?? true,
        sales_count: p.sales_count ?? 0,
        sold_count_30d: p.sold_count_30d ?? 0,
        average_rating: p.average_rating ?? 0,
        purchase_rules: null,
        package_count: p.package_count ?? 1,
        created_at: new Date().toISOString(),
      })),
    [promotions],
  );

  const sortedPromotions = useMemo(() => {
    const sorted = [...normalizedPromotions];

    switch (sortBy) {
      case "featured":
        return sorted.sort((a, b) => {
          const discountDiff = (b.discount_percentage ?? 0) - (a.discount_percentage ?? 0);
          if (discountDiff !== 0) return discountDiff;
          const salesDiff = (b.sales_count ?? 0) - (a.sales_count ?? 0);
          if (salesDiff !== 0) return salesDiff;
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      case "best-selling":
        return sorted.sort(
          (a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0),
        );
      case "discount":
        return sorted.sort(
          (a, b) => (b.discount_percentage ?? 0) - (a.discount_percentage ?? 0),
        );
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      case "price-asc":
        return sorted.sort((a, b) => a.base_price - b.base_price);
      case "price-desc":
        return sorted.sort((a, b) => b.base_price - a.base_price);
      default:
        return sorted;
    }
  }, [normalizedPromotions, sortBy]);

  const filteredPromotions = useMemo(() => {
    if (!searchQuery) return sortedPromotions;
    const query = searchQuery.toLowerCase();
    return sortedPromotions.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)),
    );
  }, [sortedPromotions, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / PER_PAGE));
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredPromotions.slice(start, start + PER_PAGE);
  }, [filteredPromotions, currentPage]);

  const handleRetryPromotions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["promotions"] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/5 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={onBack}
          searchPlaceholder="Tìm kiếm khuyến mãi..."
        />
        <MenuBar
          isScrolled={isScrolled}
          categories={categories.map((c: CategoryDto) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
            icon: null,
          }))}
          selectedCategory={null}
          onSelectCategory={(slug) => {
            if (slug) {
              window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(slug)}`);
              window.dispatchEvent(new Event("popstate"));
            }
          }}
        />
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back button under menu */}
        <div className="mb-4 flex items-center">
          <button
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex shrink-0">
              <div className="absolute inset-0 animate-pulse rounded-xl bg-orange-500/25" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/20">
                <Flame className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="mb-1 text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Khuyến Mãi <span className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 bg-clip-text text-transparent">Hot</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {filteredPromotions.length} {filteredPromotions.length === 1 ? "sản phẩm" : "sản phẩm"} đang giảm giá
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-gray-500 dark:text-slate-400">
              Sắp xếp theo:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "featured" as SortOption, label: "Nổi bật" },
                { key: "best-selling" as SortOption, label: "Bán chạy" },
                { key: "discount" as SortOption, label: "Giảm giá" },
                { key: "newest" as SortOption, label: "Mới" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSortBy(item.key)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    sortBy === item.key
                      ? "bg-orange-600 text-white shadow-sm shadow-orange-500/40"
                      : "bg-transparent text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setSortBy(sortBy === "price-asc" ? "price-desc" : "price-asc")
                }
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  sortBy === "price-asc" || sortBy === "price-desc"
                    ? "bg-orange-600 text-white shadow-sm shadow-orange-500/40"
                    : "bg-transparent text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                Giá
                <span className="ml-1">
                  {sortBy === "price-desc" ? "↓" : "↑"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Error States */}
        {promotionsErrorMsg && (
          <ErrorMessage
            title="Lỗi tải khuyến mãi"
            message={promotionsErrorMsg}
            onRetry={handleRetryPromotions}
            className="mb-4"
          />
        )}

        {/* Products Grid */}
        {loadingPromotions ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flame className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-700" />
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Chưa có chương trình khuyến mãi
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Hãy quay lại sau để xem các ưu đãi mới nhất.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedPromotions.map((product: any) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => onProductClick(product.slug)}
                  isNew={false}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

