"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Box,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Layers,
  Monitor,
  Mouse,
  Package,
  Printer,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tablet,
  ChevronRight,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { CategoryItem } from "../hooks/useCategoryMegaMenu";

const CATEGORY_ICONS: LucideIcon[] = [
  Laptop,
  Monitor,
  Cpu,
  HardDrive,
  Keyboard,
  Mouse,
  Headphones,
  Package,
  Layers,
  Box,
  ShoppingBag,
  Sparkles,
  Tablet,
  Smartphone,
  Printer,
  Gamepad2,
];

export function iconForCategorySlug(slug: string): LucideIcon {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h + slug.charCodeAt(i) * (i + 1)) % CATEGORY_ICONS.length;
  }
  return CATEGORY_ICONS[h] ?? Package;
}

type ProductCardPayload = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  image_url: string | null;
  discount_percentage: number;
  [key: string]: unknown;
};

export function CategoryNavRail({
  categories,
  activeHoveredSlug,
  selectedCategory,
  onHoverCategory,
  onCategoryClick,
  dense = false,
}: {
  categories: CategoryItem[];
  activeHoveredSlug: string | null;
  selectedCategory: string | null;
  onHoverCategory: (slug: string) => void;
  onCategoryClick: (slug: string | null) => void;
  /** Sidebar trang chủ (cao hơn, chỉ icon + chữ gọn). */
  dense?: boolean;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col border-gray-100 dark:border-slate-700/80 ${
        dense
          ? "h-full min-h-0 w-full flex-1 rounded-2xl border bg-white p-2 shadow-sm dark:bg-slate-900"
          : "border-r p-3 sm:p-4"
      }`}
      aria-label="Danh sách danh mục"
    >
      {!dense && (
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Danh mục</h3>
        </div>
      )}
      <div
        className={`no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto ${
          dense ? "max-h-[280px] lg:max-h-none lg:min-h-0" : ""
        }`}
      >
        {categories.map((category) => {
          const isActive =
            activeHoveredSlug === category.slug || selectedCategory === category.slug;
          const Icon = iconForCategorySlug(category.slug);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryClick(category.slug)}
              onMouseEnter={() => onHoverCategory(category.slug)}
              onFocus={() => onHoverCategory(category.slug)}
              className={`flex min-h-[40px] w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                isActive
                  ? "bg-sky-50 text-sky-800 shadow-[inset_3px_0_0_0] shadow-sky-500 dark:bg-sky-950/50 dark:text-sky-200 dark:shadow-sky-400"
                  : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800/80"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-sky-600 dark:text-sky-400" : "text-gray-400 dark:text-slate-500"
                }`}
                aria-hidden
              />
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{category.name}</span>
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-gray-300 transition-transform dark:text-slate-600 ${
                  isActive ? "translate-x-0.5 text-sky-500 dark:text-sky-400" : ""
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CategoryProductsFlyout({
  activeHoveredSlug,
  categories,
  filteredProducts,
  onProductClick,
  onSeeAll,
  className = "",
  /** Phủ kín ô cha (hero): grid kéo dọc, không giới hạn 360px. */
  fillContainer = false,
}: {
  activeHoveredSlug: string | null;
  categories: CategoryItem[];
  filteredProducts: ProductCardPayload[];
  onProductClick: (slug: string) => void;
  onSeeAll: (slug: string) => void;
  /** Panel bên cạnh sidebar: thêm shadow/border */
  className?: string;
  fillContainer?: boolean;
}) {
  const title = categories.find((c) => c.slug === activeHoveredSlug)?.name ?? "Sản phẩm";

  const gridClass = fillContainer
    ? "min-h-0 flex-1 auto-rows-min grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6"
    : "max-h-[min(360px,calc(100vh-220px))] grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 xl:grid-cols-5";

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-900 ${fillContainer ? "h-full" : ""} ${className}`}
      aria-labelledby="category-flyout-heading"
    >
      <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${fillContainer ? "p-3 sm:p-4" : "p-4 sm:p-5"}`}>
        <div
          className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-700/80 ${fillContainer ? "mb-3 pb-2" : "mb-4 pb-3"}`}
        >
          <h3
            id="category-flyout-heading"
            className={`font-bold tracking-tight text-sky-700 dark:text-sky-400 ${fillContainer ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}
          >
            {title}
          </h3>
          {activeHoveredSlug ? (
            <button
              type="button"
              onClick={() => onSeeAll(activeHoveredSlug)}
              className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50 sm:text-sm"
            >
              Xem tất cả
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          ) : null}
        </div>
        {filteredProducts.length > 0 ? (
          <div className={`no-scrollbar grid overflow-y-auto ${gridClass}`}>
            {filteredProducts.map((product) => (
              <article key={product.id} className="min-w-0">
                <ProductCard
                  {...product}
                  variant="minimal"
                  compact
                  hidePriceAndDescription
                  onClick={() => onProductClick(product.slug)}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center" role="status">
            <Package className="mb-3 h-10 w-10 text-gray-200 dark:text-slate-700" aria-hidden />
            <p className="text-sm text-gray-500 dark:text-slate-400">Danh mục này chưa có sản phẩm</p>
          </div>
        )}
      </div>
    </section>
  );
}
