"use client";

import { Suspense, lazy, useMemo, useCallback } from "react";
import { toast } from "sonner";

import BannerSlider from "@/components/BannerSlider";
import Footer from "@/components/Footer";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { MetaTags, StructuredData } from "@/components/SEO";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateFAQSchema,
} from "@/lib/seo/metadata";
import { faqs } from "@/lib/seo/faq-data";
import { APP_CONFIG } from "@/lib/constants";
import { validateSearchQuery } from "@/lib/validation/search";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useHomeData, useHomeFilters, useSyncUserBalance } from "./hooks";
import {
  BackgroundEffects,
  DealsSection,
  HomeSectionSkeleton,
  NewProductsSection,
  BestSellingSection,
  AllProductsSection,
  ErrorStates,
  StoreStatsSection,
} from "./components";

const HomeSupportShareSection = lazy(() =>
  import("./components/HomeSupportShareSection").then((module) => ({
    default: module.HomeSupportShareSection,
  }))
);

const InfoHighlightsSection = lazy(() =>
  import("./components/InfoHighlightsSection").then((module) => ({
    default: module.InfoHighlightsSection,
  }))
);

interface HomePageProps {
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HomePage({
  onProductClick,
  searchQuery,
  setSearchQuery,
}: HomePageProps) {
  const isScrolled = useScroll();
  const { user, logout, updateUser } = useAuth();
  useSyncUserBalance(user, updateUser);
  const homeHeading = `${APP_CONFIG.name} - Phần mềm bản quyền chính hãng`;

  const {
    isCatalogReady,
    products,
    promotions,
    categories,
    categoryProductsMap,
    loading,
    loadingPromotions,
    productsError,
    categoriesError,
    promotionsError,
    handleRetryProducts,
    handleRetryCategories,
    handleRetryPromotions,
  } = useHomeData();

  const {
    selectedCategory,
    currentPage,
    newProducts,
    bestSellingProducts,
    displayedProducts,
    totalPages,
    isPreviewMode,
    setCurrentPage,
    handleCategorySelect,
    handleLogoClick,
  } = useHomeFilters({
    products,
    categoryProductsMap,
  });

  const handlePromotionClick = useCallback((promotion: any) => {
    const params = new URLSearchParams();
    params.set("package", promotion.name);

    const durationMatch = promotion.id_product?.match(/--\s*(\d+[md])\b/i);
    if (durationMatch) {
      params.set("duration", durationMatch[1].toLowerCase());
    }

    const url = `/${encodeURIComponent(promotion.slug)}?${params.toString()}`;
    window.history.pushState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (value.trim()) {
        const validation = validateSearchQuery(value);
        if (!validation.isValid && validation.error) {
          toast.error(validation.error, { duration: 3000 });
        }
      }
    },
    [setSearchQuery]
  );

  const seoMetadata = useMemo(() => {
    const baseTitle = homeHeading;
    const baseDescription = APP_CONFIG.description;

    if (searchQuery) {
      return {
        title: `Tìm kiếm "${searchQuery}" - ${baseTitle}`,
        description: `Kết quả tìm kiếm cho "${searchQuery}" trên ${baseTitle}. ${baseDescription}`,
        keywords: `${searchQuery}, phần mềm bản quyền, ${APP_CONFIG.name}`,
        url: `${APP_CONFIG.url}/?search=${encodeURIComponent(searchQuery)}`,
      };
    }

    if (selectedCategory) {
      const categoryName =
        categories.find((category) => category.slug === selectedCategory)?.name ||
        "Danh mục";
      return {
        title: `${categoryName} - ${baseTitle}`,
        description: `Xem tất cả sản phẩm trong danh mục ${categoryName} tại ${baseTitle}. ${baseDescription}`,
        keywords: `${categoryName}, phần mềm bản quyền, ${APP_CONFIG.name}`,
        url: `${APP_CONFIG.url}/?category=${selectedCategory}`,
      };
    }

    return {
      title: baseTitle,
      description: baseDescription,
      keywords:
        "phần mềm bản quyền, phần mềm chính hãng, Adobe, Microsoft, Autodesk, phần mềm giá rẻ",
      url: APP_CONFIG.url,
    };
  }, [searchQuery, selectedCategory, categories, homeHeading]);

  const structuredData = useMemo(() => {
    const schemas: object[] = [generateOrganizationSchema(), generateWebSiteSchema()];
    if (faqs.length > 0) {
      schemas.push(generateFAQSchema(faqs));
    }
    return schemas;
  }, []);

  const discountedProductsCount = useMemo(
    () => products.filter((product) => product.has_promo || product.discount_percentage > 0).length,
    [products]
  );

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
      <BackgroundEffects />

      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/5 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onLogoClick={handleLogoClick}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            image_url: product.image_url,
            base_price: product.base_price,
            discount_percentage: product.discount_percentage,
          }))}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          }))}
          onProductClick={onProductClick}
          onCategoryClick={(slug) => handleCategorySelect(slug)}
          user={user}
          onLogout={logout}
        />
        <MenuBar
          isScrolled={isScrolled}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
      </div>

      <MetaTags metadata={seoMetadata} />
      <StructuredData data={structuredData} />

      <main
        id="main-content"
        className="relative z-0 mx-auto flex max-w-[90rem] flex-col px-3 pt-6 pb-8 sm:px-6 sm:pt-10 lg:px-8"
      >
        <section className="mb-6 overflow-hidden rounded-xl shadow-lg shadow-blue-900/5 sm:mb-8 sm:rounded-2xl sm:shadow-xl">
          <BannerSlider />
        </section>

        {!searchQuery && (
          <>
            {loadingPromotions ? (
              <HomeSectionSkeleton tone="orange" />
            ) : (
              promotions.length > 0 && (
                <DealsSection
                  promotions={promotions}
                  onProductClick={onProductClick}
                  onPromotionClick={handlePromotionClick}
                />
              )
            )}

            {loading ? (
              <HomeSectionSkeleton tone="blue" />
            ) : (
              newProducts.length > 0 && (
                <NewProductsSection products={newProducts} onProductClick={onProductClick} />
              )
            )}

            {loading ? (
              <HomeSectionSkeleton tone="amber" />
            ) : (
              bestSellingProducts.length > 0 && (
                <BestSellingSection
                  products={bestSellingProducts}
                  onProductClick={onProductClick}
                />
              )
            )}
          </>
        )}

        <ErrorStates
          productsError={productsError}
          categoriesError={categoriesError}
          promotionsError={promotionsError}
          onRetryProducts={handleRetryProducts}
          onRetryCategories={handleRetryCategories}
          onRetryPromotions={handleRetryPromotions}
        />

        <AllProductsSection
          products={displayedProducts}
          categories={categories}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          currentPage={currentPage}
          totalPages={totalPages}
          isPreviewMode={isPreviewMode}
          onProductClick={onProductClick}
          onPageChange={setCurrentPage}
        />

        {!loading && products.length > 0 && (
          <StoreStatsSection
            productCount={products.length}
            categoryCount={categories.length}
            discountedCount={discountedProductsCount}
          />
        )}

        <Suspense fallback={<div className="mt-5 mb-4 min-h-[32rem] sm:min-h-[24rem]" aria-hidden="true" />}>
          <HomeSupportShareSection />
        </Suspense>
        <Suspense fallback={<div className="mt-3 min-h-[26rem] sm:min-h-[22rem]" aria-hidden="true" />}>
          <InfoHighlightsSection />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
