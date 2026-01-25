"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Search, X, TrendingUp } from "lucide-react";

import BannerSlider from "@/components/BannerSlider";
import CategoryFilter from "@/components/CategoryFilter";
import Footer from "@/components/Footer";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import PromotionCarousel from "@/components/PromotionCarousel";
import { ProductCardSkeleton, CategorySkeleton, CategorySkeletonGrid } from "@/components/ui/skeleton";
import { fetchCategories, fetchProducts, fetchPromotions, type CategoryDto, type ProductDto, type PromotionDto } from "@/lib/api";
import { categoriesMock } from "@/lib/mockData";
import { ModeToggle } from "@/components/mode-toggle";
import MenuBar from "@/components/MenuBar";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

interface HomePageProps {
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HomePage({ onProductClick, searchQuery, setSearchQuery }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);

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
  const categoryError = null; 

  const categoriesUi = useMemo(() => {
    if (loadingCategories && categories.length === 0) {
      return []; 
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
      products.map((p: any) => ({
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
    let result = normalizedProducts;
    
    if (selectedCategory !== null) {
      result = result.filter((p) => {
        const productIds = categoryProductsMap.get(selectedCategory);
        if (!productIds || productIds.size === 0) return false;
        return productIds.has(String(p.id));
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [normalizedProducts, selectedCategory, categoryProductsMap, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const pageProducts = filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Handle scroll for sticky effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/5" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-indigo-500/10 blur-[100px] dark:indigo-600/5" />
      </div>

      <div className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'shadow-xl shadow-blue-900/5 backdrop-blur-xl' : ''}`}>
        <header className={`relative border-b transition-all duration-500 ${
          isScrolled 
            ? 'border-gray-200/50 bg-white/80 py-2 dark:border-slate-800/50 dark:bg-slate-950/80' 
            : 'border-gray-100 bg-white py-3.5 dark:border-slate-800/50 dark:bg-slate-950/70'
        }`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className={`rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 transition-all duration-500 ${isScrolled ? 'h-8 w-8' : 'h-10 w-10'}`}>
                <div className="flex h-full w-full items-center justify-center rounded-[calc(0.75rem-1px)] bg-white dark:bg-slate-950">
                    <span className={`font-bold text-blue-600 transition-all ${isScrolled ? 'text-lg' : 'text-xl'}`}>M</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className={`font-bold tracking-tight text-gray-900 transition-all duration-500 dark:text-white ${isScrolled ? 'text-base' : 'text-lg sm:text-xl'}`}>
                  Mavryk Premium <span className="text-blue-600 dark:text-blue-500">Store</span>
                </h1>
                {!isScrolled && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 md:block animate-in fade-in slide-in-from-top-1">
                    Phần mềm bản quyền chính hãng
                  </p>
                )}
              </div>
            </div>

            <div className={`mx-4 flex flex-1 max-w-md transition-all duration-500 ${isScrolled ? 'max-w-lg' : ''}`}>
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${searchQuery ? 'text-blue-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full transition-all duration-500 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 ${
                    isScrolled ? 'h-9' : 'h-10'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ModeToggle />
            </div>
          </div>
        </header>
        <MenuBar isScrolled={isScrolled} />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-xl shadow-lg shadow-blue-900/5 sm:mb-12 sm:rounded-2xl sm:shadow-xl">
          <BannerSlider />
        </section>

        {(!loadingPromotions && promotionProducts.length > 0 && !searchQuery) && (
          <section className="mb-8 sm:mb-12">
            <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-xl bg-red-500 opacity-20" />
                <div className="relative rounded-xl bg-gradient-to-br from-red-500 to-orange-500 p-2 text-white shadow-lg shadow-red-500/20">
                  <Flame className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Deal Sốc <span className="text-red-500">Hôm Nay</span></h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 sm:text-[10px]">Đừng bỏ lỡ ưu đãi giới hạn</p>
              </div>
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

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-4 lg:gap-8">
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
          </aside>

          <section className="lg:col-span-3">
            <div className="mb-4 sm:mb-5">
              <h2 className="mb-0.5 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                {searchQuery 
                  ? `Tìm thấy sản phẩm cho "${searchQuery}"`
                  : selectedCategory
                  ? categoriesUi.find((c) => c.slug === selectedCategory)?.name || "Sản phẩm"
                  : "Tất cả sản phẩm"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">{filteredProducts.length} sản phẩm</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                <p className="text-gray-500 dark:text-slate-400">Không tìm thấy sản phẩm phù hợp</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
