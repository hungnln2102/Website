"use client";

import { Flame, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { PromotionDto } from "@/lib/api";

interface DealsSectionProps {
  promotions: PromotionDto[];
  onProductClick: (slug: string) => void;
  onPromotionClick: (promotion: PromotionDto) => void;
}

export function DealsSection({ promotions, onProductClick, onPromotionClick }: DealsSectionProps) {
  const promotionProducts = promotions.map((p) => ({
    ...p,
    id: String(p.id),
    category_id: null,
    full_description: null,
    is_featured: false,
    purchase_rules: null,
    created_at: new Date().toISOString(),
  }));

  const handleViewAll = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/khuyen-mai");
      window.dispatchEvent(new Event("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section className="mb-6 sm:mb-8" aria-labelledby="deals-heading">
      <div className="relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50/80 via-white to-rose-50/50 shadow-lg shadow-orange-500/10 dark:border-orange-900/40 dark:from-slate-900/95 dark:via-slate-900 dark:to-orange-950/30 dark:shadow-orange-950/20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex shrink-0">
                <div className="absolute inset-0 animate-pulse rounded-xl bg-orange-500/25" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/20 dark:ring-orange-500/30 sm:h-12 sm:w-12">
                  <Flame className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <h2
                  id="deals-heading"
                  className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl"
                >
                  Deal Sốc{" "}
                  <span className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 bg-clip-text font-black text-transparent">
                    Hôm Nay
                  </span>
                </h2>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 sm:text-xs">
                  ĐỪNG BỎ LỠ ƯU ĐÃI GIỚI HẠN
                </p>
              </div>
            </div>
            <button
              onClick={handleViewAll}
              className="group inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 sm:self-center cursor-pointer"
            >
              <span>Xem tất cả ưu đãi</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          {/* Grid đồng bộ với Sản Phẩm Mới & Tất cả sản phẩm */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {promotionProducts.map((product: any) => (
              <div key={product.id} className="w-full sm:max-w-[210px]">
                <ProductCard
                  {...product}
                  onClick={() => {
                    const original = promotions.find((x) => x.slug === product.slug);
                    if (original) onPromotionClick(original);
                    else onProductClick(product.slug);
                  }}
                  variant="deal"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
