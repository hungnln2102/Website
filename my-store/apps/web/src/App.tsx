import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MetaTags } from "@/components/SEO";
import SkipLinks from "@/components/accessibility/SkipLinks";
import MaintenancePage from "@/components/MaintenancePage";
import HomePage from "@/features/home/HomePage";
import { useRouter, type View } from "@/hooks/useRouter";
import { isMaintenanceMode, onMaintenanceChange } from "@/lib/api/client";
import { APP_CONFIG, isSystemHubPath, ROUTES } from "@/lib/constants";

const SYSTEM_HUB_VIEWS = new Set<View>([
  "otp",
  "renew-adobe",
  "renew-zoom",
  "netflix",
]);

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
const NetflixPage = lazyWithRetry(() => import("@/features/CheckProfile/NetflixPage"));
const AdobeGuidePage = lazyWithRetry(() => import("@/features/guide/AdobeGuidePage"));
const AboutPage = lazyWithRetry(() => import("@/features/about/AboutPage"));
const NewsPage = lazyWithRetry(() => import("@/features/news/NewsPage"));
const NewsCategoryPage = lazyWithRetry(() => import("@/features/news/NewsCategoryPage"));
const NewsDetailPage = lazyWithRetry(() => import("@/features/news/NewsDetailPage"));
const PaymentSuccessPage = lazyWithRetry(() => import("@/features/payment/PaymentSuccessPage"));
const PaymentErrorPage = lazyWithRetry(() => import("@/features/payment/PaymentErrorPage"));
const PaymentCancelPage = lazyWithRetry(() => import("@/features/payment/PaymentCancelPage"));
const FloatingLogo = lazyWithRetry(() => import("@/components/FloatingLogo"));

const VIEWS_WITH_OWN_SEO = new Set<View>([
  "home",
  "product",
  "best-selling",
  "promotions",
  "news",
  "news-category",
  "news-detail",
]);

const getCurrentUrl = (fallbackPath: string) => {
  if (typeof window === "undefined") {
    return `${APP_CONFIG.url}${fallbackPath}`;
  }
  return `${APP_CONFIG.url}${window.location.pathname}${window.location.search}`;
};

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const runWarmup = () => {
      if (cancelled) return;
      Promise.allSettled([
        import("@/features/catalog/CategoryPage"),
        import("@/features/catalog/NewProductsPage"),
        import("@/features/catalog/AllProductsPage"),
        import("@/features/auth/LoginPage"),
        import("@/features/cart/CartPage"),
        import("@/features/profile/ProfilePage"),
        import("@/features/about/AboutPage"),
        import("@/features/news/NewsPage"),
      ]).catch(() => {});
    };

    const idleApi = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const fallbackTimer = window.setTimeout(runWarmup, 2500);
    const idleId = idleApi.requestIdleCallback?.(runWarmup, { timeout: 5000 });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      if (idleId && idleApi.cancelIdleCallback) {
        idleApi.cancelIdleCallback(idleId);
      }
    };
  }, []);

  const defaultSeoMetadata = useMemo(() => {
    switch (view) {
      case "category":
        return {
          title: `${selectedSlug ? `Danh mục ${decodeURIComponent(selectedSlug)} - ` : ""}${APP_CONFIG.name}`,
          description: "Trang danh mục phần mềm bản quyền với bộ lọc và sản phẩm liên quan theo nhu cầu.",
          keywords: "danh mục phần mềm, phần mềm bản quyền, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.home),
          type: "website" as const,
        };
      case "new-products":
        return {
          title: `Sản phẩm mới - ${APP_CONFIG.name}`,
          description: "Khám phá các sản phẩm mới cập nhật tại Mavryk Premium Store.",
          keywords: "sản phẩm mới, phần mềm mới, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.newProducts),
          type: "website" as const,
        };
      case "all-products":
        return {
          title: `Tất cả sản phẩm - ${APP_CONFIG.name}`,
          description: "Danh sách đầy đủ phần mềm bản quyền và dịch vụ đang có tại Mavryk Premium Store.",
          keywords: "tất cả sản phẩm, phần mềm bản quyền, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.allProducts),
          type: "website" as const,
        };
      case "about":
        return {
          title: `Giới thiệu - ${APP_CONFIG.name}`,
          description: "Thông tin giới thiệu, cam kết hỗ trợ và quy trình vận hành của Mavryk Premium Store.",
          keywords: "giới thiệu cửa hàng, hỗ trợ khách hàng, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.about),
          type: "website" as const,
        };
      case "adobe-guide":
        return {
          title: `Hướng dẫn Adobe - ${APP_CONFIG.name}`,
          description: "Tài liệu hướng dẫn sử dụng Adobe Creative Cloud dành cho khách hàng mới.",
          keywords: "hướng dẫn adobe, adobe creative cloud, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.adobeGuide),
          type: "website" as const,
        };
      case "topup":
        return {
          title: `Nạp tiền - ${APP_CONFIG.name}`,
          description: "Trang nạp tiền tài khoản để thanh toán nhanh hơn trên Mavryk Premium Store.",
          keywords: "nạp tiền tài khoản, ví khách hàng, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.topup),
          type: "website" as const,
          robots: "noindex, follow",
        };
      case "login":
        return {
          title: `${selectedSlug === "register" ? "Đăng ký" : "Đăng nhập"} - ${APP_CONFIG.name}`,
          description: "Truy cập hoặc tạo tài khoản để mua hàng và quản lý đơn hàng tại Mavryk Premium Store.",
          keywords: "đăng nhập, đăng ký, tài khoản khách hàng",
          url: getCurrentUrl(ROUTES.login),
          type: "website" as const,
          robots: "noindex, follow",
        };
      case "cart":
        return {
          title: `Giỏ hàng - ${APP_CONFIG.name}`,
          description: "Kiểm tra sản phẩm trong giỏ hàng trước khi thanh toán.",
          keywords: "giỏ hàng, thanh toán, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.cart),
          type: "website" as const,
          robots: "noindex, follow",
        };
      case "profile":
        return {
          title: `Tài khoản cá nhân - ${APP_CONFIG.name}`,
          description: "Quản lý hồ sơ, đơn hàng và thông tin tài khoản của bạn.",
          keywords: "hồ sơ khách hàng, lịch sử đơn hàng, tài khoản",
          url: getCurrentUrl(ROUTES.profile),
          type: "website" as const,
          robots: "noindex, follow",
        };
      case "otp":
        return {
          title: `Trung tâm gói - ${APP_CONFIG.name}`,
          description: "Trang kiểm tra và hỗ trợ dịch vụ dành cho khách hàng hiện có.",
          keywords: "hỗ trợ dịch vụ, kiểm tra tài khoản, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.otp),
          type: "website" as const,
          robots: "noindex, follow",
        };
      case "renew-adobe":
      case "renew-zoom":
      case "netflix":
        return {
          title: `Hỗ trợ dịch vụ - ${APP_CONFIG.name}`,
          description: "Trang kiểm tra và hỗ trợ dịch vụ dành cho khách hàng hiện có.",
          keywords: "hỗ trợ dịch vụ, kiểm tra tài khoản, Mavryk Premium Store",
          url: getCurrentUrl(
            view === "renew-adobe"
              ? ROUTES.renewAdobe
              : view === "renew-zoom"
                ? ROUTES.renewZoom
                : ROUTES.netflix
          ),
          type: "website" as const,
          robots: "noindex, follow",
        };
      case "payment-success":
      case "payment-error":
      case "payment-cancel":
        return {
          title: `Kết quả thanh toán - ${APP_CONFIG.name}`,
          description: "Thông tin trạng thái thanh toán đơn hàng.",
          keywords: "thanh toán, kết quả đơn hàng, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.paymentSuccess),
          type: "website" as const,
          robots: "noindex, follow",
        };
      default:
        return {
          title: `${APP_CONFIG.name} - Phần mềm bản quyền chính hãng`,
          description: APP_CONFIG.description,
          keywords: "phần mềm bản quyền, tài khoản số, Mavryk Premium Store",
          url: getCurrentUrl(ROUTES.home),
          type: "website" as const,
        };
    }
  }, [selectedSlug, view]);

  const shouldInjectDefaultSeo = !VIEWS_WITH_OWN_SEO.has(view);

  const allowSiteDuringMaintenance =
    SYSTEM_HUB_VIEWS.has(view) ||
    (typeof window !== "undefined" && isSystemHubPath(window.location.pathname));

  if (maintenance && !allowSiteDuringMaintenance) {
    return <MaintenancePage />;
  }

  if (view === "home" || (view === "product" && !selectedSlug)) {
    return (
      <ErrorBoundary key={view}>
        <SkipLinks />
        {shouldInjectDefaultSeo ? <MetaTags metadata={defaultSeoMetadata} /> : null}
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
      {shouldInjectDefaultSeo ? <MetaTags metadata={defaultSeoMetadata} /> : null}
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
        {view === "netflix" && <NetflixPage />}
        {view === "adobe-guide" && <AdobeGuidePage />}
        {view === "about" && <AboutPage />}
        {view === "news" && (
          <NewsPage
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "news-category" && selectedSlug && (
          <NewsCategoryPage
            categorySlug={selectedSlug}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {view === "news-detail" && selectedSlug && (
          <NewsDetailPage
            slug={selectedSlug}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
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

