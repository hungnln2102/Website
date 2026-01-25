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
import { ModeToggle } from "@/components/mode-toggle";
import MenuBar from "@/components/MenuBar";
import { useScroll } from "@/hooks/useScroll";
import { useQueryClient } from "@tanstack/react-query";
import { slugify } from "@/lib/utils";

interface NewProductsPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

type SortOption = "newest" | "oldest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export default function NewProductsPage({ 
  onBack, 
  onProductClick,
  searchQuery,
  setSearchQuery
}: NewProductsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
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

  // Get all products and normalize
  const normalizedProducts = useMemo(() => {
    return allProducts.map((p: any) => ({
      id: String(p.id),
      name: p.name,
      description: p.description || null,
      base_price: p.base_price ?? 0,
      image_url: p.image_url || null,
      discount_percentage: p.discount_percentage ?? 0,
      sales_count: p.sales_count ?? 0,
      average_rating: p.average_rating ?? 0,
      package_count: p.package_count ?? 1,
      slug: p.slug || slugify(p.name),
      category_id: p.category_id || null,
      created_at: p.created_at || new Date().toISOString(),
      full_description: null,
      is_featured: false,
      purchase_rules: null,
    }));
  }, [allProducts]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...normalizedProducts];
    
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateA - dateB;
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
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "vi"));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name, "vi"));
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
        <header className={`relative border-b transition-all duration-500 ${
          isScrolled 
            ? 'border-gray-200/50 bg-white/80 py-2 dark:border-slate-800/50 dark:bg-slate-950/80' 
            : 'border-gray-100 bg-white py-3.5 dark:border-slate-800/50 dark:bg-slate-950/70'
        }`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h1 className={`font-bold tracking-tight text-gray-900 transition-all duration-500 dark:text-white ${isScrolled ? 'text-base' : 'text-lg sm:text-xl'}`}>
                  Sản Phẩm Mới
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ModeToggle />
            </div>
          </div>
        </header>
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Sort */}
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-blue-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="name-asc">Tên: A-Z</option>
              <option value="name-desc">Tên: Z-A</option>
            </select>
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
