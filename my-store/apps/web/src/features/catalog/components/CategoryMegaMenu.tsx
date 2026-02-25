"use client";

import { ChevronRight, ArrowRight, Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { CategoryItem } from "../hooks/useCategoryMegaMenu";

type ProductCardPayload = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  image_url: string | null;
  discount_percentage: number;
  [key: string]: unknown;
};

interface CategoryMegaMenuProps {
  categories: CategoryItem[];
  filteredProducts: ProductCardPayload[];
  activeHoveredSlug: string | null;
  selectedCategory: string | null;
  menuRef: React.RefObject<HTMLElement | null>;
  position: { top: number; left: number };
  isMobile: boolean;
  onCategoryClick: (slug: string | null) => void;
  onProductClick: (slug: string) => void;
  onSeeAll: (slug: string) => void;
  onHoverCategory: (slug: string) => void;
  onSelectCategory?: (slug: string | null) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onBackdropClick?: () => void;
}

export function CategoryMegaMenu({
  categories,
  filteredProducts,
  activeHoveredSlug,
  selectedCategory,
  menuRef,
  position,
  isMobile,
  onCategoryClick,
  onProductClick,
  onSeeAll,
  onHoverCategory,
  onSelectCategory,
  onMouseEnter,
  onMouseLeave,
  onBackdropClick,
}: CategoryMegaMenuProps) {
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    top: position.top > 0 ? `${position.top}px` : "auto",
    left: isMobile ? 8 : (position.left > 0 ? Math.max(8, position.left - 8) : 8),
    right: isMobile ? 8 : "auto",
    maxHeight: `calc(100vh - ${position.top > 0 ? position.top + 16 : 80}px)`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <aside
      ref={menuRef}
      className="fixed z-[9999] w-[calc(100vw-1rem)] max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:w-[calc(100vw-2rem)] md:w-[calc(100vw-3rem)] lg:w-screen lg:max-w-6xl"
      aria-label="Danh mục sản phẩm"
      role="menu"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        if (onBackdropClick && isMobile && e.target === e.currentTarget) {
          onBackdropClick();
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 overflow-hidden flex-1 min-h-0">
        <section
          className="border-r border-gray-100 dark:border-slate-700 p-3 sm:p-4 flex flex-col min-h-0"
          aria-label="Danh sách danh mục"
        >
          <div className="mb-3 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Danh mục</h3>
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 min-h-0 no-scrollbar">
            {categories.map((category) => {
              const isActive =
                activeHoveredSlug === category.slug || selectedCategory === category.slug;
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryClick(category.slug)}
                  onMouseEnter={() => onHoverCategory(category.slug)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all min-h-[44px] ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                  role="menuitem"
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className="text-sm font-semibold">{category.name}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {activeHoveredSlug && (
          <section
            className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden"
            aria-labelledby="products-heading"
          >
            <div className="mb-4 flex items-center justify-between shrink-0 gap-2">
              <h3 id="products-heading" className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                {categories.find((c) => c.slug === activeHoveredSlug)?.name ?? "Sản phẩm"}
              </h3>
              <a
                href={`/danh-muc/${activeHoveredSlug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSeeAll(activeHoveredSlug);
                }}
                className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-0.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 overflow-y-auto flex-1 min-h-0 no-scrollbar">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="group">
                    <ProductCard
                      {...product}
                      variant="minimal"
                      onClick={() => onProductClick(product.slug)}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
                <Package className="mb-4 h-12 w-12 text-gray-200 dark:text-slate-700" aria-hidden="true" />
                <p className="text-sm text-gray-500 dark:text-slate-400">Danh mục này chưa có sản phẩm</p>
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
