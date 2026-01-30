"use client";

import { useMemo } from "react";
import { roundToNearestThousand } from "@/lib/pricing";
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

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

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
      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
          Sản phẩm gợi ý
        </span>
      </div>
      <ul className="max-h-[400px] overflow-y-auto">
        {filteredProducts.map((product) => {
              const hasDiscount = product.discount_percentage > 0;
              const discountedPrice = roundToNearestThousand(
                product.base_price * (1 - product.discount_percentage / 100)
              );

              return (
                <li key={product.id}>
                  <button
                    onClick={() => onProductClick(product.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    {/* Product Image */}
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800">
                      <LazyImage
                        src={product.image_url || "https://placehold.co/100x100?text=No+Image"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                        {product.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-red-500">
                          {formatCurrency(discountedPrice)}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              {formatCurrency(product.base_price)}
                            </span>
                            <span className="text-xs font-semibold text-red-500">
                              -{product.discount_percentage}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
        })}
      </ul>
    </div>
  );
}
