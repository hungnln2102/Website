import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import FloatingLogo from "@/components/FloatingLogo";
import { ModeToggle } from "@/components/mode-toggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SkipLinks from "@/components/accessibility/SkipLinks";
import Loader from "@/components/loader";
import { fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";

const HomePage = lazy(() => import("@/components/pages/HomePage"));
const ProductDetailPage = lazy(() => import("@/components/pages/ProductDetailPage"));
const CategoryPage = lazy(() => import("@/components/pages/CategoryPage"));
const NewProductsPage = lazy(() => import("@/components/pages/NewProductsPage"));
const PromotionsPage = lazy(() => import("@/components/pages/PromotionsPage"));
const AllProductsPage = lazy(() => import("@/components/pages/AllProductsPage"));

type View = "home" | "product" | "category" | "new-products" | "promotions" | "all-products";

const parsePath = (categories: CategoryDto[]): { view: View; slug: string | null } => {
  if (typeof window === "undefined") return { view: "home", slug: null };
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return { view: "home", slug: null };
  
  // Check for special routes
  if (path === "san-pham-moi") {
    return { view: "new-products", slug: null };
  }

  if (path === "khuyen-mai") {
    return { view: "promotions", slug: null };
  }

  if (path === "tat-ca-san-pham") {
    return { view: "all-products", slug: null };
  }
  
  // Check if path starts with "danh-muc/"
  if (path.startsWith("danh-muc/")) {
    const categorySlug = path.replace("danh-muc/", "");
    const decodedSlug = decodeURIComponent(categorySlug);
    const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === decodedSlug);
    if (isCategory) {
      return { view: "category", slug: decodedSlug };
    }
  }
  
  // Check if it's a category slug (without prefix, for backward compatibility)
  const decodedPath = decodeURIComponent(path);
  const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === decodedPath);
  if (isCategory) {
    return { view: "category", slug: decodedPath };
  }
  
  return { view: "product", slug: decodedPath };
};

export default function App() {
  const [view, setView] = useState<View>("home");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
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
  }, [categories]);

  // Keep UI state in sync with browser navigation
  useEffect(() => {
    const onPopState = () => {
      const route = parsePath(categories);
      setView(route.view);
      setSelectedSlug(route.slug);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [categories]);

  const handleProductClick = useCallback((slug: string, isCategorySlug: boolean = false) => {
    const route = parsePath(categories);
    // Check if slug is a category or product
    const isCategory = isCategorySlug || categories.some((c: CategoryDto) => slugify(c.name) === slug);
    const url = isCategory ? `/danh-muc/${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}`;
    window.history.pushState({}, "", url);
    setSelectedSlug(slug);
    setView(isCategory ? "category" : "product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categories]);

  const handleBack = useCallback(() => {
    window.history.pushState({}, "", `/`);
    setView("home");
    setSelectedSlug(null);
    setSearchQuery(""); // Clear search when going back home manually
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
            setSearchQuery={(q: string) => {
              setSearchQuery(q);
              if (q) handleBack(); // Go home if searching from detail page
            }}
          />
        )}
      </Suspense>
      <FloatingLogo />
    </ErrorBoundary>
  );
}
