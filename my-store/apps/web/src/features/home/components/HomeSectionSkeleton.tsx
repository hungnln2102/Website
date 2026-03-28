"use client";

import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

type SkeletonTone = "blue" | "amber" | "orange" | "slate";

const toneMap: Record<SkeletonTone, { border: string; bg: string; accent: string }> = {
  blue: {
    border: "border-blue-200/70 dark:border-blue-900/40",
    bg: "from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-900/95 dark:via-slate-900 dark:to-blue-950/30",
    accent: "via-blue-400/40",
  },
  amber: {
    border: "border-amber-200/70 dark:border-amber-900/40",
    bg: "from-amber-50/80 via-white to-orange-50/45 dark:from-slate-900/95 dark:via-slate-900 dark:to-amber-950/25",
    accent: "via-amber-400/40",
  },
  orange: {
    border: "border-orange-200/70 dark:border-orange-900/40",
    bg: "from-orange-50/80 via-white to-rose-50/50 dark:from-slate-900/95 dark:via-slate-900 dark:to-orange-950/30",
    accent: "via-orange-400/40",
  },
  slate: {
    border: "border-slate-200/80 dark:border-slate-700/60",
    bg: "from-slate-50/90 via-white to-gray-50/60 dark:from-slate-900/95 dark:via-slate-900 dark:to-slate-950/50",
    accent: "via-slate-400/30",
  },
};

interface HomeSectionSkeletonProps {
  tone?: SkeletonTone;
  cardCount?: number;
}

export function HomeSectionSkeleton({
  tone = "slate",
  cardCount = 5,
}: HomeSectionSkeletonProps) {
  const theme = toneMap[tone];

  return (
    <section className="mb-6 sm:mb-8" aria-hidden="true">
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-lg shadow-slate-500/5 ${theme.border} ${theme.bg}`}
      >
        <div
          className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${theme.accent} to-transparent`}
        />
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl sm:h-12 sm:w-12" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-44 rounded-md sm:h-8 sm:w-56" />
                <Skeleton className="h-3 w-28 rounded-md sm:w-36" />
              </div>
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: cardCount }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
