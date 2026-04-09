"use client";

import type { CategoryItem } from "../hooks/useCategoryMegaMenu";
import { CategoryNavRail, CategoryProductsFlyout } from "./categoryExploreParts";

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
  onMouseEnter,
  onMouseLeave,
  onBackdropClick,
}: CategoryMegaMenuProps) {
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    top: position.top > 0 ? `${position.top}px` : "auto",
    left: isMobile ? 8 : position.left > 0 ? Math.max(8, position.left) : 8,
    right: isMobile ? 8 : "auto",
    width: isMobile ? undefined : "min(1120px, calc(100vw - 24px))",
    maxHeight: `calc(100vh - ${position.top > 0 ? position.top + 16 : 80}px)`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <aside
      ref={menuRef}
      className={`fixed z-[9999] rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)] dark:border-slate-600/60 dark:bg-slate-900 dark:shadow-slate-950/50 ${
        isMobile ? "w-[calc(100vw-1rem)] max-w-none" : ""
      }`}
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
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(220px,240px)_1fr]">
        <CategoryNavRail
          categories={categories}
          activeHoveredSlug={activeHoveredSlug}
          selectedCategory={selectedCategory}
          onHoverCategory={onHoverCategory}
          onCategoryClick={onCategoryClick}
        />
        <CategoryProductsFlyout
          activeHoveredSlug={activeHoveredSlug}
          categories={categories}
          filteredProducts={filteredProducts}
          onProductClick={onProductClick}
          onSeeAll={onSeeAll}
          className="border-t border-gray-100 lg:border-t-0 lg:border-l dark:border-slate-700/80"
        />
      </div>
    </aside>
  );
}
