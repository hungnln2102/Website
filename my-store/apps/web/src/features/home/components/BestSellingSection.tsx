"use client";

import { ArrowRight, TrendingUp } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import { ROUTES } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  package: string;
  package_product?: string | null;
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

interface BestSellingSectionProps {
  products: Product[];
  onProductClick: (slug: string) => void;
}

export function BestSellingSection({ products, onProductClick }: BestSellingSectionProps) {
  const handleViewAll = () => {
    window.history.pushState({}, "", ROUTES.bestSelling);
    window.dispatchEvent(new Event("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="mb-6 sm:mb-8" aria-labelledby="best-selling-heading">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/45 shadow-lg shadow-amber-500/10 dark:border-amber-900/40 dark:from-slate-900/95 dark:via-slate-900 dark:to-amber-950/25 dark:shadow-amber-950/20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex shrink-0">
                <div className="absolute inset-0 animate-pulse rounded-xl bg-amber-500/25" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/20 dark:ring-amber-500/30 sm:h-12 sm:w-12">
                  <TrendingUp className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <h2
                  id="best-selling-heading"
                  className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl"
                >
                  Sản Phẩm{" "}
                  <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text font-black text-transparent">
                    Bán Chạy
                  </span>
                </h2>
              </div>
            </div>
            <button
              onClick={handleViewAll}
              className="group inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-300 sm:self-center"
            >
              <span>Xem Thêm</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.slice(0, 5).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                category_id={null}
                name={product.name}
                package={product.package}
                package_product={product.package_product ?? null}
                slug={product.slug}
                description={product.description}
                full_description={null}
                base_price={product.base_price}
                from_price={product.base_price}
                image_url={product.image_url}
                is_featured={false}
                discount_percentage={product.discount_percentage}
                sales_count={product.sales_count}
                sold_count_30d={product.sold_count_30d}
                average_rating={product.average_rating}
                purchase_rules={null}
                package_count={product.package_count}
                created_at={product.created_at ?? new Date().toISOString()}
                is_active={true}
                onClick={() => onProductClick(product.slug)}
                variant="default"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
