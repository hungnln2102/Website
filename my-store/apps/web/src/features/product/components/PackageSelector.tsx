"use client";

import { Package } from "lucide-react";
import { isNewPackage } from "../utils";

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
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chọn gói sản phẩm</h3>
          <p className="text-[10px] text-gray-500 dark:text-slate-400">
            Lựa chọn phiên bản phù hợp với nhu cầu
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {packages.map((pkg) => {
          const isNew = isNewPackage(pkg.created_at);
          const isHot = (pkg.sold_count_30d || 0) > 10;
          const hasSale = pkg.has_promo === true;
          const isSelected = selectedPackage === pkg.id;

          return (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className={`group cursor-pointer relative overflow-hidden rounded-lg border-2 px-3 py-2 text-left transition-all duration-300 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-50 dark:border-blue-500 dark:bg-blue-500/10 dark:ring-blue-900/20"
                  : "border-gray-100 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
              }`}
            >
              <div className="relative z-10">
                {/* Tags */}
                {(isHot || isNew || hasSale) && (
                  <div className="mb-1 flex flex-wrap gap-1">
                    {isHot && (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                        HOT
                      </span>
                    )}
                    {isNew && !isHot && (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                        NEW
                      </span>
                    )}
                    {hasSale && (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                        SALE
                      </span>
                    )}
                  </div>
                )}

                {/* Package Name */}
                <div
                  className={`text-xs font-semibold transition-colors ${
                    isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {pkg.name}
                </div>
              </div>

              {/* Selection Indicator */}
              <div
                className={`absolute right-0 top-0 h-full w-0.5 transition-all ${
                  isSelected
                    ? "bg-blue-600 opacity-100"
                    : "bg-transparent opacity-0 group-hover:bg-gray-200 dark:group-hover:bg-slate-700"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
