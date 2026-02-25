import { Search, Filter, X } from "lucide-react";

export type OrderHistoryFiltersProps = {
  filterOrderId: string;
  setFilterOrderId: (v: string) => void;
  filterAmountFrom: string;
  setFilterAmountFrom: (v: string) => void;
  filterAmountTo: string;
  setFilterAmountTo: (v: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
  onFilter: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400";
const inputDateClass = inputClass + " dark:[color-scheme:dark]";

export function OrderHistoryFilters({
  filterOrderId,
  setFilterOrderId,
  filterAmountFrom,
  setFilterAmountFrom,
  filterAmountTo,
  setFilterAmountTo,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  onFilter,
  onClearFilters,
  hasActiveFilters,
}: OrderHistoryFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter") fn();
  };

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Mã đơn hàng</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={filterOrderId}
              onChange={(e) => setFilterOrderId(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, onFilter)}
              placeholder="Nhập mã đơn..."
              className={`${inputClass} pl-9 pr-3`}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Số tiền từ</label>
          <input
            type="text"
            inputMode="numeric"
            value={filterAmountFrom}
            onChange={(e) => /^\d*$/.test(e.target.value) && setFilterAmountFrom(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, onFilter)}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Số tiền đến</label>
          <input
            type="text"
            inputMode="numeric"
            value={filterAmountTo}
            onChange={(e) => /^\d*$/.test(e.target.value) && setFilterAmountTo(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, onFilter)}
            placeholder="10,000,000"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Từ ngày</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className={inputDateClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Đến ngày</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className={inputDateClass}
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={onFilter}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Filter className="h-4 w-4" />
            Lọc
          </button>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              title="Xóa bộ lọc"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
