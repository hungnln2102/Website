"use client";

import { ShoppingCart, Star, TrendingUp } from "lucide-react";

import type { Database } from "@/lib/database.types";
import { roundToNearestThousand } from "@/lib/pricing";

type Product = Database["public"]["Tables"]["products"]["Row"];

type ProductCardProps = Product & {
  package_count?: number;
  onClick: () => void;
};

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

export default function ProductCard({
  name,
  description,
  base_price,
  image_url,
  discount_percentage,
  sales_count,
  average_rating,
  package_count,
  onClick,
}: ProductCardProps) {
  const hasDiscount = discount_percentage > 0;
  const discountedPrice = roundToNearestThousand(base_price * (1 - discount_percentage / 100));
  const hasMultipleCodes = (package_count ?? 1) > 1;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200/60 bg-white p-0.5 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-blue-900/20 md:p-1 md:shadow-md"
    >
      {/* Premium Gradient Border on Hover */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="relative z-10 overflow-hidden rounded-[calc(0.75rem-2px)] bg-white dark:bg-slate-950">
        <div className="relative overflow-hidden">
          <img
            src={image_url || "https://placehold.co/600x400?text=No+Image"}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-32 w-full object-cover transition-transform duration-700 group-hover:scale-110 sm:h-48"
          />
          <div className="absolute inset-0 bg-black/5 transition-opacity group-hover:opacity-0" />
          
          {hasDiscount && (
            <div className="absolute right-3 top-3 overflow-hidden rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
              <span className="relative z-10">-{discount_percentage}%</span>
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>
          )}
        </div>

        <div className="p-2.5 md:p-4">
          <div className="mb-1.5 flex items-center justify-end text-[9px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 md:mb-2 md:text-[10px]">
             <div className="flex items-center gap-1 opacity-70">
                <TrendingUp className="h-3 w-3" />
                <span>HOT</span>
             </div>
          </div>
          
          <h3 className="mb-1 line-clamp-2 text-xs font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 md:mb-2 md:line-clamp-1 md:text-sm lg:text-base">
            {name}
          </h3>
          <p className="hidden mb-4 line-clamp-2 h-10 text-xs leading-relaxed text-gray-500 dark:text-slate-400 md:block">{description}</p>

          <div className="mb-3 flex items-center justify-between gap-1 text-[10px] sm:mb-4 sm:justify-start sm:gap-4 md:text-xs font-semibold">
            <div className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 sm:h-3 sm:w-3" />
              <span className="text-yellow-700 dark:text-yellow-500">{average_rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="dark:text-slate-500">{sales_count >= 1000 ? `${(sales_count / 1000).toFixed(1)}k` : sales_count} đã bán</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-900">
            <div className="flex flex-col">
              {!hasMultipleCodes && hasDiscount && (
                <span className="text-[10px] font-medium text-gray-400 line-through decoration-red-400/50">
                  {formatCurrency(base_price)}
                </span>
              )}
              <div className="text-sm font-black tracking-tight text-blue-600 dark:text-blue-400 sm:text-lg">
                {hasMultipleCodes ? (
                  <div className="flex items-baseline gap-0.5 sm:gap-1">
                    <span className="text-[9px] font-medium text-gray-400 sm:text-[10px]">Từ</span>
                    <span>{formatCurrency(discountedPrice)}</span>
                  </div>
                ) : (
                  formatCurrency(discountedPrice)
                )}
              </div>
            </div>
            
            <button
              className="relative cursor-pointer flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 group-hover:scale-110 sm:h-10 sm:w-10 sm:rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
