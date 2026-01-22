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
    <div className="relative">
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 gap-6 transition-all duration-500 md:grid-cols-2 lg:grid-cols-3">
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
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 rounded-full bg-blue-600 p-2.5 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Sản phẩm trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 rounded-full bg-blue-600 p-2.5 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Sản phẩm tiếp theo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="mt-6 flex justify-center gap-2">
            {[...Array(Math.ceil(products.length / itemsPerView))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === Math.floor(currentIndex / itemsPerView)
                    ? "w-6 bg-blue-600"
                    : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
