"use client";

import * as LucideIcons from "lucide-react";

import type { Database } from "@/lib/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const getIcon = (iconName: string | null) => {
    const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>)[iconName ?? ""];
    return Icon ?? LucideIcons.Box;
  };

  return (
    <div className="sticky top-16 sm:top-20 md:top-24 z-30 lg:overflow-hidden lg:rounded-xl lg:border lg:border-gray-200/50 lg:bg-white lg:p-0.5 lg:shadow-xl lg:shadow-gray-200/50 dark:lg:border-slate-800 dark:lg:bg-slate-900/70 dark:lg:shadow-none">
      <div className="bg-transparent p-0 lg:bg-white lg:p-4 dark:lg:bg-slate-950 rounded-[calc(0.75rem-2px)]">
        <h2 className="mb-3 hidden items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 lg:flex">
          <LucideIcons.Layers className="h-4 w-4" />
          Danh mục
        </h2>
        
        <div className="flex gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-2 px-1 sm:px-2 lg:px-0 lg:block lg:space-y-1 lg:pb-0">
          <button
            onClick={() => onSelectCategory(null)}
            className={`group cursor-pointer flex shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 transition-all duration-300 lg:w-full lg:justify-start lg:rounded-xl lg:px-3 lg:py-2 ${
              selectedCategory === null
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            }`}
          >
            <LucideIcons.Grid3x3 className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${selectedCategory === null ? 'text-white' : 'text-blue-500'}`} />
            <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold lg:text-xs whitespace-nowrap">{selectedCategory === null ? "Tất cả" : ( <><span className="lg:hidden">Tất cả</span><span className="hidden lg:inline">Tất cả sản phẩm</span></> )}</span>
            {selectedCategory === null && (
              <div className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-white animate-pulse lg:block" />
            )}
          </button>
          
          <div className="hidden h-px bg-gray-100 dark:bg-slate-800 lg:my-3 lg:block" />

          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            const isActive = selectedCategory === category.slug;
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.slug)}
                className={`group cursor-pointer flex shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 transition-all duration-300 lg:w-full lg:justify-start lg:rounded-xl lg:px-3 lg:py-2 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white text-gray-600 border border-gray-100 hover:bg-blue-50/50 hover:text-blue-600 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                }`}
              >
                <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold lg:text-xs whitespace-nowrap">{category.name}</span>
                {isActive && (
                  <div className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-white animate-pulse lg:block" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
