"use client";

import { useMemo } from "react";
import { Package } from "lucide-react";
import { slugify } from "@/lib/utils";
import { CatalogLayout, PageHeader, SortToolbar, ProductGrid } from "./components";
import { useCatalogData, useProductSort } from "./hooks";

interface AllProductsPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function AllProductsPage({
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: AllProductsPageProps) {
  const { products, categories, loadingProducts, productsError, handleRetryProducts } = useCatalogData();

  // Normalize products
  const normalizedProducts = useMemo(
    () =>
      products.map((p) => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug || slugify(p.name),
        description: p.description || null,
        base_price: p.base_price ?? 0,
        image_url: p.image_url || null,
        discount_percentage: p.discount_percentage ?? 0,
        has_promo: p.has_promo ?? false,
        sales_count: p.sales_count ?? 0,
        sold_count_30d: p.sold_count_30d ?? 0,
        average_rating: p.average_rating ?? 0,
        package_count: p.package_count ?? 1,
        created_at: p.created_at || new Date().toISOString(),
      })),
    [products]
  );

  const {
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    paginatedProducts,
    totalPages,
    totalCount,
  } = useProductSort({
    products: normalizedProducts,
    searchQuery,
  });

  return (
    <CatalogLayout
      onBack={onBack}
      onProductClick={onProductClick}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchPlaceholder="Tìm kiếm tất cả sản phẩm..."
      products={products}
      categories={categories}
    >
    <PageHeader
      icon={Package}
      title="Tất cả"
      highlightedTitle="sản phẩm"
      count={totalCount}
      gradientFrom="from-blue-600"
      gradientTo="to-indigo-700"
      iconBgGradient="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700"
      iconShadow="shadow-blue-500/25"
      ringColor="ring-blue-400/20 dark:ring-blue-500/30"
      pulseColor="bg-blue-400/20"
    />

      <SortToolbar
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeColor="bg-slate-800 shadow-slate-700/40 dark:bg-slate-200 dark:text-slate-900"
      />

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
        emptyMessage="Hiện chưa có sản phẩm nào trong hệ thống."
      />
    </CatalogLayout>
  );
}
