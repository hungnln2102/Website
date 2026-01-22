import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

export function CategorySkeletonGrid() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <CategorySkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="mb-4 h-4 w-full" />
        <div className="mb-4 flex items-center gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return <Skeleton className="h-10 w-full rounded-lg" />;
}

export { Skeleton };
