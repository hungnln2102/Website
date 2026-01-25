"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "@/lib/database.types";
import ProductCard from "./ProductCard";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface PromotionCarouselProps {
  products: Product[];
  onProductClick: (slug: string) => void;
  /** Use "deal" for Deal Sốc Hôm Nay, "default" for other carousels (e.g. Sản Phẩm Mới) */
  variant?: "deal" | "default";
  /** Mark all products as new (shows NEW badge) */
  markAsNew?: boolean;
}

const CARD_WIDTH = 320;
const GAP = 16;

export default function PromotionCarousel({ products, onProductClick, variant = "default", markAsNew = false }: PromotionCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [products.length, updateScrollState]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = CARD_WIDTH + GAP;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className="group/carousel relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-1 pb-2 pt-1 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        role="region"
        aria-label={variant === "deal" ? "Carousel khuyến mãi" : "Carousel sản phẩm"}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[min(85vw,320px)] shrink-0 snap-start sm:w-[300px] lg:w-[320px]"
          >
            <ProductCard
              {...product}
              onClick={() => onProductClick(product.slug)}
              variant={variant === "deal" ? "deal" : "default"}
              isNew={markAsNew}
            />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft}
            className={`absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/95 text-gray-900 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all hover:scale-105 disabled:pointer-events-none disabled:opacity-30 dark:bg-slate-800/95 dark:text-white dark:ring-white/10 sm:left-3 ${
              variant === "deal"
                ? "hover:bg-white hover:text-orange-600 dark:hover:bg-slate-700 dark:hover:text-orange-400"
                : "hover:bg-white hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400"
            }`}
            aria-label={variant === "deal" ? "Xem deal trước" : "Sản phẩm trước"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight}
            className={`absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/95 text-gray-900 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all hover:scale-105 disabled:pointer-events-none disabled:opacity-30 dark:bg-slate-800/95 dark:text-white dark:ring-white/10 sm:right-3 ${
              variant === "deal"
                ? "hover:bg-white hover:text-orange-600 dark:hover:bg-slate-700 dark:hover:text-orange-400"
                : "hover:bg-white hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400"
            }`}
            aria-label={variant === "deal" ? "Xem deal tiếp theo" : "Sản phẩm tiếp theo"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
