import { ChevronLeft, ChevronRight } from "lucide-react";

export type OrderHistoryPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const btnClass =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700";
const pageBtnClass = (active: boolean) =>
  active
    ? "flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium bg-blue-600 text-white shadow-sm dark:bg-blue-500"
    : "flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700";

export function OrderHistoryPagination({
  currentPage,
  totalPages,
  onPageChange,
}: OrderHistoryPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={btnClass}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, idx) => (
        <span key={p}>
          {idx > 0 && pages[idx - 1] !== p - 1 && (
            <span className="px-1 text-gray-400 dark:text-slate-500">...</span>
          )}
          <button onClick={() => onPageChange(p)} className={pageBtnClass(currentPage === p)}>
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={btnClass}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
