"use client";

import { useMemo, useCallback, type MouseEvent } from "react";
import { toast } from "sonner";

import BannerSlider from "@/components/BannerSlider";
import Footer from "@/components/Footer";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { MetaTags, StructuredData } from "@/components/SEO";
import { generateOrganizationSchema, generateWebSiteSchema, generateFAQSchema } from "@/lib/seo/metadata";
import { faqs } from "@/lib/seo/faq-data";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
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
  const homeHeading = `${APP_CONFIG.name} - Phần mềm bản quyền chính hãng`;

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

  const handleInternalLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      event.preventDefault();
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  const quickLinks = useMemo(
    () => [
      { label: "Tất cả sản phẩm", href: ROUTES.allProducts },
      { label: "Sản phẩm mới", href: ROUTES.newProducts },
      { label: "Khuyến mãi", href: ROUTES.promotions },
      { label: "Giới thiệu", href: ROUTES.about },
      { label: "Fix Adobe", href: ROUTES.fixAdobeEdu },
      { label: "Hướng dẫn Adobe", href: ROUTES.adobeGuide },
      { label: "Đăng nhập", href: ROUTES.login },
      { label: "Giỏ hàng", href: ROUTES.cart },
    ],
    []
  );

  const categoryQuickLinks = useMemo(
    () =>
      categories.slice(0, 4).map((category) => ({
        label: `Danh mục ${category.name}`,
        href: ROUTES.category(category.slug),
      })),
    [categories]
  );

  // SEO Metadata
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
  }, [searchQuery, selectedCategory, categories, homeHeading]);

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
        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 dark:border-slate-800 dark:bg-slate-900/80 sm:mb-8 sm:p-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">
            Trang chủ Mavryk Premium Store
          </p>
          <h1 className="max-w-4xl text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {homeHeading}
          </h1>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
            <p>
              Mavryk Premium Store là cửa hàng phần mềm bản quyền chính hãng dành cho
              người cần mua nhanh, dùng ổn định và có hỗ trợ rõ ràng sau bán hàng. Tại
              đây bạn có thể tìm thấy nhiều nhóm sản phẩm phổ biến như Adobe Creative
              Cloud, Microsoft Office, Windows, các tài khoản học tập, gói gia hạn theo
              thời hạn và nhiều công cụ phục vụ thiết kế, học tập, làm việc văn phòng,
              dựng video, chỉnh sửa ảnh và vận hành công việc hằng ngày.
            </p>
            <p>
              Trang chủ được sắp xếp theo các khu vực sản phẩm mới, sản phẩm nổi bật,
              chương trình khuyến mãi và danh mục để người dùng dễ điều hướng hơn. Mỗi
              trang chi tiết đều có mô tả sản phẩm, thông tin thời hạn sử dụng, chính
              sách mua hàng, hướng dẫn hỗ trợ và các liên kết nội bộ giúp bạn chuyển
              nhanh sang những gói tương tự nếu muốn so sánh giá, tính năng hoặc thời
              lượng sử dụng trước khi đặt hàng.
            </p>
            <p>
              Ngoài khu vực mua hàng, Mavryk Premium Store còn có các trang hỗ trợ như
              Fix Adobe, hướng dẫn Adobe, đăng nhập, giỏ hàng và lịch sử đơn hàng để
              khách hàng theo dõi giao dịch thuận tiện hơn. Nếu bạn đang tìm phần mềm
              bản quyền chính hãng với thông tin minh bạch, giao diện dễ dùng và quy
              trình hỗ trợ rõ ràng, đây là điểm bắt đầu phù hợp để khám phá toàn bộ hệ
              thống sản phẩm hiện có.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {[...quickLinks, ...categoryQuickLinks].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleInternalLinkClick(event, link.href)}
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>

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
