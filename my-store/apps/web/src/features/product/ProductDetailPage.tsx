"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { MetaTags, StructuredData } from "@/components/SEO";
import { ErrorMessage } from "@/components/ui/error-message";
import { useAuth } from "@/features/auth/hooks";
import { useScroll } from "@/hooks/useScroll";
import { fetchFormFields, type CategoryDto } from "@/lib/api";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
import { generateProductSchema } from "@/lib/seo";
import { slugify } from "@/lib/utils";

import { useProductData, useProductDetailState } from "./hooks";
import {
  META_DESCRIPTION_FALLBACK,
  getCustomerFacingDescription,
  isInternalProductPlaceholder,
} from "./utils/contentPresentation";
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
  const { user, logout } = useAuth();
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
    productInfo,
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
    ? "\u0043h\u1ecdn th\u1eddi h\u1ea1n s\u1eed d\u1ee5ng \u0111\u1ec3 xem \u0111\u00fang th\u00f4ng tin c\u1ee7a bi\u1ebfn th\u1ec3 n\u00e0y."
    : "\u0043h\u1ecdn g\u00f3i s\u1ea3n ph\u1ea9m v\u00e0 th\u1eddi h\u1ea1n s\u1eed d\u1ee5ng \u0111\u1ec3 xem \u0111\u00fang th\u00f4ng tin c\u1ee7a bi\u1ebfn th\u1ec3 n\u00e0y.";

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

  const seoMetadata = useMemo(() => {
    if (!product) {
      return {
        title: `Sản phẩm - ${APP_CONFIG.name}`,
        description: APP_CONFIG.description,
        url: APP_CONFIG.url,
      };
    }

    return {
      title:
        (product as { seo_title?: string | null }).seo_title ||
        `${product.name} | ${APP_CONFIG.name}`,
      description:
        product.description && !isInternalProductPlaceholder(product.description)
          ? product.description
          : META_DESCRIPTION_FALLBACK,
      url: `${APP_CONFIG.url}/${encodeURIComponent(product.slug)}`,
      image: product.image_url || `${APP_CONFIG.url}/favicon.png`,
      type: "product" as const,
    };
  }, [product]);

  const seoHeading =
    (hasSelectedVariant ? selectedPackageInfo.seo_heading : null) ||
    (hasSelectedVariant ? selectedPackage : null) ||
    product?.name ||
    "Chi tiết sản phẩm";

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

  if (loading) {
    return <ProductLoadingSkeleton />;
  }

  if (!product) {
    return (
      <ProductNotFound
        error={productsError}
        onRetry={handleRetryProducts}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <MetaTags metadata={seoMetadata} />
      {productSchema ? <StructuredData data={productSchema} /> : null}

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
          user={user}
          onLogout={logout}
        />
        <MenuBar
          isScrolled={isScrolled}
          categories={categories.map((category: CategoryDto) => ({
            id: String(category.id),
            name: category.name,
            slug: slugify(category.name),
            icon: null,
          }))}
          selectedCategory={null}
          onSelectCategory={(categorySlug) => {
            if (!categorySlug) return;
            window.history.pushState({}, "", ROUTES.category(categorySlug));
            window.dispatchEvent(new Event("popstate"));
          }}
        />
      </div>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 flex items-center">
          <button
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về</span>
          </button>
        </div>

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
              summary={productSummary}
              averageRating={product.average_rating}
              reviewCount={reviews.length}
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
              textDescription={hasSelectedVariant ? product.description : null}
              pendingMessage={hasSelectedVariant ? null : variantSelectionPrompt}
            />
            <ReviewSection
              reviews={reviews}
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
