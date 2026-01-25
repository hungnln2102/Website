"use client";

import { ShoppingCart, Star, TrendingUp, ShieldCheck, Zap } from "lucide-react";

import type { Database } from "@/lib/database.types";
import { roundToNearestThousand } from "@/lib/utils";
import LazyImage from "@/components/ui/LazyImage";

type Product = Database["public"]["Tables"]["products"]["Row"];

type ProductCardProps = Product & {
  package_count?: number;
  onClick: () => void;
  isCompact?: boolean;
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
  isCompact = false,
}: ProductCardProps) {
  const hasDiscount = discount_percentage > 0;
  const discountedPrice = roundToNearestThousand(base_price * (1 - discount_percentage / 100));
  const hasMultipleCodes = (package_count ?? 1) > 1;

  if (isCompact) {
    return (
      <div
        onClick={onClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div className="relative z-10 overflow-hidden rounded-[calc(1rem-4px)] bg-white dark:bg-slate-950">
          <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 dark:bg-slate-900">
            <LazyImage
              src={image_url || "https://placehold.co/600x400?text=No+Image"}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {hasDiscount && (
              <div className="absolute left-2 top-2 z-20 rounded-lg bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-lg">
                -{discount_percentage}%
              </div>
            )}
          </div>
          <div className="p-2">
            <h3 className="mb-1 line-clamp-1 text-[11px] font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100">
              {name}
            </h3>
            <div className="flex items-center justify-between border-t border-gray-50 pt-1.5 dark:border-slate-900">
              <div className="flex flex-col">
                {hasDiscount && (
                  <span className="text-[8px] font-bold text-gray-400 line-through">
                    {formatCurrency(base_price)}
                  </span>
                )}
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(discountedPrice)}
                </span>
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <ShoppingCart className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
<<<<<<< HEAD
      className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-gray-200/50 bg-white p-2 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] dark:border-slate-800 dark:bg-slate-900/50"
    >
      {/* Premium Ambient Light */}
      <div className="absolute -inset-1 z-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-indigo-600/20 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
      
      <div className="relative z-10 overflow-hidden rounded-[calc(2rem-8px)] bg-white dark:bg-slate-950">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-slate-900">
          <LazyImage
            src={image_url || "https://placehold.co/600x400?text=No+Image"}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          
          {/* Status Badges */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {hasDiscount && (
              <div className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white shadow-xl backdrop-blur-md ring-1 ring-white/20">
                <Zap className="h-3 w-3 fill-current" />
                -{discount_percentage}%
              </div>
            )}
            <div className="flex items-center gap-1 rounded-full bg-blue-600/90 px-3 py-1 text-[10px] font-bold text-white shadow-xl backdrop-blur-md ring-1 ring-white/20">
              <ShieldCheck className="h-3 w-3" />
              Chính hãng
            </div>
          </div>

          {/* Quick Action Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
            <div className="translate-y-4 rounded-2xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-blue-600 shadow-2xl transition-transform duration-300 group-hover:translate-y-0">
              Xem chi tiết
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="mb-3 flex items-center justify-start">
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 dark:bg-blue-900/30">
              <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Bán chạy</span>
            </div>
          </div>
          
          <h3 className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 md:text-base">
            {name}
          </h3>

          <div className="mb-4 flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{average_rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-300 dark:text-slate-800">/</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">{sales_count} đã bán</span>
          </div>

          <div className="flex items-end justify-between border-t border-gray-50 pt-4 dark:border-slate-900">
            <div className="flex flex-col gap-0.5">
              {hasDiscount && (
                <span className="text-[11px] font-bold text-gray-400 line-through decoration-red-500/30">
                  {formatCurrency(base_price)}
                </span>
              )}
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 md:text-xl">
                {hasMultipleCodes ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-bold text-gray-400">Từ</span>
=======
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
>>>>>>> f932458
                    <span>{formatCurrency(discountedPrice)}</span>
                  </div>
                ) : (
                  formatCurrency(discountedPrice)
                )}
              </div>
            </div>
            
            <button
<<<<<<< HEAD
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-110 hover:bg-blue-700 active:scale-95"
=======
              className="relative cursor-pointer flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 group-hover:scale-110 sm:h-10 sm:w-10 sm:rounded-xl"
>>>>>>> f932458
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <ShoppingCart className="h-5 w-5" />
<<<<<<< HEAD
=======
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
>>>>>>> f932458
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
