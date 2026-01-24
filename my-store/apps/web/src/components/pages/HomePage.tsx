import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";

import BannerSlider from "@/components/BannerSlider";
import CategoryFilter from "@/components/CategoryFilter";
import Footer from "@/components/Footer";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import PromotionCarousel from "@/components/PromotionCarousel";
import { ProductCardSkeleton, CategorySkeleton, CategorySkeletonGrid } from "@/components/ui/skeleton";
import { fetchCategories, fetchProducts, fetchPromotions, type CategoryDto, type ProductDto, type PromotionDto } from "@/lib/api";
import { categoriesMock } from "@/lib/mockData";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

interface HomePageProps {
  onProductClick: (slug: string) => void;
}

export default function HomePage({ onProductClick }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PER_PAGE = 12;

  // Optimized Fetching with React Query
  const { 
    data: products = [], 
    isLoading: loading, 
    error: fetchError 
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const {
    data: promotions = [] as PromotionDto[],
    isLoading: loadingPromotions
  } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  const { 
    data: categories = [], 
    isLoading: loadingCategories 
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const error = fetchError ? "Không lấy được danh sách sản phẩm" : null;
  const categoryError = null; // React Query handles this generally

  const categoriesUi = useMemo(() => {
    if (loadingCategories && categories.length === 0) {
      return []; // Show nothing while loading or handle in UI
    }
    if (categories.length === 0) {
      return categoriesMock;
    }
    return categories.map((c) => {
      const slug = slugify(c.name);
      return {
        id: String(c.id),
        name: c.name,
        slug,
        description: null,
        icon: "FileText",
        created_at: c.created_at ?? new Date().toISOString(),
      };
    });
  }, [categories, loadingCategories]);

  const categoryProductsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    categories.forEach((c) => {
      const slug = slugify(c.name);
      const ids = (c.product_ids ?? []).map((id) => String(id));
      map.set(slug, new Set(ids));
    });
    return map;
  }, [categories]);

  const normalizedProducts = useMemo(
    () =>
      products.map((p) => ({
        id: String(p.id),
        category_id: null,
        name: p.name,
        package: p.package,
        slug: p.slug,
        description: p.description,
        full_description: null,
        base_price: p.base_price ?? 0,
        image_url: p.image_url,
        is_featured: false,
        discount_percentage: p.discount_percentage ?? 0,
        has_promo: p.has_promo ?? false,
        sales_count: p.sales_count ?? 0,
        average_rating: p.average_rating ?? 0,
        purchase_rules: null,
        package_count: p.package_count ?? 1,
        created_at: new Date().toISOString(),
      })),
    [products],
  );

  const promotionProducts = useMemo(() => 
    promotions.map(p => ({
      ...p,
      id: String(p.id),
      category_id: null,
      full_description: null,
      is_featured: false,
      purchase_rules: null,
      created_at: new Date().toISOString(),
    }))
  , [promotions]);

  const handlePromotionClick = (p: any) => {
    const params = new URLSearchParams();
    params.set("package", p.name);
    
    const durationMatch = p.id_product.match(/--\s*(\d+[md])\b/i);
    if (durationMatch) {
      params.set("duration", durationMatch[1].toLowerCase());
    }

    const url = `/${encodeURIComponent(p.slug)}?${params.toString()}`;
    window.history.pushState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === null) return normalizedProducts;
    return normalizedProducts.filter((p) => {
      const productIds = categoryProductsMap.get(selectedCategory);
      if (!productIds || productIds.size === 0) return false;
      return productIds.has(String(p.id));
    });
  }, [normalizedProducts, selectedCategory, categoryProductsMap]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const pageProducts = filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, products.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">Mavryk Premium Store</h1>
            <p className="mt-1 text-gray-600 dark:text-slate-200">Phần mềm bản quyền chính hãng</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-12">
          <BannerSlider />
        </section>

        {(!loadingPromotions && promotionProducts.length > 0) && (
          <section className="mb-12">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 p-2 text-white">
                <Flame className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Khuyến mãi hôm nay</h2>
              <div className="h-1 flex-1 rounded bg-gradient-to-r from-red-500 to-transparent"></div>
            </div>
            <PromotionCarousel 
              products={promotionProducts as any} 
              onProductClick={(slug) => {
                const p = promotionProducts.find((x: any) => x.slug === slug);
                if (p) handlePromotionClick(p);
                else onProductClick(slug);
              }} 
            />
          </section>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            {loadingCategories ? (
              <div className="space-y-4">
                <div className="h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <CategorySkeletonGrid />
              </div>
            ) : (
              <CategoryFilter
                categories={categoriesUi}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}
            {categoryError && (
              <p className="mt-3 text-sm text-red-600">{categoryError}</p>
            )}
          </aside>

          <section className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCategory
                  ? categoriesUi.find((c) => c.slug === selectedCategory)?.name || "Sản phẩm"
                  : "Tất cả sản phẩm"}
              </h2>
              <p className="text-gray-600 dark:text-slate-200">{filteredProducts.length} sản phẩm</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {pageProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      onClick={() => onProductClick(product.slug)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(p) => setCurrentPage(p)}
                  />
                )}
              </>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-gray-500 dark:text-slate-400">Không tìm thấy sản phẩm</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
