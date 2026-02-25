"use client";

import { useMemo, useCallback } from "react";
import { toast } from "sonner";

import BannerSlider from "@/components/BannerSlider";
import Footer from "@/components/Footer";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { MetaTags, StructuredData } from "@/components/SEO";
import { generateOrganizationSchema, generateWebSiteSchema, generateFAQSchema } from "@/lib/seo/metadata";
import { faqs } from "@/lib/seo/faq-data";
import { APP_CONFIG } from "@/lib/constants";
import { validateSearchQuery } from "@/lib/validation/search";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { useHomeData, useHomeFilters, useSyncUserBalance } from "./hooks";
import {
  BackgroundEffects,
  DealsSection,
  NewProductsSection,
  AllProductsSection,
  ErrorStates,
} from "./components";

interface HomePageProps {
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HomePage({ onProductClick, searchQuery, setSearchQuery }: HomePageProps) {
  const isScrolled = useScroll();
  const { user, logout, updateUser } = useAuth();
  useSyncUserBalance(user, updateUser);

  // Data fetching
  const {
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

  // Filtering and pagination
  const {
    selectedCategory,
    currentPage,
    newProducts,
    displayedProducts,
    filteredProducts,
    totalPages,
    isPreviewMode,
    setCurrentPage,
    handleCategorySelect,
    handleLogoClick,
  } = useHomeFilters({
    products,
    categoryProductsMap,
  });

  // Handle promotion click
  const handlePromotionClick = useCallback((p: any) => {
    const params = new URLSearchParams();
    params.set("package", p.name);

    const durationMatch = p.id_product?.match(/--\s*(\d+[md])\b/i);
    if (durationMatch) {
      params.set("duration", durationMatch[1].toLowerCase());
    }

    const url = `/${encodeURIComponent(p.slug)}?${params.toString()}`;
    window.history.pushState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
  }, []);

  // Validate search query
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

  // SEO Metadata
  const seoMetadata = useMemo(() => {
    const baseTitle = APP_CONFIG.name;
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
      const categoryName = categories.find((c) => c.slug === selectedCategory)?.name || "Danh mục";
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
      keywords: "phần mềm bản quyền, phần mềm chính hãng, Adobe, Microsoft, Autodesk, phần mềm giá rẻ",
      url: APP_CONFIG.url,
    };
  }, [searchQuery, selectedCategory, categories]);

  // Structured Data
  const structuredData = useMemo(() => {
    const schemas: object[] = [generateOrganizationSchema(), generateWebSiteSchema()];
    if (faqs && faqs.length > 0) {
      schemas.push(generateFAQSchema(faqs));
    }
    return schemas;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
      <BackgroundEffects />

      {/* Header */}
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
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            base_price: p.base_price,
            discount_percentage: p.discount_percentage,
          }))}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
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

      {/* SEO */}
      <MetaTags metadata={seoMetadata} />
      <StructuredData data={structuredData} />

      {/* Main Content */}
      <main id="main-content" className="relative z-0 mx-auto max-w-7xl px-3 pt-6 pb-8 sm:px-6 sm:pt-10 lg:px-8">
        {/* Banner */}
        <section className="mb-6 overflow-hidden rounded-xl shadow-lg shadow-blue-900/5 sm:mb-8 sm:rounded-2xl sm:shadow-xl">
          <BannerSlider />
        </section>

        {/* Deals Section */}
        {!loadingPromotions && promotions.length > 0 && !searchQuery && (
          <DealsSection
            promotions={promotions}
            onProductClick={onProductClick}
            onPromotionClick={handlePromotionClick}
          />
        )}

        {/* New Products Section */}
        {!loading && newProducts.length > 0 && !searchQuery && (
          <NewProductsSection products={newProducts} onProductClick={onProductClick} />
        )}

        {/* Error States */}
        <ErrorStates
          productsError={productsError}
          categoriesError={categoriesError}
          promotionsError={promotionsError}
          onRetryProducts={handleRetryProducts}
          onRetryCategories={handleRetryCategories}
          onRetryPromotions={handleRetryPromotions}
        />

        {/* All Products Section */}
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
      </main>

      <Footer />
    </div>
  );
}
