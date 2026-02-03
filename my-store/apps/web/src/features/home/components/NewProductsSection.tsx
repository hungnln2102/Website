"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  discount_percentage: number;
  has_promo: boolean;
  sales_count: number;
  sold_count_30d: number;
  average_rating: number;
  package_count: number;
  created_at: string | null;
}

interface NewProductsSectionProps {
  products: Product[];
  onProductClick: (slug: string) => void;
}

export function NewProductsSection({ products, onProductClick }: NewProductsSectionProps) {
  const handleViewAll = () => {
    window.history.pushState({}, "", "/san-pham-moi");
    window.dispatchEvent(new Event("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="mb-6 sm:mb-8" aria-labelledby="new-products-heading">
      <div className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 shadow-lg shadow-blue-500/10 dark:border-blue-900/40 dark:from-slate-900/95 dark:via-slate-900 dark:to-blue-950/30 dark:shadow-blue-950/20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex shrink-0">
                <div className="absolute inset-0 animate-pulse rounded-xl bg-blue-500/25" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20 dark:ring-blue-500/30 sm:h-12 sm:w-12">
                  <Sparkles className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <h2
                  id="new-products-heading"
                  className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl"
                >
                  Sản Phẩm{" "}
                  <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 bg-clip-text font-black text-transparent">
                    Mới
                  </span>
                </h2>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 sm:text-xs">
                  KHÁM PHÁ NHỮNG SẢN PHẨM MỚI NHẤT
                </p>
              </div>
            </div>
            <button
              onClick={handleViewAll}
              className="group inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 sm:self-center"
            >
              <span>Xem tất cả sản phẩm</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          {/* Grid 4 sản phẩm mới */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onClick={() => onProductClick(product.slug)}
                variant="default"
                isNew={true}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
