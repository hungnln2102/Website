import { lazy, Suspense, useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SkipLinks from "@/components/accessibility/SkipLinks";
import MaintenancePage from "@/components/MaintenancePage";
import HomePage from "@/features/home/HomePage";
import { useRouter } from "@/hooks/useRouter";
import { isMaintenanceMode, onMaintenanceChange } from "@/lib/api/client";

/** Retry lazy import khi chunk load lá»—i (máº¡ng, cache, base URL). */
function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await importFn();
      } catch (e) {
        lastErr = e;
        if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
    throw lastErr;
  }) as React.LazyExoticComponent<T>;
}

const ProductDetailPage = lazyWithRetry(() => import("@/features/product/ProductDetailPage"));
const CategoryPage = lazyWithRetry(() => import("@/features/catalog/CategoryPage"));
const NewProductsPage = lazyWithRetry(() => import("@/features/catalog/NewProductsPage"));
const BestSellingPage = lazyWithRetry(() => import("@/features/catalog/BestSellingPage"));
const PromotionsPage = lazyWithRetry(() => import("@/features/catalog/PromotionsPage"));
const AllProductsPage = lazyWithRetry(() => import("@/features/catalog/AllProductsPage"));
const LoginPage = lazyWithRetry(() => import("@/features/auth/LoginPage"));
const CartPage = lazyWithRetry(() => import("@/features/cart/CartPage"));
const ProfilePage = lazyWithRetry(() => import("@/features/profile/ProfilePage"));
const TopupPage = lazyWithRetry(() => import("@/features/wallet/TopupPage"));
const CheckProfilePage = lazyWithRetry(() => import("@/features/CheckProfile/checkprofile"));
const RenewAdobePage = lazyWithRetry(() => import("@/features/CheckProfile/RenewAdobePage"));
const ServicePlaceholderPage = lazyWithRetry(() => import("@/features/CheckProfile/ServicePlaceholderPage"));
const AdobeGuidePage = lazyWithRetry(() => import("@/features/guide/AdobeGuidePage"));
const AboutPage = lazyWithRetry(() => import("@/features/about/AboutPage"));
const PaymentSuccessPage = lazyWithRetry(() => import("@/features/payment/PaymentSuccessPage"));
const PaymentErrorPage = lazyWithRetry(() => import("@/features/payment/PaymentErrorPage"));
const PaymentCancelPage = lazyWithRetry(() => import("@/features/payment/PaymentCancelPage"));
const FloatingLogo = lazyWithRetry(() => import("@/components/FloatingLogo"));

export default function App() {
  const [maintenance, setMaintenance] = useState(isMaintenanceMode);
  useEffect(() => onMaintenanceChange(setMaintenance), []);

  const {
    view,
    selectedSlug,
    searchQuery,
    setSearchQuery,
    handleProductClick,
    handleBack,
  } = useRouter();

  if (maintenance) {
    return <MaintenancePage />;
  }

  if (view === "home" || (view === "product" && !selectedSlug)) {
    return (
      <ErrorBoundary key={view}>
        <SkipLinks />
        <HomePage
          onProductClick={handleProductClick}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <Suspense fallback={null}>
          <FloatingLogo />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary key={view}>
      <SkipLinks />
      <Suspense
        fallback={
          <div
            className="pointer-events-none fixed right-4 top-4 z-[160] inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/92 px-3 py-2 text-sm font-medium text-slate-600 shadow-lg shadow-slate-950/5 backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/88 dark:text-slate-300"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
            <span>Đang tải trang...</span>
          </div>
        }
      >
        {view === "category" && selectedSlug && (
          <CategoryPage
            categorySlug={selectedSlug}
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "new-products" && (
          <NewProductsPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "best-selling" && (
          <BestSellingPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "promotions" && (
          <PromotionsPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "all-products" && (
          <AllProductsPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "product" && selectedSlug && (
          <ProductDetailPage
            slug={selectedSlug}
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "login" && (
          <LoginPage
            onBack={handleBack}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            initialMode={selectedSlug === "register" ? "register" : "login"}
          />
        )}
        {view === "cart" && (
          <CartPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {view === "profile" && (
          <ProfilePage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {view === "topup" && <TopupPage />}
        {view === "otp" && <CheckProfilePage />}
        {view === "renew-adobe" && <RenewAdobePage />}
        {view === "renew-zoom" && <ServicePlaceholderPage serviceId="renew-zoom" />}
        {view === "netflix" && <ServicePlaceholderPage serviceId="netflix" />}
        {view === "adobe-guide" && <AdobeGuidePage />}
        {view === "about" && <AboutPage />}
        {view === "payment-success" && (
          <PaymentSuccessPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {view === "payment-error" && (
          <PaymentErrorPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {view === "payment-cancel" && (
          <PaymentCancelPage
            onBack={handleBack}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </Suspense>
      {view !== "login" && (
        <Suspense fallback={null}>
          <FloatingLogo />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}

