"use client";

import { ShoppingCart, Sparkles, Star, Tag, TrendingUp, Zap } from "lucide-react";

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
  /** Dùng với variant minimal: thẻ nhỏ gọn (panel danh mục). */
  compact?: boolean;
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
  compact = false,
  hidePriceAndDescription = false,
  isNew = false,
  sold_count_30d = 0,
  is_active = true,
}: ProductCardProps) {
  const displayPrice = (from_price != null ? from_price : base_price) || 0;
  const discountPercent = Number(discount_percentage ?? 0);
  const hasDiscount = discountPercent > 0;
  const discountedPrice = roundToNearestThousand(displayPrice * (1 - discountPercent / 100));
  const hasMultipleCodes = (package_count ?? 1) > 1;
  const showContact = displayPrice === 0;
  const isMinimal = variant === "minimal";
  const isDeal = variant === "deal";
  const isOutOfStock = !is_active;
  const safeRating = Number(average_rating ?? 0);
  const safeSalesCount = Number(sales_count ?? 0);
  const actionButtonLabel = isOutOfStock ? "HẾT HÀNG" : "CHỌN GÓI";

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

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onClick();
  };

  const renderStatusBadge = () => {
    if (isOutOfStock) {
      return (
        <div className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-gray-600 to-gray-700 px-2 py-0.75 text-[8px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
          Hết hàng
        </div>
      );
    }

    if (isBestSeller) {
      return (
        <div className="badge-bestselling inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.75 text-[8px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
          <Zap className="h-2.5 w-2.5 fill-current" />
          BEST SELLING
        </div>
      );
    }

    if (isHot) {
      return (
        <div className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-2 py-0.75 text-[8px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
          <TrendingUp className="h-2.5 w-2.5" />
          HOT
        </div>
      );
    }

    if (isNew && !isDeal) {
      return (
        <div className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-0.75 text-[8px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
          <Sparkles className="h-2.5 w-2.5" />
          NEW
        </div>
      );
    }

    if (isDeal) {
      return (
        <div className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-0.75 text-[8px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
          <Tag className="h-2.5 w-2.5" />
          HOT DEAL
        </div>
      );
    }

    return null;
  };

  if (isMinimal) {
    return (
      <div
        onClick={onClick}
        className={`group relative cursor-pointer overflow-hidden border border-gray-200/40 bg-white transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-700 ${
          compact ? "rounded-md shadow-sm hover:shadow" : "rounded-lg hover:shadow-md"
        }`}
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
            <div
              className={`absolute rounded bg-red-500 font-bold text-white ${
                compact ? "right-0.5 top-0.5 px-1 py-px text-[8px] leading-none" : "right-2 top-2 rounded-md px-2 py-0.5 text-[10px]"
              }`}
            >
              -{discount_percentage}%
            </div>
          )}
        </div>

        <div
          className={
            compact
              ? "flex min-h-[2.25rem] flex-col justify-center px-2 py-2"
              : "p-3"
          }
        >
          <h3
            className={`product-card__title product-card__title--minimal text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 ${
              compact ? "product-card__title--minimal-compact line-clamp-2" : "mb-1"
            }`}
          >
            {name}
          </h3>

          {hasVisibleDescription && (
            <p
              className={`line-clamp-2 leading-tight text-gray-500 dark:text-slate-400 ${
                compact ? "mb-0 text-[10px]" : "mb-2 text-[11px]"
              }`}
            >
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
    ? "group relative mx-auto w-full max-w-[13.5rem] cursor-pointer overflow-hidden rounded-[1.1rem] border border-orange-500/20 bg-white p-[1.5px] shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/25 dark:border-orange-800/30 dark:bg-slate-900/50 dark:hover:border-orange-600/50 dark:hover:shadow-orange-900/30"
    : "group relative mx-auto w-full max-w-[13.5rem] cursor-pointer overflow-hidden rounded-[1.1rem] border border-white/5 bg-white p-[1.5px] shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/20 dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:border-indigo-500/40 dark:hover:shadow-indigo-900/30";

  const gradientHover = isDeal
    ? "absolute inset-0 z-0 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    : "absolute inset-0 z-0 bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100";

  const priceColor = isDeal ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400";
  const titleHover = isDeal
    ? "group-hover:text-orange-600 dark:group-hover:text-orange-400"
    : "group-hover:text-blue-600 dark:group-hover:text-blue-400";
  const imageAspectRatio = "1 / 1";
  const imageWrapperClass = "product-image-wrapper relative w-full overflow-hidden";

  return (
    <article
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      className={`product-card ${cardWrapper}`}
      role="button"
      tabIndex={0}
      aria-label={`Chọn ${name}`}
    >
      <div className={gradientHover} />
      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[calc(1.1rem-1.5px)] bg-[#080e1c] text-white dark:bg-[#060c18]">
        <div className={imageWrapperClass} style={{ aspectRatio: imageAspectRatio }}>
          <LazyImage
            src={image_url || "https://placehold.co/400x400?text=No+Image"}
            alt={`Hình ảnh sản phẩm ${name}${description ? ` - ${description.substring(0, 100)}` : ""}`}
            width={400}
            height={400}
            className="product-img h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080e1c] via-[#080e1c]/20 to-transparent" />

          <div className="absolute left-2 top-2 z-30">{renderStatusBadge()}</div>

          {isOutOfStock && <div className="absolute inset-0 z-20 bg-black/40" />}
        </div>

        <div className="product-info flex flex-1 flex-col px-3 pb-3 pt-2.5 md:px-3.5 md:pb-3.5 md:pt-3">
          <h3
            className={`product-card__title product-card__title--default text-white transition-colors ${titleHover} dark:text-slate-100`}
          >
            {name}
          </h3>

          {!hidePriceAndDescription && (
            <>
              <div className="product-stats mt-2 flex items-center justify-between text-[11px]">
                <div
                  className="rating inline-flex items-center gap-0.5 font-bold text-amber-400"
                  aria-label={`Đánh giá ${safeRating.toFixed(1)} sao`}
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span>{safeRating.toFixed(1)}</span>
                </div>
                <div className="sold-count inline-flex items-center gap-1 text-slate-400">
                  <ShoppingCart className="h-3 w-3 text-slate-500" aria-hidden="true" />
                  <span>
                    {safeSalesCount >= 1000
                      ? `${(safeSalesCount / 1000).toFixed(1)}k`
                      : safeSalesCount.toLocaleString("vi-VN")}{" "}
                    đã bán
                  </span>
                </div>
              </div>

              <div className="divider mt-2.5 h-px w-full bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

              <div className="product-pricing mt-2.5">
                {!showContact && !hasMultipleCodes && hasDiscount && (
                  <div className="mb-1 text-[10px] text-slate-600 line-through">
                    {formatCurrency(displayPrice)}
                  </div>
                )}

                <div className="price-promo-row flex items-end justify-between gap-2">
                  <div className="price-current min-w-0">
                    {showContact ? (
                      <div className={`text-[1.35rem] font-black leading-none tracking-tight sm:text-[1.5rem] ${priceColor}`}>
                        Liên hệ
                      </div>
                    ) : hasMultipleCodes ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Từ
                        </span>
                        <span className={`text-[1.35rem] font-black leading-none tracking-tight sm:text-[1.5rem] ${priceColor}`}>
                          {formatCurrency(discountedPrice)}
                        </span>
                      </div>
                    ) : (
                      <div className={`text-[1.35rem] font-black leading-none tracking-tight sm:text-[1.5rem] ${priceColor}`}>
                        {formatCurrency(discountedPrice)}
                      </div>
                    )}
                  </div>

                  {hasDiscount && !showContact && (
                    <div className="badge-discount inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-md shadow-orange-600/30">
                      -{discountPercent}%
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClick();
                }}
                disabled={isOutOfStock}
                className={`btn-action mt-3 inline-flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.15em] text-white transition-all duration-200 active:scale-[0.97] ${
                  isOutOfStock
                    ? "cursor-not-allowed bg-slate-700/80 text-slate-400"
                    : "bg-gradient-to-r from-orange-500 via-red-500 to-red-600 shadow-lg shadow-orange-600/30 hover:brightness-110 hover:shadow-orange-500/50"
                }`}
              >
                {actionButtonLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
