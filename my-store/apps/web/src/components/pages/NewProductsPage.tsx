"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";

import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { fetchCategories, fetchProducts } from "@/lib/api";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { useScroll } from "@/hooks/useScroll";
import { useQueryClient } from "@tanstack/react-query";
import { slugify } from "@/lib/utils";

interface NewProductsPageProps {
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

export default function NewProductsPage({ 
  onBack, 
  onProductClick,
  searchQuery,
  setSearchQuery
}: NewProductsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const isScrolled = useScroll();
  const queryClient = useQueryClient();

  const PER_PAGE = 12;

  // Fetch data
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: allProducts = [], isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Helper function to check if product is new (created within 7 days)
  const isNewProduct = (createdAt: string | null): boolean => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  // Get all products and normalize - chỉ lấy sản phẩm trong vòng 7 ngày
  const normalizedProducts = useMemo(() => {
    return allProducts
      .map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description || null,
        base_price: p.base_price ?? 0,
        image_url: p.image_url || null,
        discount_percentage: p.discount_percentage ?? 0,
        sales_count: p.sales_count ?? 0,
        sold_count_30d: p.sold_count_30d ?? 0,
        average_rating: p.average_rating ?? 0,
        package_count: p.package_count ?? 1,
        slug: p.slug || slugify(p.name),
        category_id: p.category_id || null,
        created_at: p.created_at || null,
        full_description: null,
        is_featured: false,
        purchase_rules: null,
      }))
      .filter((p) => isNewProduct(p.created_at)); // Chỉ lấy sản phẩm trong vòng 7 ngày
  }, [allProducts]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...normalizedProducts];
    
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
          (a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0)
        );
      case "discount":
        return sorted.sort(
          (a, b) => (b.discount_percentage ?? 0) - (a.discount_percentage ?? 0)
        );
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      case "price-asc":
        return sorted.sort((a, b) => {
          const priceA = a.base_price * (1 - a.discount_percentage / 100);
          const priceB = b.base_price * (1 - b.discount_percentage / 100);
          return priceA - priceB;
        });
      case "price-desc":
        return sorted.sort((a, b) => {
          const priceA = a.base_price * (1 - a.discount_percentage / 100);
          const priceB = b.base_price * (1 - b.discount_percentage / 100);
          return priceB - priceA;
        });
      default:
        return sorted;
    }
  }, [normalizedProducts, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return sortedProducts.slice(start, start + PER_PAGE);
  }, [sortedProducts, currentPage]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className={`sticky top-0 z-40 transition-all duration-500 ${isScrolled ? 'shadow-xl shadow-blue-900/5 backdrop-blur-xl' : ''}`}>
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={onBack}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={allProducts.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug || slugify(p.name),
            image_url: p.image_url || null,
            base_price: p.base_price ?? 0,
            discount_percentage: p.discount_percentage ?? 0,
          }))}
          categories={categories.map((c: any) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
          }))}
          onProductClick={onProductClick}
          onCategoryClick={(slug) => {
            window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(slug)}`);
            window.dispatchEvent(new Event("popstate"));
          }}
        />
        <MenuBar 
          isScrolled={isScrolled}
          categories={categories.map((c: any) => ({
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
        {/* Back button under menu / breadcrumb area */}
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
              <div className="absolute inset-0 animate-pulse rounded-xl bg-blue-500/25" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="mb-1 text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Sản Phẩm <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">Mới</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'sản phẩm' : 'sản phẩm'}
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
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/40"
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
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/40"
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

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : productsError ? (
          <ErrorMessage
            message="Không thể tải danh sách sản phẩm"
            onRetry={handleRetry}
          />
        ) : paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-700" />
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Chưa có sản phẩm mới
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Hiện chưa có sản phẩm mới nào trong hệ thống.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => onProductClick(product.slug)}
                  isNew={true}
                />
              ))}
            </div>

            {/* Pagination */}
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
