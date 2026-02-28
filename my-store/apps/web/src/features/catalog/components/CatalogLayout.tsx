"use client";

import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { useScroll } from "@/hooks/useScroll";
import { slugify } from "@/lib/utils";
import type { CategoryDto } from "@/lib/api";
import { useAuth } from "@/features/auth/hooks";
import { ROUTES } from "@/lib/constants";

interface CatalogLayoutProps {
  children: React.ReactNode;
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPlaceholder?: string;
  products: any[];
  categories: CategoryDto[];
  selectedCategory?: string | null;
}

export function CatalogLayout({
  children,
  onBack,
  onProductClick,
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Tìm kiếm sản phẩm...",
  products,
  categories,
  selectedCategory = null,
}: CatalogLayoutProps) {
  const isScrolled = useScroll();
  const { user, logout } = useAuth();

  const handleCategoryClick = (slug: string) => {
    window.history.pushState({}, "", ROUTES.category(slug));
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div
        className={`sticky top-0 z-40 transition-all duration-500 ${
          isScrolled ? "shadow-xl shadow-blue-900/5 backdrop-blur-xl" : ""
        }`}
      >
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={onBack}
          searchPlaceholder={searchPlaceholder}
          products={products.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug || slugify(p.name),
            image_url: p.image_url || null,
            base_price: p.base_price ?? 0,
            discount_percentage: p.discount_percentage ?? 0,
          }))}
          categories={categories.map((c: CategoryDto) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
          }))}
          onProductClick={onProductClick}
          onCategoryClick={handleCategoryClick}
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
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            if (slug) handleCategoryClick(slug);
          }}
        />
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4 flex items-center">
          <button
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về</span>
          </button>
        </div>

        {children}
      </main>

      <Footer />
    </div>
  );
}
