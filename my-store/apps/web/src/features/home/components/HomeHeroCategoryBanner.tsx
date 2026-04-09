"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCategoryMegaMenu } from "@/features/catalog/hooks/useCategoryMegaMenu";
import { CategoryNavRail, CategoryProductsFlyout } from "@/features/catalog/components/categoryExploreParts";
import { ROUTES } from "@/lib/constants";
import type { CategoryUI } from "../hooks/useHomeData";

const HOVER_LEAVE_MS = 220;

interface HomeHeroCategoryBannerProps {
  categories: CategoryUI[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  onProductClick: (slug: string) => void;
  children: React.ReactNode;
}

export function HomeHeroCategoryBanner({
  categories,
  selectedCategory,
  onSelectCategory,
  onProductClick,
  children,
}: HomeHeroCategoryBannerProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryItems = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
  }));

  const { filteredProducts, activeHoveredSlug } = useCategoryMegaMenu(
    categoryItems,
    null,
    hoveredSlug,
    { noDefaultActive: true }
  );

  const cancelLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const scheduleClearHover = useCallback(() => {
    cancelLeave();
    leaveTimer.current = setTimeout(() => setHoveredSlug(null), HOVER_LEAVE_MS);
  }, [cancelLeave]);

  useEffect(() => () => cancelLeave(), [cancelLeave]);

  const handleCategoryClick = (slug: string | null) => {
    if (!slug) return;
    onSelectCategory(slug);
    window.history.pushState({}, "", ROUTES.category(slug));
    window.dispatchEvent(new Event("popstate"));
  };

  const handleSeeAll = (slug: string) => {
    onSelectCategory(slug);
    window.history.pushState({}, "", ROUTES.category(slug));
    window.dispatchEvent(new Event("popstate"));
  };

  if (categories.length === 0) {
    return <div className="min-w-0 flex-1 overflow-hidden">{children}</div>;
  }

  const railActiveSlug = hoveredSlug ?? selectedCategory ?? null;
  const showFlyout = hoveredSlug != null && activeHoveredSlug != null;

  return (
    <div
      className="flex flex-col gap-3 lg:flex-row lg:items-stretch"
      onMouseEnter={cancelLeave}
      onMouseLeave={scheduleClearHover}
    >
      <div className="relative z-30 hidden min-h-0 w-full shrink-0 lg:flex lg:min-h-[320px] lg:w-[240px] lg:flex-col">
        <CategoryNavRail
          categories={categoryItems}
          activeHoveredSlug={railActiveSlug}
          selectedCategory={selectedCategory}
          onHoverCategory={(slug) => {
            cancelLeave();
            setHoveredSlug(slug);
          }}
          onCategoryClick={handleCategoryClick}
          dense
        />
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl shadow-lg shadow-blue-900/5 sm:rounded-2xl sm:shadow-xl">
        <div className="relative flex min-h-[240px] flex-1 flex-col sm:min-h-[280px] md:min-h-[320px] lg:min-h-[320px]">
          {showFlyout ? (
            <div
              id="home-category-flyout"
              className="pointer-events-auto absolute inset-0 z-50 hidden overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-inner sm:rounded-2xl lg:block dark:border-slate-600/60 dark:bg-slate-900"
              role="region"
              aria-label="Sản phẩm theo danh mục"
            >
              <CategoryProductsFlyout
                activeHoveredSlug={activeHoveredSlug}
                categories={categoryItems}
                filteredProducts={filteredProducts}
                onProductClick={onProductClick}
                onSeeAll={handleSeeAll}
                fillContainer
                className="rounded-none border-0 shadow-none"
              />
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
