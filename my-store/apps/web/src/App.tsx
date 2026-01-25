import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import FloatingLogo from "@/components/FloatingLogo";
import { ModeToggle } from "@/components/mode-toggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SkipLinks from "@/components/accessibility/SkipLinks";
import Loader from "@/components/loader";

const HomePage = lazy(() => import("@/components/pages/HomePage"));
const ProductDetailPage = lazy(() => import("@/components/pages/ProductDetailPage"));

type View = "home" | "product";

const parsePath = (): { view: View; slug: string | null } => {
  if (typeof window === "undefined") return { view: "home", slug: null };
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return { view: "home", slug: null };
  return { view: "product", slug: decodeURIComponent(path) };
};

export default function App() {
  const initialRoute = parsePath();
  const [view, setView] = useState<View>(initialRoute.view);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialRoute.slug);
  const [searchQuery, setSearchQuery] = useState("");

  // Keep UI state in sync with browser navigation
  useEffect(() => {
    const onPopState = () => {
      const next = parsePath();
      setView(next.view);
      setSelectedSlug(next.slug);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleProductClick = useCallback((slug: string) => {
    window.history.pushState({}, "", `/${encodeURIComponent(slug)}`);
    setSelectedSlug(slug);
    setView("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
