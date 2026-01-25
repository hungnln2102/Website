"use client";

import { useEffect, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Database } from "@/lib/database.types";

import ProductCard from "./ProductCard";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface PromotionCarouselProps {
  products: Product[];
  onProductClick: (slug: string) => void;
}

export default function PromotionCarousel({ products, onProductClick }: PromotionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        const maxIndex = Math.max(0, products.length - itemsPerView);
        return nextIndex > maxIndex ? 0 : nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [products.length, itemsPerView]);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => {
    const maxIndex = Math.max(0, products.length - itemsPerView);
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const maxIndex = Math.max(0, products.length - itemsPerView);
  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <div className="group/carousel relative">
      <div className="overflow-hidden px-1 py-2">
        <div className="grid grid-cols-1 gap-6 transition-all duration-700 md:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onClick={() => onProductClick(product.slug)}
            />
          ))}
        </div>
      </div>

      {products.length > itemsPerView && (
        <>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute -left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/80 text-gray-900 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer group-hover/carousel:translate-x-0 sm:-translate-x-3"
            aria-label="Sản phẩm trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="absolute -right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/80 text-gray-900 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer group-hover/carousel:translate-x-0 sm:translate-x-3"
            aria-label="Sản phẩm tiếp theo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="mt-6 flex justify-center gap-2">
            {[...Array(maxIndex + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-8 bg-blue-600 shadow-lg shadow-blue-500/50"
                    : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
