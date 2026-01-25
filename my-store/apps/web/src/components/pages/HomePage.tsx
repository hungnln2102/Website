"use client";
<<<<<<< HEAD

import { useMemo, useState, useCallback } from "react";
import { Flame, Search, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
=======

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
>>>>>>> f932458

import { BannerSlider, PromotionCarousel, NewProductsCarousel } from "@/features/home/components";
import { Footer, MenuBar } from "@/components/layout";
import { Pagination, ProductCard } from "@/components/common";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/mode-toggle";
import { MetaTags, StructuredData } from "@/components/SEO";

import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { usePromotions } from "@/hooks/usePromotions";
import { useScroll } from "@/hooks/useScroll";
import { APP_CONFIG } from "@/lib/constants";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateFAQSchema,
} from "@/lib/seo";
import { faqs } from "@/lib/seo/faq-data";
import { validateSearchQuery } from "@/lib/validation/search";

interface HomePageProps {
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HomePage({ onProductClick, searchQuery, setSearchQuery }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
<<<<<<< HEAD
  const [searchError, setSearchError] = useState<string | null>(null);
  const isScrolled = useScroll();
=======
  const [isScrolled, setIsScrolled] = useState(false);
>>>>>>> f932458

  // Custom hooks for data fetching
  const { products: normalizedProducts, isLoading: loading, error } = useProducts();
  const { categories: categoriesUi, categoryProductsMap, isLoading: loadingCategories } = useCategories();
  const { promotions: promotionProducts, isLoading: loadingPromotions } = usePromotions();

<<<<<<< HEAD
  // SEO Metadata
  const pageMetadata = useMemo(
    () => ({
      title: searchQuery
        ? `Tìm kiếm: ${searchQuery} - ${APP_CONFIG.name}`
        : selectedCategory
        ? `${categoriesUi.find((c) => c.slug === selectedCategory)?.name || "Sản phẩm"} - ${APP_CONFIG.name}`
        : `${APP_CONFIG.name} - ${APP_CONFIG.description}`,
      description: searchQuery
        ? `Kết quả tìm kiếm cho "${searchQuery}" tại ${APP_CONFIG.name}`
        : selectedCategory
        ? `Xem tất cả sản phẩm ${categoriesUi.find((c) => c.slug === selectedCategory)?.name || ""} tại ${APP_CONFIG.name}`
        : APP_CONFIG.description,
      keywords: "phần mềm bản quyền, phần mềm chính hãng, Adobe, Microsoft, Autodesk",
      url: `${APP_CONFIG.url}${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : selectedCategory ? `?category=${selectedCategory}` : ""}`,
      type: "website" as const,
    }),
    [searchQuery, selectedCategory, categoriesUi]
=======
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
>>>>>>> f932458
  );

  const newProducts = useMemo(() => {
    return [...normalizedProducts]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [normalizedProducts]);

  const handlePromotionClick = useCallback((p: any) => {
    const params = new URLSearchParams();
    params.set("package", p.name);
    
    const durationMatch = p.id_product?.match(/--\s*(\d+[md])\b/i);
    if (durationMatch) {
      params.set("duration", durationMatch[1].toLowerCase());
    }

    const url = `/${encodeURIComponent(p.slug)}?${params.toString()}`;
    window.history.pushState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
    toast.success(`Đang mở ${p.name}`, { duration: 2000 });
  }, []);

  const filteredProducts = useMemo(() => {
    let result = normalizedProducts;
    
    if (selectedCategory !== null) {
      result = result.filter((p) => {
        const productIds = categoryProductsMap.get(selectedCategory);
        if (!productIds || productIds.size === 0) return false;
        return productIds.has(String(p.id));
      });
    }
<<<<<<< HEAD
=======

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [normalizedProducts, selectedCategory, categoryProductsMap, searchQuery]);
>>>>>>> f932458

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [normalizedProducts, selectedCategory, categoryProductsMap, searchQuery]);

<<<<<<< HEAD
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / APP_CONFIG.productsPerPage));
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * APP_CONFIG.productsPerPage,
    currentPage * APP_CONFIG.productsPerPage
  );

  const handleViewAll = useCallback(() => {
    setSelectedCategory(null);
    const productsSection = document.getElementById("all-products");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
      toast.info("Đã hiển thị tất cả sản phẩm", { duration: 2000 });
    }
  }, []);

  // Structured data for SEO
  const structuredData = useMemo(
    () => [
      generateOrganizationSchema(),
      generateWebSiteSchema(),
      generateFAQSchema(faqs),
    ],
    []
  );

  return (
    <>
      <MetaTags metadata={pageMetadata} />
      <StructuredData data={structuredData} />
      <div className="min-h-screen bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
=======
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
>>>>>>> f932458
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/5" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-indigo-500/10 blur-[100px] dark:indigo-600/5" />
      </div>

<<<<<<< HEAD
      <div className={`sticky top-0 z-50 ${isScrolled ? 'shadow-xl shadow-blue-900/5 backdrop-blur-xl' : ''}`}>
=======
      <div className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'shadow-xl shadow-blue-900/5 backdrop-blur-xl' : ''}`}>
>>>>>>> f932458
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
<<<<<<< HEAD
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    // Validate on change (debounced)
                    if (value.length > 0) {
                      const validation = validateSearchQuery(value);
                      setSearchError(validation.isValid ? null : validation.error || null);
                    } else {
                      setSearchError(null);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value.length > 0) {
                      const validation = validateSearchQuery(value);
                      if (!validation.isValid) {
                        setSearchError(validation.error || null);
                        toast.error(validation.error || "Từ khóa tìm kiếm không hợp lệ");
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const validation = validateSearchQuery(searchQuery);
                      if (!validation.isValid) {
                        e.preventDefault();
                        setSearchError(validation.error || null);
                        toast.error(validation.error || "Từ khóa tìm kiếm không hợp lệ");
                      }
                    }
                  }}
                  aria-label="Tìm kiếm sản phẩm"
                  aria-invalid={searchError ? "true" : "false"}
                  aria-describedby={searchError ? "search-error" : undefined}
                  className={`w-full pl-10 transition-all duration-500 rounded-xl bg-gray-50 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 ${
                    searchError 
                      ? 'border-red-300 focus:border-red-500 dark:border-red-800' 
                      : 'border-gray-100 focus:border-blue-500'
                  } ${
=======
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full transition-all duration-500 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 ${
>>>>>>> f932458
                    isScrolled ? 'h-9' : 'h-10'
                  }`}
                />
                {searchQuery && (
                  <button
<<<<<<< HEAD
                    onClick={() => {
                      setSearchQuery("");
                      setSearchError(null);
                    }}
                    aria-label="Xóa tìm kiếm"
=======
                    onClick={() => setSearchQuery("")}
>>>>>>> f932458
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
<<<<<<< HEAD
                {searchError && (
                  <div 
                    id="search-error"
                    className="absolute top-full left-0 mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    <AlertCircle className="h-3 w-3" />
                    <span>{searchError}</span>
                  </div>
                )}
=======
>>>>>>> f932458
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ModeToggle />
            </div>
          </div>
        </header>
<<<<<<< HEAD
        <MenuBar 
          isScrolled={isScrolled} 
          categories={categoriesUi}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
=======
        <MenuBar isScrolled={isScrolled} />
>>>>>>> f932458
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-xl shadow-lg shadow-blue-900/5 sm:mb-12 sm:rounded-2xl sm:shadow-xl">
          <BannerSlider />
        </section>

        {(!loadingPromotions && promotionProducts.length > 0 && !searchQuery) && (
<<<<<<< HEAD
          <section className="mb-12 sm:mb-20">
=======
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
>>>>>>> f932458
            <PromotionCarousel 
              products={promotionProducts} 
              onProductClick={(slug) => {
                const p = promotionProducts.find((x) => x.slug === slug);
                if (p) handlePromotionClick(p);
                else onProductClick(slug);
              }} 
              onViewAll={handleViewAll}
            />
          </section>
        )}

        {(!loading && newProducts.length > 0 && !searchQuery) && (
          <section className="mb-12 sm:mb-20">
            <NewProductsCarousel 
              products={newProducts} 
              onProductClick={onProductClick}
              onViewAll={handleViewAll}
            />
          </section>
        )}

        {error && (
          <div 
            className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

<<<<<<< HEAD
        <div className="flex flex-col gap-8 sm:gap-12" id="all-products">
          <section className="w-full" aria-labelledby="products-heading">
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Khám phá ngay</span>
                </div>
                <h2 id="products-heading" className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                  {searchQuery 
                    ? `Kết quả cho "${searchQuery}"`
                    : selectedCategory
                    ? categoriesUi.find((c) => c.slug === selectedCategory)?.name || "Sản phẩm"
                    : "Tất cả sản phẩm"}
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">
                  Hiện có <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> sản phẩm chất lượng cao
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:bg-slate-900 dark:text-slate-400">
                    Sắp xếp: <span className="text-blue-600 dark:text-blue-400">Mới nhất</span>
                 </div>
              </div>
            </div>

            {loading ? (
              <div 
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                role="status"
                aria-live="polite"
                aria-label="Đang tải sản phẩm"
              >
                {[...Array(8)].map((_, i) => (
=======
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
>>>>>>> f932458
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
<<<<<<< HEAD
                <div 
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  role="list"
                  aria-label="Danh sách sản phẩm"
                >
=======
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
>>>>>>> f932458
                  {pageProducts.map((product) => (
                    <article key={product.id} role="listitem">
                      <ProductCard
                        {...product}
                        onClick={() => {
                          onProductClick(product.slug);
                          toast.success(`Đang mở ${product.name}`, { duration: 2000 });
                        }}
                      />
                    </article>
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
<<<<<<< HEAD
              <article className="rounded-xl border border-gray-100 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto max-w-md px-4">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-gray-100 p-4 dark:bg-slate-800">
                      <Search className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                    Không tìm thấy sản phẩm phù hợp
                  </h3>
                  <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
                    {searchQuery 
                      ? `Không có sản phẩm nào khớp với "${searchQuery}". Hãy thử với từ khóa khác.`
                      : selectedCategory
                      ? `Hiện tại không có sản phẩm trong danh mục này.`
                      : "Hiện tại không có sản phẩm nào."}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          toast.info("Đã xóa bộ lọc tìm kiếm");
                        }}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                    {selectedCategory && (
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          toast.info("Đã xóa bộ lọc danh mục");
                        }}
                        className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Xem tất cả sản phẩm
                      </button>
                    )}
                  </div>
                </div>
              </article>
=======
              <div className="rounded-xl border border-gray-100 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-gray-500 dark:text-slate-400">Không tìm thấy sản phẩm phù hợp</p>
              </div>
>>>>>>> f932458
            )}
          </section>
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
}
