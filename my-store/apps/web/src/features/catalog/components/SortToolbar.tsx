"use client";

export type SortOption =
  | "featured"
  | "best-selling"
  | "discount"
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

interface SortToolbarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeColor?: string;
  showSortButtons?: boolean;
  showSelect?: boolean;
}

const sortButtons: { key: SortOption; label: string }[] = [
  { key: "featured", label: "Nổi bật" },
  { key: "best-selling", label: "Bán chạy" },
  { key: "discount", label: "Giảm giá" },
  { key: "newest", label: "Mới" },
];

export function SortToolbar({
  sortBy,
  onSortChange,
  activeColor = "bg-slate-800 dark:bg-slate-200 dark:text-slate-900",
  showSortButtons = true,
  showSelect = false,
}: SortToolbarProps) {
  if (showSelect) {
    return (
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
            <option value="name-asc">Tên: A-Z</option>
            <option value="name-desc">Tên: Z-A</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold text-gray-500 dark:text-slate-400">Sắp xếp theo:</span>
        <div className="flex flex-wrap gap-1.5">
          {showSortButtons &&
            sortButtons.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onSortChange(item.key)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  sortBy === item.key
                    ? `${activeColor} text-white shadow-sm`
                    : "bg-transparent text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          <button
            type="button"
            onClick={() => onSortChange(sortBy === "price-asc" ? "price-desc" : "price-asc")}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              sortBy === "price-asc" || sortBy === "price-desc"
                ? `${activeColor} text-white shadow-sm`
                : "bg-transparent text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Giá
            <span className="ml-1">{sortBy === "price-desc" ? "↓" : "↑"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
