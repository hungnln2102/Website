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
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-lg dark:shadow-slate-700/30">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Danh mục sản phẩm</h2>
      <div className="space-y-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            selectedCategory === null
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          <LucideIcons.Grid3x3 className="h-5 w-5" />
          <span className="font-medium">Tất cả sản phẩm</span>
        </button>
        {categories.map((category) => {
          const Icon = getIcon(category.icon);
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.slug)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                selectedCategory === category.slug
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
