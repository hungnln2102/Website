"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  const left = clamp(current - 1, 2, total - 1);
  const right = clamp(current + 1, 2, total - 1);

  if (left > 2) pages.push("...");

  for (let p = left; p <= right; p++) {
    pages.push(p);
  }

  if (right < total - 1) pages.push("...");

  pages.push(total);
  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = buildPages(currentPage, totalPages);

  const goTo = (page: number) => {
    const next = clamp(page, 1, totalPages);
    if (next !== currentPage) onPageChange(next);
  };

  const btnBase =
    "min-w-14 rounded-xl px-5 py-2.5 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const btnDefault = `${btnBase} border border-slate-200 bg-white text-slate-900 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600`;
  const btnActive = `${btnBase} border border-blue-600 bg-blue-600 text-white font-bold dark:border-blue-500 dark:bg-blue-500`;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-slate-900">
      <button className={btnDefault} onClick={() => goTo(1)} disabled={currentPage === 1}>
        {"<<"}
      </button>
      <button className={btnDefault} onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>
        {"<"}
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            className={currentPage === p ? btnActive : btnDefault}
            onClick={() => goTo(p)}
          >
            {p}
          </button>
        ),
      )}

      <button
        className={btnDefault}
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {">"}
      </button>
      <button
        className={btnDefault}
        onClick={() => goTo(totalPages)}
        disabled={currentPage === totalPages}
      >
        {">>"}
      </button>
    </div>
  );
}
