"use client";

import { Package } from "lucide-react";
import { isNewPackage } from "../utils";

/** Chuẩn size thẻ gói: min-height theo layout hiện tại (ô "Chọn gói sản phẩm") */
const PACKAGE_CARD_MIN_H = "min-h-[72px]";

interface PackageOption {
  id: string;
  name: string;
  features?: string[];
  created_at?: string | null;
  sold_count_30d?: number;
  has_promo?: boolean;
}

interface PackageSelectorProps {
  packages: PackageOption[];
  selectedPackage: string | null;
  onSelect: (packageId: string) => void;
}

export function PackageSelector({ packages, selectedPackage, onSelect }: PackageSelectorProps) {
  if (packages.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/20">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="mt-2 min-w-0">
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Chọn gói sản phẩm
          </h3>
          <p className="mt-1 text-sm leading-snug text-slate-500 dark:text-slate-400">
            Lựa chọn phiên bản phù hợp với nhu cầu
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        {packages.map((pkg) => {
          const isNew = isNewPackage(pkg.created_at);
          const isHot = (pkg.sold_count_30d || 0) > 10;
          const hasSale = pkg.has_promo === true;
          const isSelected = selectedPackage === pkg.id;

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.id)}
              className={`group relative flex flex-col overflow-hidden rounded-xl border px-3 pt-2 pb-2.5 text-center transition-all duration-200 ease-out ${PACKAGE_CARD_MIN_H} ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-500/15 dark:ring-blue-400/20"
                  : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-slate-500 dark:hover:bg-slate-800/80"
              }`}
            >
              {/* Tag góc phải trên */}
              {(isHot || isNew || hasSale) && (
                <div className="absolute top-2 right-2 z-10 flex flex-wrap justify-end gap-1">
                  {isHot && (
                    <span className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                      HOT
                    </span>
                  )}
                  {isNew && !isHot && (
                    <span className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                      NEW
                    </span>
                  )}
                  {hasSale && (
                    <span className="inline-flex items-center rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                      SALE
                    </span>
                  )}
                </div>
              )}

              {/* Tên sản phẩm căn giữa */}
              <div className="relative z-0 flex flex-1 flex-col items-center justify-center">
                <span
                  className={`w-full text-center text-base font-semibold leading-snug transition-colors ${
                    isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {pkg.name}
                </span>
              </div>

              <div
                className={`absolute right-0 top-0 h-full w-0.5 transition-all ${
                  isSelected
                    ? "bg-blue-500 opacity-100 dark:bg-blue-400"
                    : "bg-transparent opacity-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
