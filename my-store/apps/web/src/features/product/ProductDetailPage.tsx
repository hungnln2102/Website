"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { MetaTags, StructuredData } from "@/components/SEO";
import { ErrorMessage } from "@/components/ui/error-message";
import { useScroll } from "@/hooks/useScroll";
import { fetchFormFields, type CategoryDto } from "@/lib/api";
import { BRANDING_ASSETS } from "@/lib/brandingAssets";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
import { generateBreadcrumbSchema, generateProductSchema } from "@/lib/seo";
import { slugify } from "@/lib/utils";

import { useProductData, useProductDetailState } from "./hooks";
import {
  META_DESCRIPTION_FALLBACK,
  getCustomerFacingDescription,
  isInternalProductPlaceholder,
} from "./utils/contentPresentation";

const DEFAULT_PRODUCT_FALLBACK_IMAGE = `${APP_CONFIG.url}${BRANDING_ASSETS.logo512}`;
import {
  AdditionalInfoSection,
  BuyButton,
  DurationSelector,
  PackageSelector,
  ProductDescription,
  ProductImageGallery,
  ProductInfo,
  ProductLoadingSkeleton,
  ProductNotFound,
  PurchasePolicy,
  RelatedProducts,
  ReviewSection,
  isAdditionalInfoValid,
} from "./components";

interface ProductDetailPageProps {
  slug: string;
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function ProductDetailPage({
  slug,
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
}: ProductDetailPageProps) {
  const isScrolled = useScroll();
  const {
    selectedPackage,
    selectedDuration,
    additionalInfo,
    setAdditionalInfo,
    handlePackageSelect,
    handleDurationSelect,
    resetAdditionalInfoForForm,
  } = useProductDetailState();

  const {
    product,
    packages,
    durationOptions,
    reviews,
    relatedProducts,
    selectedPackageImageUrl,
    selectedPackageInfo,
    allProducts,
    categories,
    loading,
    productsError,
    packagesError,
    productInfoError,
    handleRetryProducts,
    handleRetryPackages,
    handleRetryProductInfo,
  } = useProductData(slug, selectedPackage, selectedDuration);

  const selectedDurationData = useMemo(
    () => durationOptions.find((option) => option.key === selectedDuration) || null,
    [durationOptions, selectedDuration]
  );
  const hasSelectedVariant = Boolean(selectedPackage && selectedDuration);
  const variantSelectionPrompt = selectedPackage
    ? "Chọn thời hạn sử dụng để xem đúng thông tin của biến thể này."
    : "Chọn gói sản phẩm và thời hạn sử dụng để xem đúng thông tin của biến thể này.";

  const formId = selectedDuration ? (selectedDurationData?.form_id ?? null) : null;
  const { data: formFieldsData } = useQuery({
    queryKey: ["form-fields", formId],
    queryFn: () => fetchFormFields(formId!),
    enabled: !!formId && formId > 0,
  });
  const formData =
    formFieldsData?.success && formFieldsData?.data ? formFieldsData.data : null;

  useEffect(() => {
    resetAdditionalInfoForForm(formId);
  }, [formId, resetAdditionalInfoForForm, selectedDuration, selectedPackage]);

  useEffect(() => {
    if (!selectedPackage || packages.length === 0) return;
    const pkg = packages.find(
      (item: { id: string; has_available_duration?: boolean }) =>
        item.id === selectedPackage
    );
    if (pkg && pkg.has_available_duration === false) {
      handlePackageSelect(null);
    }
  }, [handlePackageSelect, packages, selectedPackage]);

  const seoHeading =
    (hasSelectedVariant ? selectedPackageInfo.seo_heading : null) ||
    (hasSelectedVariant ? selectedPackage : null) ||
    product?.name ||
    "Chi tiết sản phẩm";

  const seoMetadata = useMemo(() => {
    if (!product) {
      return {
        title: `Không tìm thấy sản phẩm - ${APP_CONFIG.name}`,
        description:
          "Trang sản phẩm không tồn tại, đã được gỡ hoặc đường dẫn không đúng. Bạn có thể quay lại danh mục hoặc tìm kiếm sản phẩm khác.",
        keywords: `sản phẩm không tồn tại, ${APP_CONFIG.name}`,
        url: `${APP_CONFIG.url}/${encodeURIComponent(slug)}`,
        robots: "noindex, follow",
      };
    }

    const fallbackTitleBase = hasSelectedVariant
      ? [seoHeading, selectedDurationData?.label].filter(Boolean).join(" - ")
      : product.name;

    const fallbackTitle = fallbackTitleBase
      .toLocaleLowerCase("vi-VN")
      .includes("chính hãng")
      ? `${fallbackTitleBase} | ${APP_CONFIG.name}`
      : `${fallbackTitleBase} chính hãng | ${APP_CONFIG.name}`;

    return {
      title: (product as { seo_title?: string | null }).seo_title || fallbackTitle,
      description:
        product.description && !isInternalProductPlaceholder(product.description)
          ? product.description
          : META_DESCRIPTION_FALLBACK,
      url: `${APP_CONFIG.url}/${encodeURIComponent(product.slug)}`,
      image: product.image_url || DEFAULT_PRODUCT_FALLBACK_IMAGE,
      type: "product" as const,
    };
  }, [hasSelectedVariant, product, selectedDurationData?.label, seoHeading, slug]);

  const currentCategory = useMemo(() => {
    if (!product?.category_id) return null;
    return (
      categories.find(
        (category: CategoryDto) => String(category.id) === String(product.category_id)
      ) || null
    );
  }, [categories, product?.category_id]);

  const normalizedReviews = useMemo(
    () =>
      reviews.map((review) => ({
        ...review,
        comment: review.comment ?? "",
      })),
    [reviews]
  );

  const detailDescriptionHtml = hasSelectedVariant
    ? selectedPackageInfo.description || null
    : null;

  const detailPolicyHtml = hasSelectedVariant
    ? selectedPackageInfo.purchase_rules || null
    : null;

  const imageAltText =
    (product as { image_alt?: string | null } | null)?.image_alt ||
    product?.description ||
    product?.name ||
    "Hình ảnh sản phẩm";

  const activeImageUrl = selectedPackageImageUrl || product?.image_url || null;

  const productSummarySource =
    !hasSelectedVariant
      ? variantSelectionPrompt
      : !isInternalProductPlaceholder(selectedPackageInfo.short_description)
      ? selectedPackageInfo.short_description
      : null;

  const productSummary = productSummarySource
    ? getCustomerFacingDescription(productSummarySource)
    : "Thông tin ngắn về sản phẩm đang được cập nhật.";

  const enhancedProductSummary =
    hasSelectedVariant &&
    !productSummary
      .toLocaleLowerCase("vi-VN")
      .includes(seoHeading.toLocaleLowerCase("vi-VN"))
      ? `${seoHeading}. ${productSummary}`
      : productSummary;

  const detailTextDescription =
    hasSelectedVariant && product?.description
      ? product.description
          .toLocaleLowerCase("vi-VN")
          .includes(seoHeading.toLocaleLowerCase("vi-VN"))
        ? product.description
        : `${seoHeading}\n\n${product.description}`
      : null;

  const productSchema = useMemo(() => {
    if (!product) return null;

    return generateProductSchema({
      name: product.name,
      description: product.description || undefined,
      image: activeImageUrl || undefined,
      price: selectedDurationData?.price ?? product.base_price ?? 0,
      brand: APP_CONFIG.name,
    });
  }, [activeImageUrl, product, selectedDurationData]);

  const breadcrumbItems = useMemo(() => {
    if (!product) return [];

    const items = [
      { name: "Trang chủ", url: `${APP_CONFIG.url}${ROUTES.home}` },
      { name: "Sản phẩm", url: `${APP_CONFIG.url}${ROUTES.allProducts}` },
    ];

    if (currentCategory) {
      items.push({
        name: currentCategory.name,
        url: `${APP_CONFIG.url}${ROUTES.category(slugify(currentCategory.name))}`,
      });
    }

    items.push({
      name: seoHeading,
      url: `${APP_CONFIG.url}/${encodeURIComponent(product.slug)}`,
    });

    return items;
  }, [currentCategory, product, seoHeading]);

  const structuredData = useMemo(() => {
    const items = [];

    if (productSchema) {
      items.push(productSchema);
    }

    if (breadcrumbItems.length > 0) {
      items.push(generateBreadcrumbSchema(breadcrumbItems));
    }

    return items.length > 0 ? items : null;
  }, [breadcrumbItems, productSchema]);

  const internalLinks = useMemo(() => {
    const links: Array<{ label: string; href: string }> = [
      { label: "Tất cả sản phẩm", href: ROUTES.allProducts },
      { label: "Sản phẩm mới", href: ROUTES.newProducts },
      { label: "Khuyến mãi", href: ROUTES.promotions },
      { label: "Giới thiệu", href: ROUTES.about },
    ];

    if (currentCategory) {
      links.unshift({
        label: `Danh mục ${currentCategory.name}`,
        href: ROUTES.category(slugify(currentCategory.name)),
      });
    }

    relatedProducts.slice(0, 3).forEach((item) => {
      links.push({
        label: item.name,
        href: `/${encodeURIComponent(item.slug)}`,
      });
    });

    return links.filter(
      (link, index, array) =>
        array.findIndex((entry) => entry.href === link.href) === index
    );
  }, [currentCategory, relatedProducts]);

  if (loading) {
    return <ProductLoadingSkeleton />;
  }

  if (!product) {
    return (
      <>
        <MetaTags metadata={seoMetadata} />
        <ProductNotFound
          error={productsError}
          onRetry={handleRetryProducts}
          onBack={onBack}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <MetaTags metadata={seoMetadata} />
      {structuredData ? <StructuredData data={structuredData} /> : null}

      <div
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/5 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={onBack}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={allProducts.map((item) => ({
            id: String(item.id),
            name: item.name,
            slug: item.slug,
            image_url: item.image_url,
            base_price: item.base_price ?? 0,
            discount_percentage: item.discount_percentage ?? 0,
          }))}
          categories={categories.map((category: CategoryDto) => ({
            id: String(category.id),
            name: category.name,
            slug: slugify(category.name),
          }))}
          onProductClick={onProductClick}
          onCategoryClick={(categorySlug) => {
            window.history.pushState({}, "", ROUTES.category(categorySlug));
            window.dispatchEvent(new Event("popstate"));
          }}
          omitNavActions
        />
        <MenuBar isScrolled={isScrolled} />
      </div>

      <main
        id="main-content"
        className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8"
      >
        <div className="mb-4 flex items-center">
          <button
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về</span>
          </button>
        </div>

        <nav
          aria-label="Breadcrumb"
          className="mb-6 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/70 dark:text-slate-300"
        >
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <li key={`${item.url}-${index}`} className="flex items-center gap-2">
                  {isLast ? (
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </span>
                  ) : (
                    <a
                      href={item.url.replace(APP_CONFIG.url, "") || "/"}
                      className="transition-colors hover:text-blue-600 dark:hover:text-blue-300"
                    >
                      {item.name}
                    </a>
                  )}
                  {!isLast ? <span className="text-gray-400">/</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>

        {productsError ? (
          <ErrorMessage
            title="Lỗi tải sản phẩm"
            message={productsError}
            onRetry={handleRetryProducts}
            className="mb-4"
          />
        ) : null}
        {packagesError ? (
          <ErrorMessage
            title="Lỗi tải gói sản phẩm"
            message={packagesError}
            onRetry={handleRetryPackages}
            className="mb-4"
          />
        ) : null}
        {productInfoError ? (
          <ErrorMessage
            title="Lỗi tải thông tin chi tiết"
            message={productInfoError}
            onRetry={handleRetryProductInfo}
            className="mb-4"
          />
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-6 sm:mb-10 sm:gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="w-full space-y-6 lg:space-y-8">
            <ProductImageGallery
              imageUrl={activeImageUrl}
              productName={product.name}
              altText={imageAltText}
              selectedPackage={selectedPackage}
              description={product.description}
              hasCustomImage={!!selectedPackageImageUrl}
            />
            <ProductInfo
              heading={seoHeading}
              summary={enhancedProductSummary}
              averageRating={product.average_rating}
              reviewCount={normalizedReviews.length}
              salesCount={product.sales_count}
            />
          </div>

          {packages.length > 0 ? (
            <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700/50 dark:bg-slate-900/90 sm:space-y-6 sm:rounded-2xl sm:p-5 sm:shadow-2xl">
              <PackageSelector
                packages={packages}
                selectedPackage={selectedPackage}
                onSelect={handlePackageSelect}
              />
              {durationOptions.length > 0 ? (
                <DurationSelector
                  options={durationOptions}
                  selectedDuration={selectedDuration}
                  onSelect={handleDurationSelect}
                />
              ) : null}
              <AdditionalInfoSection
                values={additionalInfo}
                onChange={setAdditionalInfo}
                visible={!!selectedPackage && !!selectedDuration}
                fields={formData?.fields}
              />
              <BuyButton
                selectedPackage={selectedPackage}
                selectedDuration={selectedDuration}
                selectedDurationData={selectedDurationData}
                productName={product.name}
                imageUrl={activeImageUrl}
                additionalInfoValid={isAdditionalInfoValid(
                  additionalInfo,
                  formData?.fields
                )}
                additionalInfo={additionalInfo}
                additionalInfoLabels={
                  formData?.fields
                    ? Object.fromEntries(
                        formData.fields.map((field) => [
                          String(field.input_id),
                          field.input_name,
                        ])
                      )
                    : undefined
                }
              />
            </div>
          ) : null}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <ProductDescription
              htmlDescription={detailDescriptionHtml}
              textDescription={detailTextDescription}
              pendingMessage={hasSelectedVariant ? null : variantSelectionPrompt}
            />
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700/50 dark:bg-slate-800 sm:rounded-2xl sm:shadow-xl">
              <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6 sm:py-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                  Liên kết nội bộ
                </h2>
              </div>
              <div className="px-5 pt-5 text-sm leading-relaxed text-gray-600 dark:text-slate-300 sm:px-6">
                Khám phá thêm các trang liên quan đến {seoHeading} để xem đầy đủ danh mục,
                sản phẩm mới, chương trình khuyến mãi và các gói tương tự đang có sẵn.
              </div>
              <div className="flex flex-wrap gap-3 p-5 pt-4 sm:p-6 sm:pt-4">
                {internalLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
            <ReviewSection
              reviews={normalizedReviews}
              averageRating={product.average_rating}
            />
          </div>

          <div className="lg:col-span-1">
            <PurchasePolicy
              htmlPolicy={detailPolicyHtml}
              textPolicy={null}
              pendingMessage={hasSelectedVariant ? null : variantSelectionPrompt}
            />
          </div>
        </div>

        <RelatedProducts products={relatedProducts} onProductClick={onProductClick} />
      </main>

      <Footer />
    </div>
  );
}
