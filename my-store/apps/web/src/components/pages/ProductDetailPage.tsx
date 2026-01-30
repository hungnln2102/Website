import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Package, Shield, ShoppingCart, Star, Users } from "lucide-react";

import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { fetchProductPackages, fetchProducts, fetchProductInfo, fetchCategories, type CategoryDto } from "@/lib/api";
import { roundToNearestThousand } from "@/lib/pricing";
import { categoriesMock, productPackagesMock, productsMock, reviewsMock } from "@/lib/mockData";
import { ModeToggle } from "@/components/mode-toggle";
import MenuBar from "@/components/MenuBar";
import SiteHeader from "@/components/SiteHeader";
import { useScroll } from "@/hooks/useScroll";
import { slugify } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/utils/sanitize";

interface ProductDetailPageProps {
  slug: string;
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const formatCurrency = (value: number) =>
  `${roundToNearestThousand(value).toLocaleString("vi-VN")} đ`;

type DurationOption = {
  key: string;
  label: string;
  price: number;
  sortValue: number;
};

const normalizePackageKey = (value?: string | null) => (value ?? "").trim().toLowerCase();

const parseDurationToken = (value?: string | null) => {
  const text = value ?? "";
  const match = text.match(/--\s*(\d+)\s*([md])\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unit = match[2].toLowerCase();
  const label = unit === "d" ? `${amount} ngày` : `${amount} tháng`;
  const sortValue = unit === "d" ? amount / 30 : amount;
  return { key: `${amount}${unit}`, label, sortValue };
};

export default function ProductDetailPage({ slug, onBack, onProductClick, searchQuery, setSearchQuery }: ProductDetailPageProps) {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const isScrolled = useScroll();
  
  // Store initial URL params to preserve them during loading
  const initialUrlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      package: params.get('package'),
      duration: params.get('duration'),
    };
  }, []);

  // Load variant selection from URL on mount
  useEffect(() => {
    if (initialUrlParams.package) {
      setSelectedPackage(initialUrlParams.package);
    }
    if (initialUrlParams.duration) {
      setSelectedDuration(initialUrlParams.duration);
    }
  }, [initialUrlParams]);

  // Helper function to update URL
  const updateURL = (packageId: string | null, durationKey: string | null) => {
    const url = new URL(window.location.href);
    
    if (packageId) {
      url.searchParams.set('package', packageId);
    } else {
      url.searchParams.delete('package');
    }
    
    if (durationKey) {
      url.searchParams.set('duration', durationKey);
    } else {
      url.searchParams.delete('duration');
    }
    
    // Use replaceState to avoid creating too many history entries
    window.history.replaceState({}, '', url.toString());
  };

  // Optimized Fetching with React Query
  const { 
    data: allProducts = [], 
    isLoading: loadingProducts,
    error: productsError
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const productData = useMemo(() => 
    allProducts.find((p) => p.slug === slug) ?? null
  , [allProducts, slug]);

  const { 
    data: packageData = [], 
    isLoading: loadingPackages,
    error: packagesError,
    refetch: refetchPackages
  } = useQuery({
    queryKey: ["product-packages", productData?.package],
    queryFn: () => productData?.package ? fetchProductPackages(productData.package) : Promise.resolve([]),
    enabled: !!productData?.package,
  });

  // Extract base_name from packageData (remove --duration suffix)
  const baseName = useMemo(() => {
    if (packageData.length === 0) return null;
    const firstItem = packageData[0];
    const idProduct = firstItem.id_product || firstItem.package_product || '';
    // Split by -- to get base name
    return idProduct.split('--')[0] || null;
  }, [packageData]);

  // Fetch product info (description, image) from product_desc
  const {
    data: productInfo,
    isLoading: loadingProductInfo,
    error: productInfoError,
    refetch: refetchProductInfo
  } = useQuery({
    queryKey: ["product-info", baseName],
    queryFn: () => baseName ? fetchProductInfo(baseName) : Promise.resolve(null),
    enabled: !!baseName,
  });

  const loading = loadingProducts || (!!productData?.package && loadingPackages);
  const productsErrorMsg = productsError instanceof Error ? productsError.message : (productsError ? "Không thể tải được sản phẩm" : null);
  const packagesErrorMsg = packagesError instanceof Error ? packagesError.message : (packagesError ? "Không thể tải thông tin gói sản phẩm" : null);
  const productInfoErrorMsg = productInfoError instanceof Error ? productInfoError.message : (productInfoError ? "Không thể tải thông tin chi tiết sản phẩm" : null);
  
  // Retry handlers
  const handleRetryProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleRetryPackages = () => {
    refetchPackages();
  };

  const handleRetryProductInfo = () => {
    refetchProductInfo();
  };

  const mappedProduct = useMemo(
    () =>
      productData
        ? {
            id: String(productData.id),
            category_id: null,
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
            full_description: null,
            base_price: productData.base_price ?? 0,
            image_url: productData.image_url,
            is_featured: false,
            discount_percentage: productData.discount_percentage ?? 0,
            sales_count: productData.sales_count ?? 0,
            average_rating: productData.average_rating ?? 0,
            purchase_rules: null,
            created_at: new Date().toISOString(),
          }
        : null,
    [productData],
  );

  const product = mappedProduct ?? (productsMock.find((p) => p.slug === slug) || null);
  const packagesFromMock = product ? productPackagesMock.filter((p) => p.product_id === product.id) : [];
  
  // Helper function to check if a package is new (created within 30 days)
  const isNewPackage = (createdAt: string | null | undefined): boolean => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  };

  const packages = useMemo(() => {
    if (!product) return [];

    // 1. Ưu tiên dữ liệu thật từ database
    if (packageData.length > 0) {
      const dedup = new Map<string, any>();
      packageData.forEach((pkg) => {
        const variantName = pkg.package_product?.trim() || pkg.package?.trim() || "Gói";
        const packageKey = variantName.toLowerCase();
        
        const costValue = Number(pkg.cost) || 0;
        const existing = dedup.get(packageKey);
        
        // Aggregate sold_count_30d and track earliest created_at for the package
        const soldCount30d = Number(pkg.sold_count_30d) || 0;
        const pctPromo = Number(pkg.pct_promo) || 0;
        const createdAt = pkg.created_at || null;
        
        if (!existing || (costValue > 0 && (existing.price === 0 || costValue < existing.price))) {
          dedup.set(packageKey, {
            id: variantName, 
            product_id: product.id,
            name: variantName,
            price: roundToNearestThousand(pkg.cost),
            features: [],
            duration_months: null,
            created_at: createdAt,
            sold_count_30d: existing ? Math.max(existing.sold_count_30d || 0, soldCount30d) : soldCount30d,
            has_promo: existing ? (existing.has_promo || pctPromo > 0) : pctPromo > 0,
          });
        } else if (existing) {
          // Update aggregated values
          existing.sold_count_30d = Math.max(existing.sold_count_30d || 0, soldCount30d);
          existing.has_promo = existing.has_promo || pctPromo > 0;
          // Keep earliest created_at
          if (createdAt && (!existing.created_at || new Date(createdAt) < new Date(existing.created_at))) {
            existing.created_at = createdAt;
          }
        }
      });
      return Array.from(dedup.values());
    }

    // 2. Nếu không có DB, thử lấy từ Mock data
    if (packagesFromMock.length > 0) {
      return packagesFromMock;
    }

    // 3. Fallback: Tự tạo gói mặc định để không hỏng UI
    const base = Math.max(0, roundToNearestThousand(product.base_price));
    return [
      {
        id: `pkg-${product.id}-default`,
        product_id: product.id,
        name: "Gói chuẩn",
        price: base,
        features: ["Bản quyền vĩnh viễn", "Hỗ trợ 24/7"],
        duration_months: 12,
        created_at: new Date().toISOString(),
        sold_count_30d: 0,
        has_promo: false,
      }
    ];
  }, [packageData, product, packagesFromMock]);

  const durationOptions = useMemo<DurationOption[]>(() => {
    if (!product) return [];

    // 1. Dữ liệu thật từ database
    if (packageData.length > 0) {
      const activePackageKey = (selectedPackage || "").toLowerCase();
      if (!activePackageKey) return [];

      const options = new Map<string, DurationOption & { pct_promo?: number }>();
      packageData.forEach((pkg, idx) => {
        const packageKey = (pkg.package_product ?? (pkg.package ?? "")).trim().toLowerCase();
        if (packageKey !== activePackageKey) return;

        const duration = parseDurationToken(pkg.id_product);
        const price = roundToNearestThousand(pkg.cost);
        const key = duration?.key ?? (pkg.id_product?.trim() || `opt-${idx}`);
        const label = duration?.label ?? (pkg.id_product?.trim() || "Gói");
        const sortValue = duration?.sortValue ?? Number.MAX_SAFE_INTEGER;

        const existing = options.get(key);
        if (!existing || (price > 0 && (existing.price === 0 || price < existing.price))) {
          options.set(key, { 
            key, 
            label, 
            price, 
            sortValue,
            pct_promo: pkg.pct_promo // Pass down pct_promo
          } as any);
        }
      });

      return Array.from(options.values()).sort(
        (a, b) => a.sortValue - b.sortValue || a.price - b.price,
      );
    }
    // ... rest same

    // 2. Fallback cho Mock hoặc sản phẩm không có duration trong DB
    const base = Math.max(0, roundToNearestThousand(product.base_price));
    return [
      { key: "12m", label: "12 tháng", price: base, sortValue: 12 },
      { key: "24m", label: "24 tháng", price: roundToNearestThousand(base * 1.8), sortValue: 24 },
      { key: "36m", label: "36 tháng", price: roundToNearestThousand(base * 2.5), sortValue: 36 },
    ];
  }, [packageData, product, selectedPackage]);

  // Không tự động chọn package - người dùng phải tự chọn
  // useEffect(() => {
  //   if (packages.length > 0 && !selectedPackage) {
  //     setSelectedPackage(packages[0].id);
  //   }
  // }, [packages, selectedPackage]);

  useEffect(() => {
    // Don't clear duration if it came from URL and options are still loading
    if (!durationOptions.length) {
      // Only clear if it wasn't from URL
      if (selectedDuration !== null && selectedDuration !== initialUrlParams.duration) {
        setSelectedDuration(null);
      }
      return;
    }
    // Only clear if selected duration is no longer valid AND it wasn't from URL
    // Do NOT auto-select first option - let user choose
    if (selectedDuration && 
        !durationOptions.some((option) => option.key === selectedDuration) &&
        selectedDuration !== initialUrlParams.duration) {
      setSelectedDuration(null);
    }
  }, [durationOptions, selectedDuration, initialUrlParams.duration]);
  const reviews = product ? reviewsMock.filter((r) => r.product_id === product.id) : [];
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.slug !== slug)
      .slice(0, 3)
      .map((p) => ({
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
        sales_count: p.sales_count ?? 0,
        average_rating: p.average_rating ?? 0,
        purchase_rules: null,
        package_count: p.package_count ?? 1,
        created_at: new Date().toISOString(),
      }));
  }, [allProducts, slug]);

  const discountedPrice = useMemo(() => {
    if (!product) return 0;
    return roundToNearestThousand(product.base_price * (1 - product.discount_percentage / 100));
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          {productsErrorMsg ? (
            <ErrorMessage
              title="Lỗi tải sản phẩm"
              message={productsErrorMsg}
              onRetry={handleRetryProducts}
              className="mb-4"
            />
          ) : (
            <p className="mb-4 text-gray-600 dark:text-slate-400">
              Không thể tải được sản phẩm
            </p>
          )}
          <button
            onClick={onBack}
            className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const selectedDurationData =
    durationOptions.find((option) => option.key === selectedDuration) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'shadow-xl shadow-blue-900/5 backdrop-blur-xl' : ''}`}>
        <SiteHeader
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogoClick={onBack}
          searchPlaceholder="Tìm kiếm sản phẩm..."
          products={allProducts.map((p) => ({
            id: String(p.id),
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            base_price: p.base_price ?? 0,
            discount_percentage: p.discount_percentage ?? 0,
          }))}
          categories={categories.map((c: CategoryDto) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
          }))}
          onProductClick={onProductClick}
          onCategoryClick={(slug) => {
            window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(slug)}`);
            window.dispatchEvent(new Event("popstate"));
          }}
        />
        <MenuBar
          isScrolled={isScrolled}
          categories={categories.map((c: CategoryDto) => ({
            id: String(c.id),
            name: c.name,
            slug: slugify(c.name),
            icon: null,
          }))}
          selectedCategory={null}
          onSelectCategory={(slug) => {
            if (slug) {
              window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(slug)}`);
              window.dispatchEvent(new Event("popstate"));
            }
          }}
        />
      </div>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Back button under header */}
        <div className="mb-4 flex items-center">
          <button
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về</span>
          </button>
        </div>

        {/* Error States */}
        {productsErrorMsg && (
          <ErrorMessage
            title="Lỗi tải sản phẩm"
            message={productsErrorMsg}
            onRetry={handleRetryProducts}
            className="mb-4"
          />
        )}

        {packagesErrorMsg && (
          <ErrorMessage
            title="Lỗi tải gói sản phẩm"
            message={packagesErrorMsg}
            onRetry={handleRetryPackages}
            className="mb-4"
          />
        )}

        {productInfoErrorMsg && (
          <ErrorMessage
            title="Lỗi tải thông tin chi tiết"
            message={productInfoErrorMsg}
            onRetry={handleRetryProductInfo}
            className="mb-4"
          />
        )}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:mb-10 sm:gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6 lg:space-y-8 w-full">
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg transition-all dark:border-slate-700/50 dark:bg-slate-800 sm:rounded-2xl sm:p-1.5 sm:shadow-xl">
              <img
                src={productInfo?.image_url || product.image_url || "https://placehold.co/800x600?text=No+Image"}
                alt={`Hình ảnh chi tiết sản phẩm ${product.name}${product.description ? ` - ${product.description.substring(0, 150)}` : ''}`}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full rounded-2xl object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700/50 dark:bg-slate-800/80 sm:rounded-2xl sm:p-5 sm:shadow-xl">
              <h1 className="mb-2 text-xl font-bold tracking-tight text-gray-900 sm:mb-3 sm:text-2xl dark:text-white">
                {product.name}
              </h1>

              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 pb-4 dark:border-slate-700 sm:mb-6 sm:gap-x-6 sm:gap-y-3 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.average_rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200 dark:text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{product.average_rating.toFixed(1)}</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-slate-400">({reviews.length} đánh giá)</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">{product.sales_count.toLocaleString("vi-VN")} đã bán</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { icon: Shield, label: "Bản quyền chính hãng", color: "text-blue-600" },
                  { icon: Package, label: "Hỗ trợ cài đặt", color: "text-indigo-600" },
                  { icon: Users, label: "Hỗ trợ kỹ thuật 24/7", color: "text-cyan-600" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-700/30 dark:hover:bg-slate-700/50">
                    <item.icon className={`mb-2 h-6 w-6 ${item.color}`} />
                    <p className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {packages.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700/50 dark:bg-slate-900/90 sm:rounded-2xl sm:p-5 sm:shadow-2xl space-y-5 sm:space-y-6">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/20">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chọn gói sản phẩm</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Lựa chọn phiên bản phù hợp với nhu cầu</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {packages.map((pkg) => {
                    // Determine tags for this package
                    const isNew = isNewPackage(pkg.created_at);
                    const isHot = (pkg.sold_count_30d || 0) > 10;
                    const hasSale = pkg.has_promo === true;
                    
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => {
                          setSelectedPackage(pkg.id);
                          setSelectedDuration(null);
                          updateURL(pkg.id, null);
                        }}
                        className={`group cursor-pointer relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all duration-300 sm:rounded-2xl sm:p-4 ${
                          selectedPackage === pkg.id
                            ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-50 dark:border-blue-500 dark:bg-blue-500/10 dark:ring-blue-900/20"
                            : "border-gray-100 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
                        }`}
                      >
                        {/* Tags */}
                        {(isHot || isNew || hasSale) && (
                          <div className="absolute right-2 top-2 z-20 flex flex-wrap gap-1 justify-end">
                            {isHot && (
                              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-orange-400/50">
                                HOT
                              </span>
                            )}
                            {isNew && !isHot && (
                              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-blue-400/50">
                                NEW
                              </span>
                            )}
                            {hasSale && (
                              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-emerald-400/50">
                                SALE
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="relative z-10">
                          <div className={`mb-2 font-bold transition-colors ${selectedPackage === pkg.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                            {pkg.name}
                          </div>
                          <ul className="space-y-1.5">
                            {(pkg.features ?? []).slice(0, 2).map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2 text-[11px] font-medium text-gray-600 dark:text-slate-300">
                                <Check className={`h-3.5 w-3.5 flex-shrink-0 ${selectedPackage === pkg.id ? 'text-blue-600 dark:text-blue-400' : 'text-green-500'}`} />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className={`absolute right-0 top-0 h-full w-1 transition-all ${selectedPackage === pkg.id ? 'bg-blue-600 opacity-100' : 'bg-transparent opacity-0 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {durationOptions.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 dark:bg-cyan-500 shadow-lg shadow-cyan-500/20">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thời gian gia hạn</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Gia hạn càng lâu, ưu đãi càng lớn</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {durationOptions.map((option: any) => {
                      const discountPctRaw = Number(option.pct_promo) || 0;
                      const hasPromo = discountPctRaw > 0;
                      const promoPrice = hasPromo 
                        ? roundToNearestThousand(option.price * (1 - (discountPctRaw > 1 ? discountPctRaw/100 : discountPctRaw)))
                        : option.price;

                      return (
                        <button
                          key={option.key}
                          onClick={() => {
                            setSelectedDuration(option.key);
                            updateURL(selectedPackage, option.key);
                          }}
                          className={`group cursor-pointer relative flex flex-col justify-between rounded-xl border-2 p-3 text-left transition-all duration-300 sm:rounded-2xl sm:p-4 ${
                            selectedDuration === option.key
                              ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-50 dark:border-blue-500 dark:bg-blue-500/10 dark:ring-blue-900/20"
                              : "border-gray-100 bg-white hover:border-blue-200 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
                          }`}
                        >
                          {hasPromo && (
                            <div className="absolute -right-2 -top-2 z-20">
                              <span className="flex h-7 items-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-2.5 text-[10px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-900">
                                -{discountPctRaw > 1 ? Math.round(discountPctRaw) : Math.round(discountPctRaw * 100)}%
                              </span>
                            </div>
                          )}
                          
                          <div className="mb-4 flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-full border-2 transition-all ${selectedDuration === option.key ? 'border-blue-600 bg-blue-600 ring-4 ring-blue-100' : 'border-gray-300 dark:border-slate-600'}`}>
                              {selectedDuration === option.key && <Check className="h-full w-full text-white p-0.5" />}
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{option.label}</span>
                          </div>

                          <div className="mt-auto">
                            {hasPromo && (
                              <div className="mb-0.5 text-[10px] font-bold text-gray-400 line-through">
                                {formatCurrency(option.price)}
                              </div>
                            )}
                            <div className={`text-xl font-bold ${hasPromo ? 'text-red-600 dark:text-red-500' : 'text-blue-700 dark:text-blue-400'}`}>
                              {formatCurrency(promoPrice)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  disabled={!selectedPackage || !selectedDuration}
                  className={`group cursor-pointer relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl py-4 text-lg font-bold text-white transition-all active:scale-[0.98] sm:rounded-2xl sm:py-5 sm:text-xl ${
                    selectedPackage && selectedDuration 
                      ? "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl shadow-blue-500/40 hover:scale-[1.02] hover:shadow-blue-500/60"
                      : "bg-gray-200 cursor-not-allowed dark:bg-slate-700"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <ShoppingCart className={`h-6 w-6 ${(!selectedPackage || !selectedDuration) && 'text-gray-400'}`} />
                  <span>Mua ngay ngay</span>
                  {selectedDurationData && (
                    <span className="ml-1 rounded-lg bg-white/20 px-2 py-0.5 text-sm font-bold backdrop-blur-sm">
                      {(() => {
                        const discountPctRaw = Number((selectedDurationData as any).pct_promo) || 0;
                        const hasPromo = discountPctRaw > 0;
                        const finalPrice = hasPromo 
                          ? roundToNearestThousand(selectedDurationData.price * (1 - (discountPctRaw > 1 ? discountPctRaw/100 : discountPctRaw)))
                          : selectedDurationData.price;
                        return formatCurrency(finalPrice);
                      })()}
                    </span>
                  )}
                </button>
                {!selectedPackage && (
                  <p className="mt-4 text-center text-xs font-semibold text-red-500 animate-pulse">
                    * Vui lòng chọn gói sản phẩm
                  </p>
                )}
                {selectedPackage && !selectedDuration && (
                  <p className="mt-4 text-center text-xs font-semibold text-red-500 animate-pulse">
                    * Vui lòng chọn thời gian sử dụng
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700/50 dark:bg-slate-800 sm:rounded-2xl sm:shadow-xl">
              <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6 sm:py-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">Chi tiết sản phẩm</h2>
              </div>
              <div className="p-5 sm:p-6">
                {productInfo?.description ? (
                  <div 
                    className="prose prose-blue max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(productInfo.description) }}
                  />
                ) : (
                  <div className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-slate-300">
                    {product.description || "Chưa có mô tả chi tiết."}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700/50 dark:bg-slate-800 sm:rounded-2xl sm:shadow-xl">
              <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-6 sm:py-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">Đánh giá thực tế ({reviews.length})</h2>
              </div>
              <div className="p-5 sm:p-6">
                <div className="space-y-8">
                  {reviews.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Star className="mb-4 h-12 w-12 text-gray-200 dark:text-slate-700" />
                      <p className="text-gray-500 dark:text-slate-400">Sản phẩm này hiện chưa có đánh giá công khai.</p>
                    </div>
                  )}
                  {reviews.map((review) => (
                    <div key={review.id} className="group relative">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
                            {review.customer_name[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-gray-900 dark:text-white">{review.customer_name}</span>
                            <span className="text-xs text-gray-400">Khách hàng đã mua</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-700/30">
                        <p className="italic text-gray-600 dark:text-slate-300">"{review.comment}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-gray-200/50 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 shadow-xl shadow-blue-500/20 text-white">
                <h3 className="mb-4 text-lg font-bold">Chính sách mua hàng</h3>
                <div className="space-y-4 text-sm font-medium leading-relaxed text-blue-50/90">
                  {productInfo?.purchase_rules ? (
                    <div 
                      className="prose prose-sm prose-invert"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(productInfo.purchase_rules || "") }}
                    />
                  ) : (
                    <p>{product.purchase_rules || "Quý khách vui lòng kiểm tra kỹ gói sản phẩm trước khi thanh toán. Liên hệ hỗ trợ nếu cần tư vấn."}</p>
                  )}
                </div>
                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-200" />
                    <span className="text-sm font-bold">Thanh toán bảo mật 100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  {...relatedProduct}
                  onClick={() => onProductClick(relatedProduct.slug)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
