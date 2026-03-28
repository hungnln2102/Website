"use client";

import { Star } from "lucide-react";

import ProductTag from "@/components/ProductTag";
import LazyImage from "@/components/ui/LazyImage";
import type { Database } from "@/lib/database.types";
import { roundToNearestThousand } from "@/lib/pricing";

type Product = Database["public"]["Tables"]["products"]["Row"];

type ProductCardProps = Product & {
  package?: string | null;
  package_product?: string | null;
  package_count?: number;
  from_price?: number;
  onClick: () => void;
  variant?: "default" | "minimal" | "deal";
  hidePriceAndDescription?: boolean;
  isNew?: boolean;
  sold_count_30d?: number;
  is_active?: boolean;
};

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

export default function ProductCard({
  name,
  description,
  base_price,
  from_price,
  image_url,
  discount_percentage,
  sales_count,
  average_rating,
  package_count,
  onClick,
  variant = "default",
  hidePriceAndDescription = false,
  isNew = false,
  sold_count_30d = 0,
  is_active = true,
}: ProductCardProps) {
  const displayPrice = (from_price != null ? from_price : base_price) || 0;
  const hasDiscount = discount_percentage > 0;
  const discountedPrice = roundToNearestThousand(displayPrice * (1 - discount_percentage / 100));
  const hasMultipleCodes = (package_count ?? 1) > 1;
  const showContact = displayPrice === 0;
  const isMinimal = variant === "minimal";
  const isDeal = variant === "deal";
  const isOutOfStock = !is_active;

  const shortDescription =
    description && description.trim().length > 0
      ? description.length <= 120
        ? description
        : `${description.slice(0, 117).trim()}...`
      : null;

  const hasVisibleDescription =
    !hidePriceAndDescription &&
    Boolean(shortDescription && shortDescription.trim() && shortDescription !== "Chưa có mô tả");

  const sold30d = sold_count_30d ?? 0;
  const isBestSeller = sold30d > 10 && !isOutOfStock;
  const isHot = sold30d >= 5 && sold30d <= 10 && !isOutOfStock;

  if (isMinimal) {
    return (
      <div
        onClick={onClick}
        className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200/40 bg-white transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-700"
      >
        <div className="relative aspect-square overflow-hidden">
          <LazyImage
            src={image_url || "https://placehold.co/400x400?text=No+Image"}
            alt={`Hình ảnh sản phẩm ${name}`}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {hasDiscount && (
            <div className="absolute right-2 top-2 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              -{discount_percentage}%
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="product-card__title product-card__title--minimal mb-1 text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
            {name}
          </h3>

          {hasVisibleDescription && (
            <p className="mb-2 line-clamp-2 text-[11px] leading-tight text-gray-500 dark:text-slate-400">
              {shortDescription}
            </p>
          )}

          {!hidePriceAndDescription && (
            <div className="flex flex-col">
              {!showContact && !hasMultipleCodes && hasDiscount && (
                <span className="text-[10px] font-medium text-gray-500 line-through">
                  {formatCurrency(displayPrice)}
                </span>
              )}
              <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                {showContact ? (
                  "Liên hệ"
                ) : hasMultipleCodes ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-medium text-gray-500">Từ</span>
                    <span>{formatCurrency(discountedPrice)}</span>
                  </div>
                ) : (
                  formatCurrency(discountedPrice)
                )}
              </div>
            </div>
          )}
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

  const priceColor = isDeal ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400";
  const titleHover = isDeal
    ? "group-hover:text-orange-600 dark:group-hover:text-orange-400"
    : "group-hover:text-blue-600 dark:group-hover:text-blue-400";

  return (
    <div onClick={onClick} className={cardWrapper}>
      <div className={gradientHover} />
      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[calc(0.75rem-2px)] bg-white dark:bg-slate-950">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: isDeal ? "4/3" : "1/1" }}>
          <LazyImage
            src={image_url || "https://placehold.co/400x400?text=No+Image"}
            alt={`Hình ảnh sản phẩm ${name}${description ? ` - ${description.substring(0, 100)}` : ""}`}
            width={400}
            height={400}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5 transition-opacity group-hover:opacity-0" />

          <div className="absolute left-2 top-2 z-30">
            {isOutOfStock && (
              <div className="rounded-md bg-gradient-to-r from-gray-600 to-gray-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                Hết hàng
              </div>
            )}
            {isBestSeller && !isOutOfStock && <ProductTag type="best-selling" />}
            {isHot && !isBestSeller && !isOutOfStock && <ProductTag type="hot" />}
            {isNew && !isHot && !isBestSeller && !isDeal && !isOutOfStock && (
              <ProductTag type="new" />
            )}
            {isDeal && !isBestSeller && !isHot && !isOutOfStock && (
              <div className="rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                Hot Deal
              </div>
            )}
          </div>

          {isOutOfStock && <div className="absolute inset-0 z-20 bg-black/40" />}

          {hasDiscount && (
            <div className="absolute right-3 top-3 z-30 overflow-hidden rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
              <span className="relative z-10">-{discount_percentage}%</span>
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-2 md:p-3">
          <div
            className={`flex items-start justify-between gap-1 ${
              hasVisibleDescription ? "mb-1.5 min-h-[44px] md:mb-2" : "mb-1 min-h-[34px]"
            }`}
          >
            <h3
              className={`product-card__title product-card__title--default flex-1 text-gray-800 transition-colors ${titleHover} dark:text-slate-200`}
            >
              {name}
            </h3>
          </div>

          {hasVisibleDescription && (
            <div className="mb-2 flex min-h-[30px] items-start text-[11px] leading-snug text-gray-500 dark:text-slate-400 md:text-xs">
              <p className="line-clamp-2">{shortDescription}</p>
            </div>
          )}

          {!hidePriceAndDescription && (
            <div
              className={`flex items-center justify-between gap-1 text-[10px] font-semibold md:text-xs ${
                hasVisibleDescription ? "mb-2 sm:mb-3" : "mb-1.5 sm:mb-2"
              }`}
            >
              <div className="flex items-center gap-1" aria-label={`Đánh giá ${average_rating.toFixed(1)} sao`}>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                <span className="text-yellow-700 dark:text-yellow-500">{average_rating.toFixed(1)}</span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-gray-500 dark:text-slate-400">
                <span>{sales_count >= 1000 ? `${(sales_count / 1000).toFixed(1)}k` : sales_count} đã bán</span>
              </div>
            </div>
          )}

          {!hidePriceAndDescription && (
            <div
              className={`mt-auto flex items-end border-t border-gray-50 dark:border-slate-800/50 ${
                hasVisibleDescription ? "min-h-[64px] pt-2" : "min-h-[52px] pt-1.5"
              }`}
            >
              <div className="flex flex-col justify-end">
                {!showContact && !hasMultipleCodes && hasDiscount && (
                  <span className="mb-0.5 text-[11px] font-medium text-gray-500 line-through decoration-red-400/50">
                    {formatCurrency(displayPrice)}
                  </span>
                )}
                <div className={`text-lg font-black tracking-tight sm:text-xl md:text-2xl ${priceColor}`}>
                  {showContact ? (
                    "Liên hệ"
                  ) : hasMultipleCodes ? (
                    <div className="flex items-baseline gap-0.5 sm:gap-1">
                      <span className="text-[10px] font-medium text-gray-500 sm:text-xs">Từ</span>
                      <span>{formatCurrency(discountedPrice)}</span>
                    </div>
                  ) : (
                    formatCurrency(discountedPrice)
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
