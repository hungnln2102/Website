"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { slugify } from "@/lib/utils";
import { MetaTags } from "@/components/SEO";
import { APP_CONFIG } from "@/lib/constants";
import { CatalogLayout, PageHeader, SortToolbar, ProductGrid } from "./components";
import { useCatalogData, useProductSort } from "./hooks";

interface PromotionsPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function PromotionsPage({
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: PromotionsPageProps) {
  const { products, promotions, categories, loadingPromotions, promotionsError, handleRetryPromotions } =
    useCatalogData();

  // Normalize promotions
  const normalizedPromotions = useMemo(
    () =>
      promotions.map((p) => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug || slugify(p.name),
        description: p.description || null,
        base_price: p.base_price ?? 0,
        image_url: p.image_url || null,
        discount_percentage: p.discount_percentage ?? 0,
        has_promo: p.has_promo ?? true,
        sales_count: p.sales_count ?? 0,
        sold_count_30d: p.sold_count_30d ?? 0,
        average_rating: p.average_rating ?? 0,
        package_count: p.package_count ?? 1,
        created_at: p.created_at || new Date().toISOString(),
      })),
    [promotions]
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
    products: normalizedPromotions,
    searchQuery,
  });

  const seoMetadata = useMemo(
    () => ({
      title: `Khuyến mãi - ${APP_CONFIG.name}`,
      description:
        "Danh sách các sản phẩm đang khuyến mãi, giảm giá hấp dẫn tại Mavryk Premium Store. Cập nhật ưu đãi phần mềm bản quyền mỗi ngày.",
      keywords: "khuyến mãi phần mềm, giảm giá phần mềm, ưu đãi phần mềm bản quyền, Mavryk Premium Store",
      url: `${APP_CONFIG.url}/khuyen-mai`,
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
        searchPlaceholder="Tìm kiếm khuyến mãi..."
        products={promotions}
        categories={categories}
      >
        <PageHeader
          icon={Flame}
          title="Khuyến Mãi"
          highlightedTitle="Hot"
          count={totalCount}
          countLabel="sản phẩm đang giảm giá"
          gradientFrom="from-orange-500"
          gradientVia="via-red-500"
          gradientTo="to-rose-500"
          iconBgGradient="bg-gradient-to-br from-orange-500 via-red-500 to-rose-600"
          iconShadow="shadow-orange-500/30"
          ringColor="ring-orange-400/20"
          pulseColor="bg-orange-500/25"
        />

        <SortToolbar
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeColor="bg-orange-600 shadow-orange-500/40"
        />

        <ProductGrid
          products={paginatedProducts}
          loading={loadingPromotions}
          error={promotionsError}
          onRetry={handleRetryPromotions}
          onProductClick={onProductClick}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyIcon={Flame}
          emptyTitle="Chưa có chương trình khuyến mãi"
          emptyMessage="Hãy quay lại sau để xem các ưu đãi mới nhất."
        />
      </CatalogLayout>
    </>
  );
}
