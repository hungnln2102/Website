"use client";

import ProductCard from "@/components/ProductCard";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  discount_percentage: number;
  sales_count: number;
  average_rating: number;
  package_count: number;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
  onProductClick: (slug: string) => void;
}

export function RelatedProducts({ products, onProductClick }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Sản phẩm liên quan</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onClick={() => onProductClick(product.slug)}
          />
        ))}
      </div>
    </section>
  );
}
