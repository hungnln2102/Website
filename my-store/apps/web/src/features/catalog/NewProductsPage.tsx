"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { slugify } from "@/lib/utils";
import { CatalogLayout, PageHeader, SortToolbar, ProductGrid } from "./components";
import { useCatalogData, useProductSort } from "./hooks";

interface NewProductsPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

// Check if product is new (within 7 days)
const isNewProduct = (createdAt: string | null): boolean => {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

export default function NewProductsPage({
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: NewProductsPageProps) {
  const { products, categories, loadingProducts, productsError, handleRetryProducts } = useCatalogData();

  // Normalize and filter new products
  const normalizedProducts = useMemo(
    () =>
      products
        .map((p) => ({
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
          created_at: p.created_at || null,
        }))
        .filter((p) => isNewProduct(p.created_at)),
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
      searchPlaceholder="Tìm kiếm sản phẩm mới..."
      products={products}
      categories={categories}
    >
      <PageHeader
        icon={Sparkles}
        title="Sản Phẩm"
        highlightedTitle="Mới"
        count={totalCount}
        gradientFrom="from-blue-500"
        gradientVia="via-indigo-500"
        gradientTo="to-cyan-500"
        iconBgGradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-600"
        iconShadow="shadow-blue-500/30"
        ringColor="ring-blue-400/20"
        pulseColor="bg-blue-500/25"
      />

      <SortToolbar
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeColor="bg-blue-600 shadow-blue-500/40"
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
        emptyIcon={Sparkles}
        emptyTitle="Chưa có sản phẩm mới"
        emptyMessage="Hiện chưa có sản phẩm mới nào trong hệ thống."
        isNew={true}
      />
    </CatalogLayout>
  );
}
