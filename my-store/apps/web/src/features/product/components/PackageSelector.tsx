"use client";

import { Package } from "lucide-react";
import { isNewPackage } from "../utils";

/** Thẻ gói gọn, không chiếm quá nhiều không gian */
const PACKAGE_CARD_MIN_H = "min-h-[52px]";

interface PackageOption {
  id: string;
  name: string;
  features?: string[];
  created_at?: string | null;
  sold_count_30d?: number;
  has_promo?: boolean;
  /** false = mọi thời hạn đều hết hàng → không cho chọn gói */
  has_available_duration?: boolean;
}

interface PackageSelectorProps {
  packages: PackageOption[];
  selectedPackage: string | null;
  onSelect: (packageId: string) => void;
}

export function PackageSelector({ packages, selectedPackage, onSelect }: PackageSelectorProps) {
  if (packages.length === 0) return null;

  return (
    <div className="rounded-xl p-1">
      {/* Header */}
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-700 shadow shadow-blue-500/20 ring-1 ring-white/10">
          <Package className="h-4 w-4 text-white" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Chọn gói sản phẩm
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Lựa chọn phiên bản phù hợp với nhu cầu
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {packages.map((pkg) => {
          const isNew = isNewPackage(pkg.created_at);
          const isHot = (pkg.sold_count_30d || 0) > 10;
          const hasSale = pkg.has_promo === true;
          const isSelected = selectedPackage === pkg.id;
          const isOutOfStock = pkg.has_available_duration === false;

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => !isOutOfStock && onSelect(pkg.id)}
              disabled={isOutOfStock}
              className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 ease-out ${PACKAGE_CARD_MIN_H} ${
                isOutOfStock
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70 dark:border-slate-600 dark:bg-slate-800/50"
                  : isSelected
                    ? "border-blue-500 bg-blue-500/15 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-500/20 dark:ring-blue-400/25"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow dark:border-slate-600/80 dark:bg-slate-800/50 dark:hover:border-slate-500 dark:hover:bg-slate-800/70"
              }`}
            >
              {/* Hết hàng: mọi thời hạn đều hết */}
              {isOutOfStock && (
                <div className="absolute right-0 top-0 z-10 p-1.5">
                  <span className="inline-flex items-center rounded-full bg-slate-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Hết hàng
                  </span>
                </div>
              )}
              {/* Badges góc phải trên */}
              {!isOutOfStock && (isHot || isNew || hasSale) && (
                <div className="absolute right-0 top-0 z-10 flex flex-wrap justify-end gap-1 p-1.5">
                  {isHot && (
                    <span className="rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Hot
                    </span>
                  )}
                  {isNew && !isHot && (
                    <span className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Mới
                    </span>
                  )}
                  {hasSale && (
                    <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Sale
                    </span>
                  )}
                </div>
              )}

              {/* Nội dung thẻ */}
              <div className="relative z-0 flex flex-1 flex-col items-center justify-center px-3 py-2 pt-6">
                <span
                  className={`text-center text-sm font-semibold leading-snug tracking-tight transition-colors ${
                    isOutOfStock
                      ? "text-slate-400 dark:text-slate-500"
                      : isSelected
                        ? "text-blue-700 dark:text-blue-200"
                        : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {pkg.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
