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
      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-lg dark:shadow-slate-700/50 dark:hover:shadow-2xl dark:hover:shadow-slate-600/50"
    >
      <div className="relative overflow-hidden">
        <img
          src={image_url || "https://placehold.co/600x400?text=No+Image"}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hasDiscount && (
          <div className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white shadow-lg">
            -{discount_percentage}%
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100">
          {name}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">{description}</p>

        <div className="mb-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-700 dark:text-slate-200">{average_rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span className="dark:text-slate-200">{sales_count.toLocaleString("vi-VN")} lượt bán</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {!hasMultipleCodes && hasDiscount && (
              <div className="mb-1 text-sm text-gray-400 line-through">
                {formatCurrency(base_price)}
              </div>
            )}
            <div className="text-2xl font-bold text-blue-600">
              {hasMultipleCodes ? (
                <>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-200">Chỉ từ </span>
                  {formatCurrency(discountedPrice)}
                </>
              ) : (
                formatCurrency(discountedPrice)
              )}
            </div>
          </div>
          <button
            className="rounded-lg bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            aria-label={`Chọn ${name}`}
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
