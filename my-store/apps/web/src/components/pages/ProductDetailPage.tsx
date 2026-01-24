import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Package, Shield, ShoppingCart, Star, Users } from "lucide-react";

import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { fetchProductPackages, fetchProducts, fetchProductInfo, type ProductDto, type ProductPackageDto } from "@/lib/api";
import { roundToNearestThousand } from "@/lib/pricing";
import { categoriesMock, productPackagesMock, productsMock, reviewsMock } from "@/lib/mockData";

interface ProductDetailPageProps {
  slug: string;
  onBack: () => void;
  onProductClick: (slug: string) => void;
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

export default function ProductDetailPage({ slug, onBack, onProductClick }: ProductDetailPageProps) {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  
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

  const productData = useMemo(() => 
    allProducts.find((p) => p.slug === slug) ?? null
  , [allProducts, slug]);

  const { 
    data: packageData = [], 
    isLoading: loadingPackages 
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
    isLoading: loadingProductInfo
  } = useQuery({
    queryKey: ["product-info", baseName],
    queryFn: () => baseName ? fetchProductInfo(baseName) : Promise.resolve(null),
    enabled: !!baseName,
  });

  const loading = loadingProducts || (!!productData?.package && loadingPackages);
  const error = productsError ? "Không thể tải được sản phẩm" : null;

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
        
        if (!existing || (costValue > 0 && (existing.price === 0 || costValue < existing.price))) {
          dedup.set(packageKey, {
            id: variantName, 
            product_id: product.id,
            name: variantName,
            price: roundToNearestThousand(pkg.cost),
            features: [],
            duration_months: null,
            created_at: new Date().toISOString(),
          });
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

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0].id);
    }
  }, [packages, selectedPackage]);

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
          <p className="mb-4 text-gray-600 dark:text-slate-400">
            {error ? error : "Không thể tải được sản phẩm"}
          </p>
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
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Quay lại</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6 lg:space-y-8 w-full max-w-2xl mx-auto lg:mx-0">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm w-full max-w-2xl mx-auto dark:border-slate-700 dark:bg-slate-800">
              <img
                src={productInfo?.image_url || product.image_url || "https://placehold.co/800x600?text=No+Image"}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="h-64 w-full object-cover sm:h-72"
              />
            </div>

            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6 dark:border-slate-700 dark:bg-slate-800">
              <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>

              <div className="mb-6 flex items-center gap-6 border-b border-gray-100 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.average_rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-slate-200">{product.average_rating.toFixed(1)}</span>
                  <span className="text-gray-400 dark:text-slate-400">({reviews.length} Đánh giá)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                  <Users className="h-5 w-5" />
                  <span>{product.sales_count.toLocaleString("vi-VN")} lượt bán</span>
                </div>
              </div>

              {packages.length === 0 && (
                <div className="mb-6">
                  <div className="mb-4 flex items-end gap-4">
                    {product.discount_percentage > 0 && (
                      <div className="text-xl text-gray-400 line-through">
                        {formatCurrency(product.base_price)}
                      </div>
                    )}
                    <div className="text-4xl font-bold text-blue-600">{formatCurrency(discountedPrice)}</div>
                    {product.discount_percentage > 0 && (
                      <div className="rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                        -{product.discount_percentage}%
                      </div>
                    )}
                  </div>
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-4 text-lg font-semibold text-white transition-all hover:shadow-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Mua ngay
                    <span>- {formatCurrency(discountedPrice)}</span>
                  </button>
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-slate-700 p-4 text-center">
                  <Shield className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-gray-600 dark:text-slate-300">Bản quyền chính hãng</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-slate-700 p-4 text-center">
                  <Package className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-gray-600 dark:text-slate-300">Hỗ trợ cài đặt</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-slate-700 p-4 text-center">
                  <Users className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-gray-600 dark:text-slate-300">Hỗ trợ 24/7</p>
                </div>
              </div>
            </div>
          </div>

          {packages.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm space-y-6 w-full dark:border-slate-700 dark:bg-slate-800">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chọn gói sản phẩm</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackage(pkg.id);
                        setSelectedDuration(null);
                        updateURL(pkg.id, null);
                      }}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        selectedPackage === pkg.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950 dark:border-blue-500"
                          : "border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="mb-1 font-semibold text-gray-900 dark:text-white">{pkg.name}</div>
                      <ul className="space-y-0.5">
                        {(pkg.features ?? []).slice(0, 2).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-300">
                            <Check className="h-3 w-3 flex-shrink-0 text-green-500 dark:text-green-400" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {pkg.features && pkg.features.length > 2 && (
                          <li className="pl-4 text-xs text-gray-500 dark:text-slate-400">
                            +{pkg.features.length - 2} tính năng khác
                          </li>
                        )}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              {durationOptions.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chọn thời gian sử dụng</h3>
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
                          className={`relative flex flex-col justify-between rounded-xl border-2 p-4 text-left transition-all duration-300 ${
                            selectedDuration === option.key
                              ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-100 dark:border-blue-500 dark:bg-blue-900/20 dark:ring-blue-900/20"
                              : "border-gray-100 bg-white hover:border-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                          }`}
                        >
                          {hasPromo && (
                            <div className="absolute -right-1 -top-1 z-10">
                              <span className="flex h-6 items-center rounded-full bg-red-500 px-2 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-800">
                                SALE {discountPctRaw > 1 ? Math.round(discountPctRaw) : Math.round(discountPctRaw * 100)}%
                              </span>
                            </div>
                          )}
                          
                          <div className="mb-3 flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${selectedDuration === option.key ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`} />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</span>
                          </div>

                          <div className="mt-auto">
                            {hasPromo && (
                              <div className="text-[10px] font-medium text-gray-400 line-through">
                                {formatCurrency(option.price)}
                              </div>
                            )}
                            <div className={`text-lg font-bold ${hasPromo ? 'text-red-500 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {formatCurrency(promoPrice)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-5 text-xl font-bold text-white transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98]">
                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <ShoppingCart className="h-6 w-6" />
                <span>Mua ngay</span>
                {selectedDurationData && (
                  <span className="ml-1 text-blue-100/90">
                    - {(() => {
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
            </div>
          )}
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Mô tả sản phẩm</h2>
              {productInfo?.description ? (
                <div 
                  className="leading-relaxed text-gray-600 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: productInfo.description }}
                />
              ) : (
                <div className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-slate-300">
                  {product.description || "Chưa có mô tả chi tiết."}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Đánh giá ({reviews.length})</h2>
              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-gray-500 dark:text-slate-400">Chưa có đánh giá.</p>}
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 dark:border-slate-700 pb-4 last:border-0">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">{review.customer_name}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Quy tắc mua hàng</h3>
              {productInfo?.purchase_rules ? (
                <div 
                  className="text-sm leading-relaxed text-gray-600 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: productInfo.purchase_rules }}
                />
              ) : (
                <div className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                  {product.purchase_rules || "Vui lòng đọc kỹ điều khoản trước khi mua."}
                </div>
              )}
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
