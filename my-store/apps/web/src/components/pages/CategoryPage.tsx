"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Search, X } from "lucide-react";

import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { fetchCategories, fetchProducts, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import MenuBar from "@/components/MenuBar";
import { useScroll } from "@/hooks/useScroll";
import { useQueryClient } from "@tanstack/react-query";

interface CategoryPageProps {
  categorySlug: string;
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

type SortOption = "newest" | "oldest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export default function CategoryPage({ 
  categorySlug, 
  onBack, 
  onProductClick,
  searchQuery,
  setSearchQuery
}: CategoryPageProps) {
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

  // Find category by slug
  const category = useMemo(() => {
    const cat = categories.find((c: CategoryDto) => slugify(c.name) === categorySlug);
    if (!cat) return null;
    return {
      id: String(cat.id),
      name: cat.name,
      slug: slugify(cat.name),
    };
  }, [categories, categorySlug]);

  // Filter products by category
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    
    const categoryData = categories.find((c: CategoryDto) => slugify(c.name) === categorySlug);
    if (!categoryData) return [];

    const productIds = new Set((categoryData.product_ids ?? []).map(String));
    const filtered = allProducts.filter((p: any) => productIds.has(String(p.id)));

    return filtered.map((p: any) => ({
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
      created_at: p.created_at || new Date().toISOString(),
      full_description: null,
      is_featured: false,
      purchase_rules: null,
    }));
  }, [category, categories, categorySlug, allProducts]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...categoryProducts];
    
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
  }, [categoryProducts, sortBy]);

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

  if (!category) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <Package className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-700" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Danh mục không tồn tại</h1>
          <p className="mb-6 text-gray-500 dark:text-slate-400">Danh mục bạn đang tìm kiếm không có trong hệ thống.</p>
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

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
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-4 rounded-xl px-1 py-1 -ml-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label="Quay về trang chủ"
            >
              <div className={`rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 transition-all duration-500 ${isScrolled ? 'h-8 w-8' : 'h-10 w-10'}`}>
                <div className="flex h-full w-full items-center justify-center rounded-[calc(0.75rem-1px)] bg-white dark:bg-slate-950">
                  <span className={`font-bold text-blue-600 transition-all ${isScrolled ? 'text-lg' : 'text-xl'}`}>M</span>
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <h1 className={`font-bold tracking-tight text-gray-900 transition-all duration-500 dark:text-white ${isScrolled ? 'text-base' : 'text-lg sm:text-xl'}`}>
                  Mavryk Premium <span className="text-blue-600 dark:text-blue-500">Store</span>
                </h1>
              </div>
            </button>

            <div className={`mx-4 flex flex-1 max-w-md transition-all duration-500 ${isScrolled ? 'max-w-lg' : ''}`}>
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${searchQuery ? 'text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-10 transition-all duration-500 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 ${
                    isScrolled ? 'h-9' : 'h-10'
                  }`}
                  aria-label="Tìm kiếm sản phẩm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ModeToggle />
            </div>
          </div>
        </header>
        <MenuBar 
          isScrolled={isScrolled}
          categories={categories.map((c: CategoryDto) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
            icon: null,
          }))}
          selectedCategory={categorySlug}
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
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {category.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {categoryProducts.length} {categoryProducts.length === 1 ? 'sản phẩm' : 'sản phẩm'}
          </p>
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
            <Package className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-700" />
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Chưa có sản phẩm
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Danh mục này hiện chưa có sản phẩm nào.
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
