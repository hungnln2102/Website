"use client";

import { useEffect, useState, useMemo } from "react";

import { ChevronLeft, ChevronRight, ShoppingCart, Star, TrendingUp, Zap, ArrowRight, Flame } from "lucide-react";

import type { Database } from "@/lib/database.types";
import { roundToNearestThousand } from "@/lib/utils";
import type { NormalizedProduct } from "@/hooks/useProducts";
import LazyImage from "@/components/ui/LazyImage";

type Product = Database["public"]["Tables"]["products"]["Row"] | NormalizedProduct;

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

function FlashDealCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const discountedPrice = roundToNearestThousand(product.base_price * (1 - product.discount_percentage / 100));
  
  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white p-2 transition-all duration-500 hover:-translate-y-2 dark:bg-slate-900 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.25)]"
    >
      {/* Dynamic Glow Overlay */}
      <div className="absolute -inset-2 z-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-20" />
      
      <div className="relative z-10 overflow-hidden rounded-[calc(1.5rem-8px)] bg-white dark:bg-slate-950">
        <div className="relative aspect-[4/3] overflow-hidden">
          <LazyImage
            src={product.image_url || "https://placehold.co/600x400?text=No+Image"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          
          {/* Glassmorphism Badge */}
          <div className="absolute left-3 top-3 overflow-hidden rounded-2xl bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xl ring-1 ring-white/20">
            <span className="relative z-10 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 fill-current animate-pulse" />
              -{product.discount_percentage}%
            </span>
          </div>

          {/* Sold Out Warning Overlay (Subtle) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="mb-2 line-clamp-1 text-sm font-bold text-gray-900 transition-colors group-hover:text-red-600 dark:text-slate-100 dark:group-hover:text-red-500 md:text-base">
            {product.name}
          </h3>

          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-red-600 dark:text-red-500">
                  {formatCurrency(discountedPrice)}
                </span>
                <span className="text-[11px] font-bold text-gray-400 line-through decoration-red-600/30">
                  {formatCurrency(product.base_price)}
                </span>
             </div>
          </div>

          <button
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:bg-red-700 hover:shadow-red-600/40 active:scale-95 group-hover:translate-y-0"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            Chốt deal ngay
          </button>
        </div>
      </div>
    </div>
  );
}

interface PromotionCarouselProps {
  products: Product[];
  onProductClick: (slug: string) => void;
  onViewAll?: () => void;
}

export default function PromotionCarousel({ products, onProductClick, onViewAll }: PromotionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1); // One card on mobile for impact
      } else if (window.innerWidth < 768) {
        setItemsPerView(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3);
      } else if (window.innerWidth < 1280) {
        setItemsPerView(4);
      } else {
        setItemsPerView(4); // Keep it focused
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        const maxIndex = Math.max(0, products.length - itemsPerView);
        return nextIndex > maxIndex ? 0 : nextIndex;
      });
    }, 8000); // Slower carousel for readability

    return () => clearInterval(interval);
  }, [products.length, itemsPerView]);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => {
    const maxIndex = Math.max(0, products.length - itemsPerView);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const maxIndex = Math.max(0, products.length - itemsPerView);
  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <div className="relative">
      {/* Section Background Decoration */}
      <div className="absolute -inset-4 z-0 rounded-[3rem] bg-red-50/50 dark:bg-red-950/10 blur-3xl opacity-50" />

      <div className="relative z-10 mb-8 flex items-center justify-between px-2 sm:px-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-2xl bg-red-600 opacity-20" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-xl shadow-red-500/30">
              <Flame className="h-7 w-7" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              DEAL SỐC <span className="text-red-600">HÔM NAY</span>
            </h2>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 sm:text-xs">
              Ưu đãi giới hạn mỗi ngày
            </p>
          </div>
        </div>
        
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="group flex cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-600 transition-all duration-300 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
          >
            Xem tất cả <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>

      <div className="group/carousel relative z-10">
        <div className="overflow-visible px-1 py-4">
          <div className={`grid grid-cols-1 gap-6 transition-all duration-700 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}>
            {visibleProducts.map((product) => (
              <FlashDealCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product.slug)}
              />
            ))}
          </div>
        </div>

        {products.length > itemsPerView && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="absolute -left-6 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-2xl transition-all hover:bg-red-600 hover:text-white disabled:opacity-0 cursor-pointer group-hover/carousel:translate-x-0 sm:-translate-x-2"
              aria-label="Sản phẩm trước"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="absolute -right-6 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-2xl transition-all hover:bg-red-600 hover:text-white disabled:opacity-0 cursor-pointer group-hover/carousel:translate-x-0 sm:translate-x-2"
              aria-label="Sản phẩm tiếp theo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <div className="mt-10 flex justify-center gap-3">
        {[...Array(maxIndex + 1)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 cursor-pointer rounded-full transition-all duration-500 ${
              i === currentIndex
                ? "w-12 bg-red-600 shadow-lg shadow-red-600/50"
                : "w-2 bg-gray-300 hover:bg-red-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
