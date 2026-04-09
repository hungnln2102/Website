"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";

import { MetaTags } from "@/components/SEO";
import { APP_CONFIG } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { CatalogLayout, PageHeader, ProductGrid, SortToolbar } from "./components";
import { useCatalogData, useProductSort } from "./hooks";

interface BestSellingPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function BestSellingPage({
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: BestSellingPageProps) {
  const { products, categories, loadingProducts, productsError, handleRetryProducts } = useCatalogData();

  const normalizedProducts = useMemo(
    () =>
      products
        .map((p) => ({
          id: String(p.id),
          name: p.name,
          package: p.package,
          package_product: p.package_product ?? null,
          slug: p.slug || slugify(p.name),
          description: p.description || null,
          base_price: p.base_price ?? 0,
          from_price: (p as { from_price?: number }).from_price,
          image_url: p.image_url || null,
          discount_percentage: p.discount_percentage ?? 0,
          has_promo: p.has_promo ?? false,
          sales_count: p.sales_count ?? 0,
          sold_count_30d: p.sold_count_30d ?? 0,
          average_rating: p.average_rating ?? 0,
          package_count: p.package_count ?? 1,
          created_at: p.created_at || new Date().toISOString(),
        }))
        .filter((p) => (p.sold_count_30d ?? 0) > 10),
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
    loadMore,
  } = useProductSort({
    products: normalizedProducts,
    searchQuery,
    defaultSort: "best-selling",
    rowsPerReveal: 2,
  });

  const seoMetadata = useMemo(
    () => ({
      title: `Sản phẩm bán chạy - ${APP_CONFIG.name}`,
      description:
        "Danh sách các sản phẩm bán chạy nhất tại Mavryk Premium Store, được sắp xếp theo mức độ mua nhiều và quan tâm cao.",
      keywords:
        "sản phẩm bán chạy, phần mềm bán chạy, tài khoản bán chạy, Mavryk Premium Store",
      url: `${APP_CONFIG.url}${typeof window !== "undefined" ? "/best-selling" : "/best-selling"}`,
    }),
    []
  );

  return (
    <>
      <MetaTags metadata={seoMetadata} />
      <CatalogLayout
        onBack={onBack}
        onProductClick={onProductClick}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Tìm kiếm sản phẩm bán chạy..."
        products={products}
        categories={categories}
      >
        <PageHeader
          icon={TrendingUp}
          title="Sản phẩm"
          highlightedTitle="bán chạy"
          count={totalCount}
          countLabel="gói được mua nhiều"
          gradientFrom="from-amber-500"
          gradientVia="via-orange-500"
          gradientTo="to-red-500"
          iconBgGradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
          iconShadow="shadow-amber-500/30"
          ringColor="ring-amber-400/20"
          pulseColor="bg-amber-500/25"
        />

        <SortToolbar
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeColor="bg-amber-600 shadow-amber-500/40"
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
          loadMore={loadMore}
          emptyIcon={TrendingUp}
          emptyTitle="Chưa có sản phẩm bán chạy"
          emptyMessage="Hiện chưa có sản phẩm nào đạt ngưỡng bán chạy trong hệ thống."
        />
      </CatalogLayout>
    </>
  );
}
