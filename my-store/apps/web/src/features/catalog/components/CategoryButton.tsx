"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Layers, ChevronRight } from "lucide-react";
import { useCategoryMegaMenu } from "../hooks/useCategoryMegaMenu";
import { CategoryMegaMenu } from "./CategoryMegaMenu";

interface CategoryButtonProps {
  categories?: Array<{ id: string; name: string; slug: string; icon?: string | null }>;
  selectedCategory?: string | null;
  onSelectCategory?: (slug: string | null) => void;
}

const CLOSE_DELAY_MS = 200;

export default function CategoryButton({
  categories: propsCategories,
  selectedCategory: propsSelectedCategory,
  onSelectCategory,
}: CategoryButtonProps) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [hoveredCategorySlug, setHoveredCategorySlug] = useState<string | null>(null);
  const [megaMenuTop, setMegaMenuTop] = useState(0);
  const [megaMenuLeft, setMegaMenuLeft] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { categories, activeHoveredSlug, filteredProducts } = useCategoryMegaMenu(
    propsCategories,
    propsSelectedCategory,
    hoveredCategorySlug
  );

  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setIsMobile(window.innerWidth < 1024);
      setMegaMenuTop(rect.bottom + 4);
      setMegaMenuLeft(rect.left);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (isMegaMenuOpen) updateMenuPosition();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMegaMenuOpen, updateMenuPosition]);

  const handleCategoryClick = useCallback(
    (slug: string | null) => {
      if (onSelectCategory && slug) {
        onSelectCategory(slug);
        window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(slug)}`);
        window.dispatchEvent(new Event("popstate"));
      }
      setIsMegaMenuOpen(false);
    },
    [onSelectCategory]
  );

  const handleProductClick = useCallback((slug: string) => {
    window.history.pushState({}, "", `/${encodeURIComponent(slug)}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setIsMegaMenuOpen(false);
  }, []);

  const handleSeeAll = useCallback(
    (slug: string) => {
      onSelectCategory?.(slug);
      window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(slug)}`);
      window.dispatchEvent(new Event("popstate"));
      setIsMegaMenuOpen(false);
    },
    [onSelectCategory]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsMegaMenuOpen(false);
        setHoveredCategorySlug(null);
      }
    };
    if (isMegaMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMegaMenuOpen]);

  useEffect(() => {
    if (!isMegaMenuOpen) return;
    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [isMegaMenuOpen, updateMenuPosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const scheduleClose = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
      setHoveredCategorySlug(null);
    }, CLOSE_DELAY_MS);
  };
  const cancelClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <div
      ref={buttonRef}
      className="group relative z-50"
      onMouseEnter={() => {
        cancelClose();
        updateMenuPosition();
        setIsMegaMenuOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={() => {
          updateMenuPosition();
          setIsMegaMenuOpen((open) => !open);
        }}
        className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 sm:px-4 min-h-[44px] ${
          isMegaMenuOpen
            ? "bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 shadow-md shadow-blue-200/50 dark:from-blue-900/30 dark:to-blue-900/20 dark:text-blue-400 dark:shadow-blue-900/50"
            : "hover:bg-white hover:shadow-md hover:shadow-gray-200/50 dark:hover:bg-slate-800/80 dark:hover:shadow-slate-900/50 active:scale-[0.98]"
        }`}
        aria-expanded={isMegaMenuOpen}
        aria-haspopup="true"
      >
        <Layers
          className={`h-4 w-4 sm:h-4 sm:w-4 shrink-0 transition-all duration-300 ${
            isMegaMenuOpen ? "text-blue-600 dark:text-blue-400 scale-110" : "text-gray-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 group-hover:scale-110"
          }`}
        />
        <span
          className={`text-xs sm:text-sm font-bold tracking-tight transition-colors duration-300 whitespace-nowrap ${
            isMegaMenuOpen ? "text-blue-700 dark:text-blue-400" : "text-gray-700 group-hover:text-blue-700 dark:text-slate-300 dark:group-hover:text-blue-300"
          }`}
        >
          DANH MỤC
        </span>
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 transition-all duration-300 ${
            isMegaMenuOpen ? "rotate-90 text-blue-600 dark:text-blue-400 scale-110" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300"
          }`}
          aria-hidden="true"
        />
      </button>

      {isMegaMenuOpen && categories.length > 0 &&
        createPortal(
          <CategoryMegaMenu
            categories={categories}
            filteredProducts={filteredProducts}
            activeHoveredSlug={activeHoveredSlug}
            selectedCategory={propsSelectedCategory ?? null}
            menuRef={menuRef}
            position={{
              top: megaMenuTop,
              left: isMobile ? 8 : megaMenuLeft,
            }}
            isMobile={isMobile}
            onCategoryClick={handleCategoryClick}
            onProductClick={handleProductClick}
            onSeeAll={handleSeeAll}
            onHoverCategory={setHoveredCategorySlug}
            onSelectCategory={onSelectCategory}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onBackdropClick={() => setIsMegaMenuOpen(false)}
          />,
          document.body
        )}
    </div>
  );
}
