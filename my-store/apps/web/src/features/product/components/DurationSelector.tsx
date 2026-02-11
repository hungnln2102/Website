"use client";

import { Check, ShoppingCart } from "lucide-react";
import { formatCurrency } from "../utils";
import { roundToNearestThousand } from "@/lib/pricing";

export interface DurationOption {
  key: string;
  label: string;
  price: number;
  sortValue: number;
  pct_promo?: number;
  is_active?: boolean;
  /** form_id từ variant → dùng để lấy form Thông tin bổ sung (form_name + form_input + inputs) */
  form_id?: number | null;
}

interface DurationSelectorProps {
  options: DurationOption[];
  selectedDuration: string | null;
  onSelect: (durationKey: string) => void;
}

export function DurationSelector({ options, selectedDuration, onSelect }: DurationSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 dark:bg-cyan-500 shadow-lg shadow-cyan-500/20">
          <ShoppingCart className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Thời gian gia hạn</h3>
          <p className="text-[10px] text-gray-500 dark:text-slate-400">
            Gia hạn càng lâu, ưu đãi càng lớn
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const discountPctRaw = Number(option.pct_promo) || 0;
          const hasPromo = discountPctRaw > 0;
          const promoPrice = hasPromo
            ? roundToNearestThousand(
                option.price * (1 - (discountPctRaw > 1 ? discountPctRaw / 100 : discountPctRaw))
              )
            : option.price;
          const isSelected = selectedDuration === option.key;
          const isOutOfStock = option.is_active === false;

          return (
            <button
              key={option.key}
              onClick={() => !isOutOfStock && onSelect(option.key)}
              disabled={isOutOfStock}
              className={`group relative flex flex-col rounded-lg border-2 px-3 py-2 text-left transition-all duration-300 ${
                isOutOfStock
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60 dark:border-slate-700 dark:bg-slate-800/30"
                  : isSelected
                    ? "cursor-pointer border-blue-600 bg-blue-50/50 ring-2 ring-blue-50 dark:border-blue-500 dark:bg-blue-500/10 dark:ring-blue-900/20"
                    : "cursor-pointer border-gray-100 bg-white hover:border-blue-200 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
              }`}
            >
              {/* Out of Stock Badge */}
              {isOutOfStock && (
                <div className="absolute -right-1.5 -top-1.5 z-20">
                  <span className="flex h-5 items-center rounded-full bg-gray-500 px-1.5 text-[9px] font-bold text-white shadow-sm">
                    Hết hàng
                  </span>
                </div>
              )}

              {/* Discount Badge */}
              {!isOutOfStock && hasPromo && (
                <div className="absolute -right-1.5 -top-1.5 z-20">
                  <span className="flex h-5 items-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-1.5 text-[9px] font-bold text-white shadow-sm">
                    -{discountPctRaw > 1 ? Math.round(discountPctRaw) : Math.round(discountPctRaw * 100)}%
                  </span>
                </div>
              )}

              {/* Radio Button + Label */}
              <div className="mb-1 flex items-center gap-1.5">
                <div
                  className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${
                    isOutOfStock
                      ? "border-gray-300 dark:border-slate-600"
                      : isSelected
                        ? "border-blue-600 bg-blue-600 ring-2 ring-blue-100"
                        : "border-gray-300 dark:border-slate-600"
                  }`}
                >
                  {isSelected && !isOutOfStock && <Check className="h-full w-full text-white p-0.5" />}
                </div>
                <span className={`text-xs font-semibold ${isOutOfStock ? "text-gray-400 dark:text-slate-500" : "text-gray-900 dark:text-white"}`}>
                  {option.label}
                </span>
              </div>

              {/* Price */}
              <div>
                {hasPromo && !isOutOfStock && (
                  <div className="text-[9px] font-medium text-gray-400 line-through">
                    {formatCurrency(option.price)}
                  </div>
                )}
                <div
                  className={`text-sm font-bold ${
                    isOutOfStock
                      ? "text-gray-400 dark:text-slate-500"
                      : hasPromo
                        ? "text-red-600 dark:text-red-500"
                        : "text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {formatCurrency(isOutOfStock ? option.price : promoPrice)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
