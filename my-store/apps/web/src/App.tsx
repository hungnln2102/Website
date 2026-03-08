import { lazy, Suspense } from "react";
import FloatingLogo from "@/components/FloatingLogo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SkipLinks from "@/components/accessibility/SkipLinks";
import { useRouter } from "@/hooks/useRouter";

/** Retry lazy import khi chunk load lỗi (mạng, cache, base URL). */
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

const HomePage = lazyWithRetry(() => import("@/features/home/HomePage"));
const ProductDetailPage = lazyWithRetry(() => import("@/features/product/ProductDetailPage"));
const CategoryPage = lazyWithRetry(() => import("@/features/catalog/CategoryPage"));
const NewProductsPage = lazyWithRetry(() => import("@/features/catalog/NewProductsPage"));
const PromotionsPage = lazyWithRetry(() => import("@/features/catalog/PromotionsPage"));
const AllProductsPage = lazyWithRetry(() => import("@/features/catalog/AllProductsPage"));
const LoginPage = lazyWithRetry(() => import("@/features/auth/LoginPage"));
const CartPage = lazyWithRetry(() => import("@/features/cart/CartPage"));
const ProfilePage = lazyWithRetry(() => import("@/features/profile/ProfilePage"));
const TopupPage = lazyWithRetry(() => import("@/features/topup/TopupPage"));
const CheckProfilePage = lazyWithRetry(() => import("@/features/CheckProfile/checkprofile"));
const ServicePlaceholderPage = lazyWithRetry(() => import("@/features/CheckProfile/ServicePlaceholderPage"));
const AdobeGuidePage = lazyWithRetry(() => import("@/features/guide/AdobeGuidePage"));
const AboutPage = lazyWithRetry(() => import("@/features/about/AboutPage"));
const PaymentSuccessPage = lazyWithRetry(() => import("@/features/payment/PaymentSuccessPage"));
const PaymentErrorPage = lazyWithRetry(() => import("@/features/payment/PaymentErrorPage"));
const PaymentCancelPage = lazyWithRetry(() => import("@/features/payment/PaymentCancelPage"));

export default function App() {
  const {
    view,
    selectedSlug,
    searchQuery,
    setSearchQuery,
    handleProductClick,
    handleBack,
  } = useRouter();

  if (view === "product" && !selectedSlug) {
    return <HomePage onProductClick={handleProductClick} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
  }

  return (
    <ErrorBoundary key={view}>
      <SkipLinks />
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950" aria-live="polite" aria-busy="true">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang tải trang...</p>
          </div>
        </div>
      }>
        {view === "home" && <HomePage onProductClick={handleProductClick} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
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
        {view === "renew-adobe" && <ServicePlaceholderPage serviceId="renew-adobe" />}
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
      {view !== "login" && <FloatingLogo />}
    </ErrorBoundary>
  );
}
