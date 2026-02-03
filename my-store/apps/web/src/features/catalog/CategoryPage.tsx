"use client";

import { useMemo } from "react";
import { Package, ArrowLeft } from "lucide-react";
import { slugify } from "@/lib/utils";
import type { CategoryDto } from "@/lib/api";
import { CatalogLayout, SortToolbar, ProductGrid } from "./components";
import { useCatalogData, useProductSort } from "./hooks";

interface CategoryPageProps {
  categorySlug: string;
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function CategoryPage({
  categorySlug,
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: CategoryPageProps) {
  const { products, categories, loadingProducts, productsError, handleRetryProducts } = useCatalogData();

  // Find category by slug
  const category = useMemo(() => {
    const cat = categories.find((c: CategoryDto) => slugify(c.name) === categorySlug);
    if (!cat) return null;
    return {
      id: String(cat.id),
      name: cat.name,
      slug: slugify(cat.name),
      product_ids: cat.product_ids ?? [],
    };
  }, [categories, categorySlug]);

  // Filter products by category
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    const productIds = new Set(category.product_ids.map(String));
    return products
      .filter((p: any) => productIds.has(String(p.id)))
      .map((p: any) => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug || slugify(p.name),
        description: p.description || null,
        base_price: p.base_price ?? 0,
        image_url: p.image_url || null,
        discount_percentage: p.discount_percentage ?? 0,
        sales_count: p.sales_count ?? 0,
        sold_count_30d: p.sold_count_30d ?? 0,
        average_rating: p.average_rating ?? 0,
        package_count: p.package_count ?? 1,
        created_at: p.created_at || new Date().toISOString(),
      }));
  }, [category, products]);

  const {
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    paginatedProducts,
    totalPages,
    totalCount,
  } = useProductSort({
    products: categoryProducts,
    searchQuery,
    defaultSort: "newest",
  });

  // Category not found
  if (!category && !loadingProducts) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <Package className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-700" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Danh mục không tồn tại
          </h1>
          <p className="mb-6 text-gray-500 dark:text-slate-400">
            Danh mục bạn đang tìm kiếm không có trong hệ thống.
          </p>
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <CatalogLayout
      onBack={onBack}
      onProductClick={onProductClick}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchPlaceholder="Tìm kiếm sản phẩm..."
      products={products}
      categories={categories}
      selectedCategory={categorySlug}
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          {category?.name || "Đang tải..."}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">{totalCount} sản phẩm</p>
      </div>

      <SortToolbar sortBy={sortBy} onSortChange={setSortBy} showSelect={true} />

      <ProductGrid
        products={paginatedProducts}
        loading={loadingProducts}
        error={productsError}
        onRetry={handleRetryProducts}
        onProductClick={onProductClick}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyIcon={Package}
        emptyTitle="Chưa có sản phẩm"
        emptyMessage="Danh mục này hiện chưa có sản phẩm nào."
      />
    </CatalogLayout>
  );
}
