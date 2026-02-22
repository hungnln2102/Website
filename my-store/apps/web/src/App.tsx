import { lazy, Suspense } from "react";
import FloatingLogo from "@/components/FloatingLogo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SkipLinks from "@/components/accessibility/SkipLinks";
import Loader from "@/components/loader";
import { useRouter } from "@/hooks/useRouter";

const HomePage = lazy(() => import("@/features/home/HomePage"));
const ProductDetailPage = lazy(() => import("@/features/product/ProductDetailPage"));
const CategoryPage = lazy(() => import("@/features/catalog/CategoryPage"));
const NewProductsPage = lazy(() => import("@/features/catalog/NewProductsPage"));
const PromotionsPage = lazy(() => import("@/features/catalog/PromotionsPage"));
const AllProductsPage = lazy(() => import("@/features/catalog/AllProductsPage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const CartPage = lazy(() => import("@/features/cart/CartPage"));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage"));
const TopupPage = lazy(() => import("@/features/topup/TopupPage"));
const AboutPage = lazy(() => import("@/features/about/AboutPage"));
const PaymentSuccessPage = lazy(() => import("@/features/payment/PaymentSuccessPage"));
const PaymentErrorPage = lazy(() => import("@/features/payment/PaymentErrorPage"));
const PaymentCancelPage = lazy(() => import("@/features/payment/PaymentCancelPage"));

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
    <ErrorBoundary>
      <SkipLinks />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950"><Loader /></div>}>
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
