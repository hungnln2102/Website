"use client";

import { Boxes, Headphones, LayoutGrid, Sparkles } from "lucide-react";

interface StoreStatsSectionProps {
  productCount: number;
  categoryCount: number;
  discountedCount: number;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function StoreStatsSection({
  productCount,
  categoryCount,
  discountedCount,
}: StoreStatsSectionProps) {
  const stats = [
    {
      value: `${formatCount(productCount)}+`,
      label: "Gói đang mở bán",
      icon: Boxes,
      iconClass: "text-blue-600 dark:text-blue-300",
      iconBgClass: "bg-blue-100/90 dark:bg-blue-500/15",
    },
    {
      value: `${formatCount(categoryCount)}+`,
      label: "Danh mục sản phẩm",
      icon: LayoutGrid,
      iconClass: "text-emerald-600 dark:text-emerald-300",
      iconBgClass: "bg-emerald-100/90 dark:bg-emerald-500/15",
    },
    {
      value: `${formatCount(discountedCount)}+`,
      label: "Gói có ưu đãi",
      icon: Sparkles,
      iconClass: "text-violet-600 dark:text-violet-300",
      iconBgClass: "bg-violet-100/90 dark:bg-violet-500/15",
    },
    {
      value: "24/7",
      label: "Hỗ trợ khách hàng",
      icon: Headphones,
      iconClass: "text-orange-600 dark:text-orange-300",
      iconBgClass: "bg-orange-100/90 dark:bg-orange-500/15",
    },
  ];

  return (
    <section
      className="mt-5 mb-4 sm:mt-6 sm:mb-6"
      aria-label="Tổng quan nhanh cửa hàng"
      style={{ contentVisibility: "auto", containIntrinsicSize: "240px" }}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/82 px-2 py-2 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-slate-800/70 dark:bg-slate-900/66 dark:shadow-[0_16px_34px_rgba(2,6,23,0.18)] sm:px-3 sm:py-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className={`rounded-xl px-3 py-3 sm:px-4 xl:rounded-none xl:px-5 ${
                  index > 0
                    ? "xl:border-l xl:border-slate-200/80 xl:dark:border-slate-800/80"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 ${stat.iconBgClass} dark:border-white/5`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${stat.iconClass}`} aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[1.5rem] font-black tracking-tight text-slate-950 dark:text-white sm:text-[1.7rem]">
                      {stat.value}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
