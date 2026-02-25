"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import { ErrorMessage } from "@/components/ui/error-message";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { MetaTags } from "@/components/SEO";
import { useScroll } from "@/hooks/useScroll";
import { slugify } from "@/lib/utils";
import { fetchFormFields, type CategoryDto } from "@/lib/api";
import { useAuth } from "@/features/auth/hooks";
import { APP_CONFIG } from "@/lib/constants";

import { useProductData, useProductDetailState } from "./hooks";
import {
  ProductLoadingSkeleton,
  ProductNotFound,
  ProductImageGallery,
  ProductInfo,
  PackageSelector,
  DurationSelector,
  AdditionalInfoSection,
  getDefaultAdditionalInfo,
  isAdditionalInfoValid,
  BuyButton,
  ProductDescription,
  ReviewSection,
  PurchasePolicy,
  RelatedProducts,
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
  } = useProductData(slug, selectedPackage);

  // Get selected duration data
  const selectedDurationData = useMemo(
    () => durationOptions.find((option) => option.key === selectedDuration) || null,
    [durationOptions, selectedDuration]
  );

  // form_id: ưu tiên duration đang chọn, không thì lấy duration đầu tiên của gói → hiện form ngay khi chọn gói
  const formId =
    selectedDurationData?.form_id ?? durationOptions[0]?.form_id ?? null;
  const { data: formFieldsData } = useQuery({
    queryKey: ["form-fields", formId],
    queryFn: () => fetchFormFields(formId!),
    enabled: !!formId && formId > 0,
  });
  const formData = formFieldsData?.success && formFieldsData?.data ? formFieldsData.data : null;

  useEffect(() => {
    resetAdditionalInfoForForm(formId);
  }, [selectedPackage, selectedDuration, formId, resetAdditionalInfoForForm]);

  const seoMetadata = useMemo(() => {
    if (!product) {
      return {
        title: `Sản phẩm - ${APP_CONFIG.name}`,
        description: APP_CONFIG.description,
        url: APP_CONFIG.url,
      };
    }

    const title = `${product.name} - ${APP_CONFIG.name}`;
    const description =
      product.description ||
      `Mua ${product.name} chính hãng, giá tốt tại ${APP_CONFIG.name}. ${APP_CONFIG.description}`;

    const url = `${APP_CONFIG.url}/${encodeURIComponent(product.slug)}`;

    return {
      title,
      description,
      url,
      image: product.image_url || `${APP_CONFIG.url}/favicon.png`,
      type: "product" as const,
    };
  }, [product]);

  // Show loading state
  if (loading) {
    return <ProductLoadingSkeleton />;
  }

  // Show not found state
  if (!product) {
    return (
      <ProductNotFound error={productsError} onRetry={handleRetryProducts} onBack={onBack} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <MetaTags metadata={seoMetadata} />
      {/* Header */}
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
          products={allProducts.map((p) => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            base_price: p.base_price ?? 0,
            discount_percentage: p.discount_percentage ?? 0,
          }))}
          categories={categories.map((c: CategoryDto) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
          }))}
          onProductClick={onProductClick}
          onCategoryClick={(catSlug) => {
            window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(catSlug)}`);
            window.dispatchEvent(new Event("popstate"));
          }}
          user={user}
          onLogout={logout}
        />
        <MenuBar
          isScrolled={isScrolled}
          categories={categories.map((c: CategoryDto) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
            icon: null,
          }))}
          selectedCategory={null}
          onSelectCategory={(catSlug) => {
            if (catSlug) {
              window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(catSlug)}`);
              window.dispatchEvent(new Event("popstate"));
            }
          }}
        />
      </div>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4 flex items-center">
          <button
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về</span>
          </button>
        </div>

        {/* Error States */}
        {productsError && (
          <ErrorMessage title="Lỗi tải sản phẩm" message={productsError} onRetry={handleRetryProducts} className="mb-4" />
        )}
        {packagesError && (
          <ErrorMessage title="Lỗi tải gói sản phẩm" message={packagesError} onRetry={handleRetryPackages} className="mb-4" />
        )}
        {productInfoError && (
          <ErrorMessage title="Lỗi tải thông tin chi tiết" message={productInfoError} onRetry={handleRetryProductInfo} className="mb-4" />
        )}

        {/* Main Content Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:mb-10 sm:gap-8 lg:grid-cols-[1.05fr_1fr]">
          {/* Left Column - Image & Info */}
          <div className="space-y-6 lg:space-y-8 w-full">
            <ProductImageGallery
              imageUrl={selectedPackageImageUrl || product.image_url}
              productName={product.name}
              selectedPackage={selectedPackage}
              description={product.description}
              hasCustomImage={!!selectedPackageImageUrl}
            />
            <ProductInfo
              name={product.name}
              averageRating={product.average_rating}
              reviewCount={reviews.length}
              salesCount={product.sales_count}
            />
          </div>

          {/* Right Column - Package Selection */}
          {packages.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700/50 dark:bg-slate-900/90 sm:rounded-2xl sm:p-5 sm:shadow-2xl space-y-5 sm:space-y-6">
              <PackageSelector
                packages={packages}
                selectedPackage={selectedPackage}
                onSelect={handlePackageSelect}
              />
              {durationOptions.length > 0 && (
                <DurationSelector
                  options={durationOptions}
                  selectedDuration={selectedDuration}
                  onSelect={handleDurationSelect}
                />
              )}
              <AdditionalInfoSection
                values={additionalInfo}
                onChange={setAdditionalInfo}
                visible={!!selectedPackage && durationOptions.length > 0}
                fields={formData?.fields}
              />
              <BuyButton
                selectedPackage={selectedPackage}
                selectedDuration={selectedDuration}
                selectedDurationData={selectedDurationData}
                productName={product.name}
                imageUrl={selectedPackageImageUrl || product.image_url}
                additionalInfoValid={isAdditionalInfoValid(additionalInfo, formData?.fields)}
                additionalInfo={additionalInfo}
                additionalInfoLabels={
                  formData?.fields
                    ? Object.fromEntries(formData.fields.map((f) => [String(f.input_id), f.input_name]))
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {/* Bottom Grid */}
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left - Description & Reviews */}
          <div className="lg:col-span-2 space-y-8">
            <ProductDescription
              htmlDescription={selectedPackageInfo.description || productInfo?.description}
              textDescription={product.description}
            />
            <ReviewSection reviews={reviews} averageRating={product.average_rating} />
          </div>

          {/* Right - Purchase Policy */}
          <div className="lg:col-span-1">
            <PurchasePolicy
              htmlPolicy={selectedPackageInfo.purchase_rules || productInfo?.purchase_rules}
              textPolicy={product.purchase_rules}
            />
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} onProductClick={onProductClick} />
      </main>

      <Footer />
    </div>
  );
}
