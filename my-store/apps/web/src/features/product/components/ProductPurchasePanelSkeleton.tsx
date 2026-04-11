"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton cột chọn gói / thời hạn / mua khi API product-packages đang tải. */
export function ProductPurchasePanelSkeleton() {
  return (
    <div
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700/50 dark:bg-slate-900/90 sm:space-y-6 sm:rounded-2xl sm:p-5 sm:shadow-2xl"
      aria-busy="true"
      aria-label="Đang tải gói và giá"
    >
      <div className="flex gap-2.5">
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full max-w-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((k) => (
          <Skeleton key={k} className="h-[72px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-12 rounded-lg" />
      </div>
    </div>
  );
}
