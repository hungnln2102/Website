"use client";

import { useMemo } from "react";
import LazyImage from "@/components/ui/LazyImage";

export type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  base_price: number;
  discount_percentage: number;
};

export type SearchCategory = {
  id: string;
  name: string;
  slug: string;
};

interface SearchDropdownProps {
  searchQuery: string;
  products: SearchProduct[];
  categories: SearchCategory[];
  onProductClick: (slug: string) => void;
  onCategoryClick: (slug: string) => void;
  isVisible: boolean;
}

export default function SearchDropdown({
  searchQuery,
  products,
  onProductClick,
  isVisible,
}: SearchDropdownProps) {
  // Filter products that match the search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [searchQuery, products]);

  if (!isVisible || !searchQuery.trim()) return null;

  if (filteredProducts.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full z-[9999] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
          Không tìm thấy kết quả cho "{searchQuery}"
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full z-[9999] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
          Sản phẩm gợi ý
        </span>
      </div>
      <ul className="max-h-[400px] overflow-y-auto">
        {filteredProducts.map((product) => (
                <li key={product.id}>
                  <button
                    onClick={() => onProductClick(product.slug)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 min-h-[80px] sm:min-h-[72px]"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800">
                      <LazyImage
                        src={product.image_url || "https://placehold.co/100x100?text=No+Image"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="line-clamp-2 text-base font-medium text-gray-900 dark:text-slate-100">
                        {product.name}
                      </h4>
                    </div>
                  </button>
                </li>
              ))}
      </ul>
    </div>
  );
}
