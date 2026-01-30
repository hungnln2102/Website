"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Sparkles, ArrowRight, Package } from "lucide-react";

import BannerSlider from "@/components/BannerSlider";
import Footer from "@/components/Footer";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import PromotionCarousel from "@/components/PromotionCarousel";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { fetchCategories, fetchProducts, fetchPromotions, type CategoryDto, type ProductDto, type PromotionDto } from "@/lib/api";
import { categoriesMock } from "@/lib/mockData";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { MetaTags, StructuredData } from "@/components/SEO";
import { generateOrganizationSchema, generateWebSiteSchema, generateFAQSchema } from "@/lib/seo/metadata";
import { faqs } from "@/lib/seo/faq-data";
import { APP_CONFIG } from "@/lib/constants";
import { validateSearchQuery } from "@/lib/validation/search";
import { useScroll } from "@/hooks/useScroll";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

interface HomePageProps {
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HomePage({ onProductClick, searchQuery, setSearchQuery }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const isScrolled = useScroll(); // Use optimized scroll hook
  const queryClient = useQueryClient();

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
    isLoading: loadingPromotions,
    error: promotionsError,
    refetch: refetchPromotions
  } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  });

  const { 
    data: categories = [], 
    isLoading: loadingCategories,
    error: categoriesError,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Error messages
  const productsError = fetchError instanceof Error ? fetchError.message : (fetchError ? "Không lấy được danh sách sản phẩm" : null);
  const categoriesErrorMsg = categoriesError instanceof Error ? categoriesError.message : (categoriesError ? "Không lấy được danh sách danh mục" : null);
  const promotionsErrorMsg = promotionsError instanceof Error ? promotionsError.message : (promotionsError ? "Không lấy được danh sách khuyến mãi" : null);

  // Retry handlers
  const handleRetryProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleRetryCategories = () => {
    refetchCategories();
  };

  const handleRetryPromotions = () => {
    refetchPromotions();
  }; 

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
        sold_count_30d: p.sold_count_30d ?? 0,
        average_rating: p.average_rating ?? 0,
        purchase_rules: null,
        package_count: p.package_count ?? 1,
        created_at: p.created_at || null,
      })),
    [products],
  );

  // Helper function to check if product is new (created within 7 days)
  const isNewProduct = (createdAt: string | null): boolean => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

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

  // Get new products - sản phẩm được tạo trong vòng 7 ngày
  // Sản phẩm mới: created_at trong vòng 7 ngày từ ngày tạo
  const newProducts = useMemo(() => {
    return [...normalizedProducts]
      .filter((p) => isNewProduct(p.created_at))
      .sort((a, b) => {
        // Sắp xếp theo ngày tạo mới nhất trước
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, 4); // Chỉ hiển thị 4 sản phẩm mới nhất
  }, [normalizedProducts]);

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
    
    // Sắp xếp: Best Selling (sold_count_30d > 10) > Hot (5 <= sold_count_30d <= 10) > còn lại
    result = result.sort((a, b) => {
      const sold30dA = a.sold_count_30d ?? 0;
      const sold30dB = b.sold_count_30d ?? 0;
      
      // Xác định category: 2 = Best Selling, 1 = Hot, 0 = Khác
      const categoryA = sold30dA > 10 ? 2 : (sold30dA >= 5 && sold30dA <= 10 ? 1 : 0);
      const categoryB = sold30dB > 10 ? 2 : (sold30dB >= 5 && sold30dB <= 10 ? 1 : 0);
      
      // Sắp xếp theo category trước
      if (categoryA !== categoryB) {
        return categoryB - categoryA; // Best Selling (2) > Hot (1) > Khác (0)
      }
      
      // Nếu cùng category, sắp xếp theo sold_count_30d giảm dần
      if (sold30dA !== sold30dB) {
        return sold30dB - sold30dA;
      }
      
      // Nếu cùng sold_count_30d, sắp xếp theo sales_count giảm dần
      return (b.sales_count ?? 0) - (a.sales_count ?? 0);
    });
    
    return result;
  }, [normalizedProducts, selectedCategory, categoryProductsMap, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const pageProducts = filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const isDefaultView = !searchQuery && !selectedCategory;
  const isPreviewMode = isDefaultView && !showAllProducts;
  const displayedProducts = isPreviewMode ? pageProducts.slice(0, 4) : pageProducts;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setShowAllProducts(params.get("view") === "all-products");
    };

    updateFromUrl();
    window.addEventListener("popstate", updateFromUrl);

    return () => {
      window.removeEventListener("popstate", updateFromUrl);
    };
  }, []);

  // SEO Metadata
  const seoMetadata = useMemo(() => {
    const baseTitle = APP_CONFIG.name;
    const baseDescription = APP_CONFIG.description;
    
    if (searchQuery) {
      return {
        title: `Tìm kiếm "${searchQuery}" - ${baseTitle}`,
        description: `Kết quả tìm kiếm cho "${searchQuery}" trên ${baseTitle}. ${baseDescription}`,
        keywords: `${searchQuery}, phần mềm bản quyền, ${APP_CONFIG.name}`,
        url: `${APP_CONFIG.url}/?search=${encodeURIComponent(searchQuery)}`,
      };
    }
    
    if (selectedCategory) {
      const categoryName = categoriesUi.find(c => c.slug === selectedCategory)?.name || "Danh mục";
      return {
        title: `${categoryName} - ${baseTitle}`,
        description: `Xem tất cả sản phẩm trong danh mục ${categoryName} tại ${baseTitle}. ${baseDescription}`,
        keywords: `${categoryName}, phần mềm bản quyền, ${APP_CONFIG.name}`,
        url: `${APP_CONFIG.url}/?category=${selectedCategory}`,
      };
    }
    
    return {
      title: baseTitle,
      description: baseDescription,
      keywords: "phần mềm bản quyền, phần mềm chính hãng, Adobe, Microsoft, Autodesk, phần mềm giá rẻ",
      url: APP_CONFIG.url,
    };
  }, [searchQuery, selectedCategory, categoriesUi]);

  // Structured Data
  const structuredData = useMemo(() => {
    const schemas = [
      generateOrganizationSchema(),
      generateWebSiteSchema(),
    ];
    
    // Add FAQ schema if available
    if (faqs && faqs.length > 0) {
      schemas.push(generateFAQSchema(faqs));
    }
    
    return schemas;
  }, []);

  // Validate search query with useCallback to prevent re-renders
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (value.trim()) {
      const validation = validateSearchQuery(value);
      if (!validation.isValid && validation.error) {
        toast.error(validation.error, { duration: 3000 });
      }
    }
  }, [setSearchQuery]);

  // Memoize category selection handler to prevent MenuBar re-renders
  const handleCategorySelect = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
    setCurrentPage(1); // Reset to first page when category changes
  }, []);

  const handleLogoClick = useCallback(() => {
    setSelectedCategory(null);
    setCurrentPage(1);
    setShowAllProducts(false);
    setSearchQuery("");

    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new Event("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [setSearchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/5" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-indigo-500/10 blur-[100px] dark:indigo-600/5" />
      </div>

      <div className={`sticky top-0 z-40 transition-all duration-500 ${isScrolled ? 'shadow-xl shadow-blue-900/5 backdrop-blur-xl' : ''}`}>
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onLogoClick={handleLogoClick}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={normalizedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            base_price: p.base_price,
            discount_percentage: p.discount_percentage,
          }))}
          categories={categoriesUi.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
          onProductClick={onProductClick}
          onCategoryClick={(slug) => handleCategorySelect(slug)}
        />
        <MenuBar 
          isScrolled={isScrolled}
          categories={categoriesUi}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
      </div>

      <MetaTags metadata={seoMetadata} />
      <StructuredData data={structuredData} />
      
      <main id="main-content" className="relative z-0 mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-xl shadow-lg shadow-blue-900/5 sm:mb-8 sm:rounded-2xl sm:shadow-xl">
          <BannerSlider />
        </section>

        {(!loadingPromotions && promotionProducts.length > 0 && !searchQuery) && (
          <section className="mb-6 sm:mb-8" aria-labelledby="deals-heading">
            <div className="relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50/80 via-white to-rose-50/50 shadow-lg shadow-orange-500/10 dark:border-orange-900/40 dark:from-slate-900/95 dark:via-slate-900 dark:to-orange-950/30 dark:shadow-orange-950/20">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex shrink-0">
                      <div className="absolute inset-0 animate-pulse rounded-xl bg-orange-500/25" />
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/20 dark:ring-orange-500/30 sm:h-12 sm:w-12">
                        <Flame className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                      </div>
                    </div>
                    <div>
                      <h2 id="deals-heading" className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl">
                        Deal Sốc <span className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 bg-clip-text font-black text-transparent">Hôm Nay</span>
                      </h2>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 sm:text-xs">
                        ĐỪNG BỎ LỠ ƯU ĐÃI GIỚI HẠN
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (typeof window !== "undefined") {
                        window.history.pushState({}, "", "/khuyen-mai");
                        window.dispatchEvent(new Event("popstate"));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="group inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 sm:self-center cursor-pointer"
                  >
                    <span>Xem tất cả ưu đãi</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </div>
                <PromotionCarousel
                  variant="deal"
                  products={promotionProducts as any}
                  onProductClick={(slug) => {
                    const p = promotionProducts.find((x: any) => x.slug === slug);
                    if (p) handlePromotionClick(p);
                    else onProductClick(slug);
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {(!loading && newProducts.length > 0 && !searchQuery) && (
          <section className="mb-6 sm:mb-8" aria-labelledby="new-products-heading">
            <div className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 shadow-lg shadow-blue-500/10 dark:border-blue-900/40 dark:from-slate-900/95 dark:via-slate-900 dark:to-blue-950/30 dark:shadow-blue-950/20">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex shrink-0">
                      <div className="absolute inset-0 animate-pulse rounded-xl bg-blue-500/25" />
                      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20 dark:ring-blue-500/30 sm:h-12 sm:w-12">
                        <Sparkles className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                      </div>
                    </div>
                    <div>
                      <h2 id="new-products-heading" className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl">
                        Sản Phẩm <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 bg-clip-text font-black text-transparent">Mới</span>
                      </h2>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 sm:text-xs">
                        KHÁM PHÁ NHỮNG SẢN PHẨM MỚI NHẤT
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, "", "/san-pham-moi");
                      window.dispatchEvent(new Event("popstate"));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="group inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 sm:self-center"
                  >
                    <span>Xem tất cả sản phẩm</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </div>
                {/* Grid 4 sản phẩm mới - không có nút di chuyển */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {newProducts.slice(0, 4).map((product) => (
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
        )}

        {/* Error States */}
        {productsError && (
          <ErrorMessage
            title="Lỗi tải sản phẩm"
            message={productsError}
            onRetry={handleRetryProducts}
            className="mb-4"
          />
        )}

        {categoriesErrorMsg && (
          <ErrorMessage
            title="Lỗi tải danh mục"
            message={categoriesErrorMsg}
            onRetry={handleRetryCategories}
            className="mb-4"
          />
        )}

        {promotionsErrorMsg && (
          <ErrorMessage
            title="Lỗi tải khuyến mãi"
            message={promotionsErrorMsg}
            onRetry={handleRetryPromotions}
            className="mb-4"
          />
        )}

        <section className="mb-6 sm:mb-8" aria-labelledby="all-products-heading">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-gray-50/60 shadow-lg shadow-slate-500/5 dark:border-slate-700/60 dark:from-slate-900/95 dark:via-slate-900 dark:to-slate-950/50 dark:shadow-slate-950/20">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/30 to-transparent" />
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex shrink-0">
                    <div className="absolute inset-0 animate-pulse rounded-xl bg-slate-400/20" />
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-lg shadow-slate-500/25 ring-2 ring-slate-400/20 dark:from-slate-600 dark:via-slate-700 dark:to-slate-800 dark:ring-slate-500/30 sm:h-12 sm:w-12">
                      <Package className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div>
                    <h2 id="all-products-heading" className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl">
                      {searchQuery
                        ? (
                          <>
                            Tìm thấy <span className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text font-black text-transparent dark:from-slate-400 dark:to-slate-300">&ldquo;{searchQuery}&rdquo;</span>
                          </>
                        )
                        : selectedCategory
                        ? (categoriesUi.find((c) => c.slug === selectedCategory)?.name ?? "Sản phẩm")
                        : (
                          <>
                            Tất cả <span className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text font-black text-transparent dark:from-slate-400 dark:to-slate-300">sản phẩm</span>
                          </>
                        )}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 sm:text-sm">
                      {filteredProducts.length} {filteredProducts.length === 1 ? "sản phẩm" : "sản phẩm"}
                    </p>
                  </div>
                </div>

                {isPreviewMode && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (typeof window !== "undefined") {
                        window.history.pushState({}, "", "/tat-ca-san-pham");
                        window.dispatchEvent(new Event("popstate"));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="group inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-4 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 sm:self-auto"
                  >
                    <span>Xem tất cả sản phẩm</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        {...product}
                        onClick={() => onProductClick(product.slug)}
                      />
                    ))}
                  </div>
                  {!isPreviewMode && totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => setCurrentPage(p)}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50/50 py-16 text-center dark:border-slate-700/60 dark:bg-slate-900/30">
                  <Package className="mb-4 h-14 w-14 text-slate-300 dark:text-slate-600" />
                  <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Không tìm thấy sản phẩm</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {searchQuery ? `Không có sản phẩm nào phù hợp với "${searchQuery}".` : "Thử đổi bộ lọc hoặc danh mục."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
