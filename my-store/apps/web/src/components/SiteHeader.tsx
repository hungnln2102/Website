"use client";

import { Search, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

interface SiteHeaderProps {
  isScrolled: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onLogoClick: () => void;
  searchPlaceholder?: string;
}

export default function SiteHeader({
  isScrolled,
  searchQuery,
  onSearchChange,
  onLogoClick,
  searchPlaceholder = "Tìm kiếm sản phẩm...",
}: SiteHeaderProps) {
  return (
    <header
      className={`relative border-b transition-all duration-500 ${
        isScrolled
          ? "border-gray-200/50 bg-white/80 py-2 dark:border-slate-800/50 dark:bg-slate-950/80"
          : "border-gray-100 bg-white py-3.5 dark:border-slate-800/50 dark:bg-slate-950/70"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-4 rounded-xl px-1 py-1 -ml-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          aria-label="Quay về trang chủ"
        >
          <div
            className={`rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 transition-all duration-500 ${
              isScrolled ? "h-8 w-8" : "h-10 w-10"
            }`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-[calc(0.75rem-1px)] bg-white dark:bg-slate-950">
              <span
                className={`font-bold text-blue-600 transition-all ${
                  isScrolled ? "text-lg" : "text-xl"
                }`}
              >
                M
              </span>
            </div>
          </div>
          <div className="hidden sm:block text-left">
            <h1
              className={`font-bold tracking-tight text-gray-900 transition-all duration-500 dark:text-white ${
                isScrolled ? "text-base" : "text-lg sm:text-xl"
              }`}
            >
              Mavryk Premium <span className="text-blue-600 dark:text-blue-500">Store</span>
            </h1>
            {!isScrolled && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 md:block">
                Phần mềm bản quyền chính hãng
              </p>
            )}
          </div>
        </button>

        <div
          className={`mx-4 flex flex-1 max-w-md transition-all duration-500 ${
            isScrolled ? "max-w-lg" : ""
          }`}
        >
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search
                className={`h-4 w-4 transition-colors ${
                  searchQuery ? "text-blue-500" : "text-gray-400 group-focus-within:text-blue-500"
                }`}
              />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-10 transition-all duration-500 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 ${
                isScrolled ? "h-9" : "h-10"
              }`}
              aria-label={searchPlaceholder}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

