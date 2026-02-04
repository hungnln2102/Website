import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import FloatingLogo from "@/components/FloatingLogo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SkipLinks from "@/components/accessibility/SkipLinks";
import Loader from "@/components/loader";
import { fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";

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
const PaymentSuccessPage = lazy(() => import("@/features/payment/PaymentSuccessPage"));
const PaymentErrorPage = lazy(() => import("@/features/payment/PaymentErrorPage"));
const PaymentCancelPage = lazy(() => import("@/features/payment/PaymentCancelPage"));

type View = "home" | "product" | "category" | "new-products" | "promotions" | "all-products" | "login" | "cart" | "profile" | "topup" | "payment-success" | "payment-error" | "payment-cancel";

interface RouteInfo {
  view: View;
  slug: string | null;
  parentPath: string | null; // Đường dẫn cha để quay lại
}

const parsePath = (categories: CategoryDto[]): RouteInfo => {
  if (typeof window === "undefined") return { view: "home", slug: null, parentPath: null };
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return { view: "home", slug: null, parentPath: null };
  
  // Check for special routes
  if (path === "login") {
    return { view: "login", slug: null, parentPath: "/" };
  }

  if (path === "gio-hang" || path === "cart") {
    return { view: "cart", slug: null, parentPath: "/" };
  }

  if (path === "tai-khoan" || path === "profile") {
    return { view: "profile", slug: null, parentPath: "/" };
  }

  if (path === "nap-tien" || path === "topup") {
    return { view: "topup", slug: null, parentPath: "/" };
  }

  // Payment routes
  if (path === "payment/success") {
    return { view: "payment-success", slug: null, parentPath: "/" };
  }

  if (path === "payment/error") {
    return { view: "payment-error", slug: null, parentPath: "/" };
  }

  if (path === "payment/cancel") {
    return { view: "payment-cancel", slug: null, parentPath: "/" };
  }

  // San pham moi routes
  if (path === "san-pham-moi") {
    return { view: "new-products", slug: null, parentPath: "/" };
  }
  if (path.startsWith("san-pham-moi/")) {
    const productSlug = decodeURIComponent(path.replace("san-pham-moi/", ""));
    return { view: "product", slug: productSlug, parentPath: "/san-pham-moi" };
  }

  // Khuyen mai routes
  if (path === "khuyen-mai") {
    return { view: "promotions", slug: null, parentPath: "/" };
  }
  if (path.startsWith("khuyen-mai/")) {
    const productSlug = decodeURIComponent(path.replace("khuyen-mai/", ""));
    return { view: "product", slug: productSlug, parentPath: "/khuyen-mai" };
  }

  // Tat ca san pham routes
  if (path === "tat-ca-san-pham") {
    return { view: "all-products", slug: null, parentPath: "/" };
  }
  if (path.startsWith("tat-ca-san-pham/")) {
    const productSlug = decodeURIComponent(path.replace("tat-ca-san-pham/", ""));
    return { view: "product", slug: productSlug, parentPath: "/tat-ca-san-pham" };
  }
  
  // Danh muc routes (với sản phẩm con)
  if (path.startsWith("danh-muc/")) {
    const rest = path.replace("danh-muc/", "");
    const parts = rest.split("/");
    const categorySlug = decodeURIComponent(parts[0]);
    const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === categorySlug);
    
    if (isCategory) {
      if (parts.length > 1) {
        // Có product slug: /danh-muc/category/product
        const productSlug = decodeURIComponent(parts[1]);
        return { view: "product", slug: productSlug, parentPath: `/danh-muc/${encodeURIComponent(categorySlug)}` };
      }
      return { view: "category", slug: categorySlug, parentPath: "/" };
    }
  }
  
  // Check if it's a category slug (without prefix, for backward compatibility)
  const decodedPath = decodeURIComponent(path);
  const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === decodedPath);
  if (isCategory) {
    return { view: "category", slug: decodedPath, parentPath: "/" };
  }
  
  // Default: product from home
  return { view: "product", slug: decodedPath, parentPath: "/" };
};

export default function App() {
  const [view, setView] = useState<View>("home");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories to determine routing
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Initialize route
  useEffect(() => {
    const route = parsePath(categories);
    setView(route.view);
    setSelectedSlug(route.slug);
    setParentPath(route.parentPath);
  }, [categories]);

  // Keep UI state in sync with browser navigation
  useEffect(() => {
    const onPopState = () => {
      const route = parsePath(categories);
      setView(route.view);
      setSelectedSlug(route.slug);
      setParentPath(route.parentPath);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [categories]);

  // Lấy base path hiện tại để tạo URL phân cấp cho sản phẩm
  const getCurrentBasePath = useCallback(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (path === "tat-ca-san-pham") return "/tat-ca-san-pham";
    if (path === "san-pham-moi") return "/san-pham-moi";
    if (path === "khuyen-mai") return "/khuyen-mai";
    if (path.startsWith("danh-muc/")) {
      const parts = path.split("/");
      if (parts.length >= 2) return `/danh-muc/${parts[1]}`;
    }
    return ""; // Home page - product URL sẽ là /{slug}
  }, []);

  const handleProductClick = useCallback((slug: string, isCategorySlug: boolean = false) => {
    // Check if slug is a category or product
    const isCategory = isCategorySlug || categories.some((c: CategoryDto) => slugify(c.name) === slug);
    
    if (isCategory) {
      const url = `/danh-muc/${encodeURIComponent(slug)}`;
      window.history.pushState({}, "", url);
      setSelectedSlug(slug);
      setParentPath("/");
      setView("category");
    } else {
      // Tạo URL phân cấp dựa trên trang hiện tại
      const basePath = getCurrentBasePath();
      const url = basePath ? `${basePath}/${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}`;
      window.history.pushState({}, "", url);
      setSelectedSlug(slug);
      setParentPath(basePath || "/");
      setView("product");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categories, getCurrentBasePath]);

  const handleBack = useCallback(() => {
    // Quay về đường dẫn cha
    const backPath = parentPath || "/";
    window.history.pushState({}, "", backPath);
    
    // Parse lại route để cập nhật state
    const route = parsePath(categories);
    setView(route.view);
    setSelectedSlug(route.slug);
    setParentPath(route.parentPath);
    
    if (backPath === "/") {
      setSearchQuery(""); // Clear search when going back home
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [parentPath, categories]);

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
