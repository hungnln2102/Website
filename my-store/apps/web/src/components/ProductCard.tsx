"use client";

import { ShoppingCart, Star, TrendingUp, Sparkles } from "lucide-react";

import type { Database } from "@/lib/database.types";
import { roundToNearestThousand } from "@/lib/pricing";
import LazyImage from "@/components/ui/LazyImage";

type Product = Database["public"]["Tables"]["products"]["Row"];

type ProductCardProps = Product & {
  package_count?: number;
  onClick: () => void;
  variant?: "default" | "minimal" | "deal";
  isNew?: boolean;
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
  variant = "default",
  isNew = false,
}: ProductCardProps) {
  const hasDiscount = discount_percentage > 0;
  const discountedPrice = roundToNearestThousand(base_price * (1 - discount_percentage / 100));
  const hasMultipleCodes = (package_count ?? 1) > 1;
  const isMinimal = variant === "minimal";
  const isDeal = variant === "deal";

  if (isMinimal) {
    return (
      <div
        onClick={onClick}
        className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200/40 bg-white transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-700"
      >
        <div className="relative overflow-hidden">
          <LazyImage
            src={image_url || "https://placehold.co/600x400?text=No+Image"}
            alt={`Hình ảnh sản phẩm ${name}`}
            className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-36"
          />
          {hasDiscount && (
            <div className="absolute right-2 top-2 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              -{discount_percentage}%
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
            {name}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {!hasMultipleCodes && hasDiscount && (
                <span className="text-[10px] font-medium text-gray-400 line-through">
                  {formatCurrency(base_price)}
                </span>
              )}
              <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                {hasMultipleCodes ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-medium text-gray-400">Từ</span>
                    <span>{formatCurrency(discountedPrice)}</span>
                  </div>
                ) : (
                  formatCurrency(discountedPrice)
                )}
              </div>
            </div>
            
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-700 hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              aria-label={`Xem chi tiết sản phẩm ${name}`}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cardWrapper = isDeal
    ? "group relative cursor-pointer overflow-hidden rounded-xl border border-orange-200/60 bg-white p-0.5 shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/15 dark:border-orange-900/50 dark:bg-slate-900/50 dark:hover:shadow-orange-900/20 md:p-1"
    : "group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200/60 bg-white p-0.5 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-blue-900/20 md:p-1 md:shadow-md";

  const gradientHover = isDeal
    ? "absolute inset-0 z-0 bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    : "absolute inset-0 z-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100";

  const hotBadge = isDeal ? "text-orange-500 dark:text-orange-400" : "text-blue-500 dark:text-blue-400";

  const priceColor = isDeal ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400";

  const btnClass = isDeal
    ? "bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/25 transition-all duration-300 hover:from-orange-600 hover:to-red-700 group-hover:scale-110"
    : "bg-gradient-to-br from-blue-600 to-indigo-600 transition-all duration-300 group-hover:scale-110";

  const titleHover = isDeal ? "group-hover:text-orange-600 dark:group-hover:text-orange-400" : "group-hover:text-blue-600 dark:group-hover:text-blue-400";

  return (
    <div onClick={onClick} className={cardWrapper}>
      <div className={gradientHover} />
      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[calc(0.75rem-2px)] bg-white dark:bg-slate-950">
        <div className="relative overflow-hidden">
          <LazyImage
            src={image_url || "https://placehold.co/600x400?text=No+Image"}
            alt={`Hình ảnh sản phẩm ${name}${description ? ` - ${description.substring(0, 100)}` : ''}`}
            className="h-28 w-full object-cover transition-transform duration-700 group-hover:scale-110 sm:h-40"
          />
          <div className="absolute inset-0 bg-black/5 transition-opacity group-hover:opacity-0" />
          {isDeal && (
            <div className="absolute left-3 top-3 rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              Hot Deal
            </div>
          )}
          {isNew && !isDeal && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              <Sparkles className="h-2.5 w-2.5 fill-current" />
              <span>MỚI</span>
            </div>
          )}
          {hasDiscount && (
            <div className="absolute right-3 top-3 overflow-hidden rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
              <span className="relative z-10">-{discount_percentage}%</span>
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-2 md:p-3">
          <div className="mb-1.5 flex min-h-[36px] items-start justify-between gap-2 md:mb-2 md:min-h-[28px]">
            <h3 className={`flex-1 line-clamp-2 text-xs font-black text-gray-900 transition-colors ${titleHover} dark:text-slate-100 md:line-clamp-1 md:text-sm lg:text-base`}>
              {name}
            </h3>
            {(sales_count > 50 || hasDiscount) && (
              <div className={`flex shrink-0 items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${hotBadge} md:text-[10px] opacity-80`} aria-label="Sản phẩm hot">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                <span>HOT</span>
              </div>
            )}
          </div>

          <div className="mb-2 flex min-h-[18px] items-center justify-between gap-1 text-[10px] sm:mb-3 md:min-h-[20px] md:text-xs font-semibold">
            <div className="flex items-center gap-1" aria-label={`Đánh giá ${average_rating.toFixed(1)} sao`}>
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 sm:h-3 sm:w-3" aria-hidden="true" />
              <span className="text-yellow-700 dark:text-yellow-500">{average_rating.toFixed(1)}</span>
            </div>
            <div className="ml-auto flex items-center gap-1 text-gray-400">
              <span className="dark:text-slate-500">{sales_count >= 1000 ? `${(sales_count / 1000).toFixed(1)}k` : sales_count} đã bán</span>
            </div>
          </div>

          <div className="mt-auto flex min-h-[56px] items-end justify-between border-t border-gray-50 pt-2 dark:border-slate-900">
            <div className="flex flex-col justify-end">
              {!hasMultipleCodes && hasDiscount && (
                <span className="mb-0.5 text-[10px] font-medium text-gray-400 line-through decoration-red-400/50">
                  {formatCurrency(base_price)}
                </span>
              )}
              <div className={`text-sm font-black tracking-tight sm:text-lg ${priceColor}`}>
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
              className={`relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg text-white shadow-lg sm:h-10 sm:w-10 sm:rounded-xl ${btnClass}`}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              aria-label={`Xem chi tiết sản phẩm ${name}`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
