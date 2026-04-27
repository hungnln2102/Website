import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductPackages,
  fetchProducts,
  fetchProductInfo,
  fetchCategories,
  productsQueryKey,
  type CategoryDto,
} from "@/lib/api";
import { useAuth } from "@/features/auth/hooks";
import { roundToNearestThousand } from "@/lib/pricing";
import { productsMock, productPackagesMock, reviewsMock } from "@/lib/mockData";
import { slugify } from "@/lib/utils";
import {
  packageVariantDurationKey,
  parseDurationToken,
  resolveDurationOptionKey,
} from "../utils";
import type { DurationOption } from "../components/DurationSelector";

export function useProductData(
  slug: string,
  selectedPackage: string | null,
  selectedDuration: string | null
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const legacyPackageQuery = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("package")?.trim() || null;
  }, []);

  // Fetch all products
  const {
    data: allProducts = [],
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: productsQueryKey(user?.roleCode),
    queryFn: fetchProducts,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Find current product
  const productData = useMemo(() => {
    const exactMatch = allProducts.find((p) => p.slug === slug) ?? null;
    if (exactMatch) return exactMatch;

    const normalizedTargets = [legacyPackageQuery, slug]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => slugify(value));

    if (normalizedTargets.length === 0) return null;

    return (
      allProducts.find((product) => {
        const productKeys = [product.slug, product.name, product.package]
          .filter((value): value is string => Boolean(value?.trim()))
          .map((value) => slugify(value));

        return normalizedTargets.some((target) =>
          productKeys.some(
            (key) =>
              key === target ||
              key.includes(target) ||
              target.includes(key)
          )
        );
      }) ?? null
    );
  }, [allProducts, legacyPackageQuery, slug]);

  // Fetch packages (không default [] để phân biệt đang tải vs rỗng)
  const {
    data: packageData,
    isLoading: loadingPackages,
    error: packagesError,
    refetch: refetchPackages,
  } = useQuery({
    queryKey: ["product-packages", productData?.package],
    queryFn: () =>
      productData?.package ? fetchProductPackages(productData.package) : Promise.resolve([]),
    enabled: !!productData?.package,
  });

  const packagesList = Array.isArray(packageData) ? packageData : [];

  // Map product data
  const mappedProduct = useMemo(
    () =>
      productData
        ? {
            id: String(productData.id),
            category_id:
              productData.category_id != null
                ? String(productData.category_id)
                : null,
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
            short_description: productData.short_description ?? null,
            full_description: productData.full_description ?? null,
            seo_title: productData.seo_title ?? null,
            image_alt: productData.image_alt ?? null,
            base_price: productData.base_price ?? 0,
            image_url: productData.image_url,
            is_featured: false,
            discount_percentage: productData.discount_percentage ?? 0,
            sales_count: productData.sales_count ?? 0,
            average_rating: productData.average_rating ?? 0,
            purchase_rules: productData.purchase_rules ?? null,
            created_at: new Date().toISOString(),
          }
        : null,
    [productData]
  );

  const product = mappedProduct ?? (productsMock.find((p) => p.slug === slug) || null);
  const packagesFromMock = product ? productPackagesMock.filter((p) => p.product_id === product.id) : [];

  // Process packages
  const packages = useMemo(() => {
    if (!product) return [];

    if (packagesList.length > 0) {
      const dedup = new Map<string, any>();
      packagesList.forEach((pkg) => {
        const variantName = pkg.package_product?.trim() || pkg.package?.trim() || "Gói";
        const packageKey = variantName.toLowerCase();
        const costValue = Number(pkg.cost) || 0;
        const existing = dedup.get(packageKey);
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
            has_promo: existing ? existing.has_promo || pctPromo > 0 : pctPromo > 0,
            short_description: pkg.short_description || existing?.short_description || null,
            image_url: pkg.image_url || existing?.image_url || null,
            description: pkg.description || existing?.description || null,
            purchase_rules: pkg.purchase_rules || existing?.purchase_rules || null,
          });
        } else if (existing) {
          existing.sold_count_30d = Math.max(existing.sold_count_30d || 0, soldCount30d);
          existing.has_promo = existing.has_promo || pctPromo > 0;
          if (createdAt && (!existing.created_at || new Date(createdAt) < new Date(existing.created_at))) {
            existing.created_at = createdAt;
          }
          if (!existing.short_description && pkg.short_description) {
            existing.short_description = pkg.short_description;
          }
          if (!existing.image_url && pkg.image_url) existing.image_url = pkg.image_url;
          if (!existing.description && pkg.description) existing.description = pkg.description;
          if (!existing.purchase_rules && pkg.purchase_rules) existing.purchase_rules = pkg.purchase_rules;
        }
      });
      // Nếu mọi thời hạn của gói đều hết hàng thì gói cũng không cho chọn
      const list = Array.from(dedup.values());
      list.forEach((pkg) => {
        const packageKey = (pkg.name || "").trim().toLowerCase();
        pkg.has_available_duration = packagesList.some(
          (p) =>
            ((p.package_product ?? p.package ?? "").trim().toLowerCase() === packageKey) &&
            p.is_active !== false
        );
      });
      return list;
    }

    if (packagesFromMock.length > 0) return packagesFromMock;

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
      },
    ];
  }, [packagesList, product, packagesFromMock]);

  // Process duration options
  const durationOptions = useMemo<DurationOption[]>(() => {
    if (!product) return [];

    if (packagesList.length > 0) {
      const activePackageKey = (selectedPackage || "").toLowerCase();
      if (!activePackageKey) return [];

      const options = new Map<string, DurationOption>();
      packagesList.forEach((pkg, idx) => {
        const packageKey = (pkg.package_product ?? pkg.package ?? "").trim().toLowerCase();
        if (packageKey !== activePackageKey) return;

        const duration = parseDurationToken(pkg.id_product);
        const price = roundToNearestThousand(pkg.cost);
        const pctPromo = Number(pkg.pct_promo) || 0;
        const promoRaw = Number((pkg as { promo_cost?: number }).promo_cost);
        const promoPrice =
          pctPromo > 0 && Number.isFinite(promoRaw) && promoRaw > 0
            ? roundToNearestThousand(promoRaw)
            : undefined;
        const key = packageVariantDurationKey(pkg.id_product, idx);
        const label = duration?.label ?? (pkg.id_product?.trim() || "Gói");
        const sortValue = duration?.sortValue ?? Number.MAX_SAFE_INTEGER;
        const isActive = pkg.is_active !== false;
        const formId = pkg.form_id != null ? Number(pkg.form_id) : null;

        const existing = options.get(key);
        if (!existing || (price > 0 && (existing.price === 0 || price < existing.price))) {
          options.set(key, {
            id: pkg.id,
            id_product: pkg.id_product ?? null,
            key,
            label,
            price,
            promoPrice,
            sortValue,
            pct_promo: pkg.pct_promo,
            is_active: isActive,
            form_id: formId,
          });
        }
      });

      return Array.from(options.values()).sort((a, b) => a.sortValue - b.sortValue || a.price - b.price);
    }

    const base = Math.max(0, roundToNearestThousand(product.base_price));
    return [
      { id: undefined, key: "12m", label: "12 tháng", price: base, sortValue: 12, is_active: true },
      { id: undefined, key: "24m", label: "24 tháng", price: roundToNearestThousand(base * 1.8), sortValue: 24, is_active: true },
      { id: undefined, key: "36m", label: "36 tháng", price: roundToNearestThousand(base * 2.5), sortValue: 36, is_active: true },
    ];
  }, [packagesList, product, selectedPackage]);

  /** Cùng dòng variant với mục đã chọn trên Thời gian gia hạn (theo `id` option, fallback cùng key) */
  const matchedPackageVariant = useMemo(() => {
    if (!selectedPackage || !selectedDuration || packagesList.length === 0) {
      return null;
    }
    const resolvedKey =
      resolveDurationOptionKey(selectedDuration, durationOptions) ?? selectedDuration;
    const opt = durationOptions.find((o) => o.key === resolvedKey);
    if (opt != null && opt.id != null && String(opt.id) !== "") {
      const byId = packagesList.find((p) => String(p.id) === String(opt.id));
      if (byId) return byId;
    }
    const normalizedPackageKey = selectedPackage.trim().toLowerCase();
    return (
      packagesList.find((pkg, idx) => {
        const packageKey = (pkg.package_product ?? pkg.package ?? "").trim().toLowerCase();
        if (packageKey !== normalizedPackageKey) return false;
        return packageVariantDurationKey(pkg.id_product, idx) === resolvedKey;
      }) ?? null
    );
  }, [durationOptions, packagesList, selectedDuration, selectedPackage]);

  const baseName = useMemo(() => {
    const idProduct =
      matchedPackageVariant?.id_product ||
      matchedPackageVariant?.package_product ||
      "";
    return idProduct.split("--")[0] || null;
  }, [matchedPackageVariant]);

  const {
    data: productInfo,
    isLoading: loadingProductInfo,
    error: productInfoError,
    refetch: refetchProductInfo,
  } = useQuery({
    queryKey: ["product-info", baseName],
    queryFn: () => (baseName ? fetchProductInfo(baseName) : Promise.resolve(null)),
    enabled: !!baseName,
  });

  // Ảnh gallery: chưa chọn gói → null (ảnh product); chỉ gói → ảnh theo tên gói; gói + thời hạn → ảnh đúng hàng variant
  const selectedPackageImageUrl = useMemo(() => {
    if (!selectedPackage) return null;
    if (selectedDuration) {
      const rowUrl = matchedPackageVariant?.image_url?.trim();
      if (rowUrl) return rowUrl;
      if (matchedPackageVariant) {
        const vid = Number(matchedPackageVariant.id);
        const fromList = (productInfo as { variants?: Array<{ variant_id?: number; image_url?: string | null }> } | null)
          ?.variants?.find((v) => Number(v?.variant_id) === vid);
        const vUrl = fromList?.image_url?.trim();
        if (vUrl) return vUrl;
      }
      return null;
    }
    const pkg = packages.find((p: { id: string }) => p.id === selectedPackage);
    return pkg?.image_url || null;
  }, [matchedPackageVariant, productInfo, packages, selectedDuration, selectedPackage]);

  const selectedPackageInfo = useMemo(() => {
    if (!selectedPackage) {
      return {
        short_description: null,
        description: null,
        purchase_rules: null,
        seo_heading: null,
      };
    }

    if (matchedPackageVariant) {
      return {
        short_description: matchedPackageVariant.short_description || null,
        description: matchedPackageVariant.description || null,
        purchase_rules: matchedPackageVariant.purchase_rules || null,
        seo_heading: matchedPackageVariant.seo_heading || null,
      };
    }

    if (!selectedDuration || packagesList.length > 0) {
      return {
        short_description: null,
        description: null,
        purchase_rules: null,
        seo_heading: null,
      };
    }

    const pkg = packages.find((p: any) => p.id === selectedPackage);
    return {
      short_description: pkg?.short_description || null,
      description: pkg?.description || null,
      purchase_rules: pkg?.purchase_rules || null,
      seo_heading: pkg?.seo_heading || null,
    };
  }, [matchedPackageVariant, packagesList.length, packages, selectedDuration, selectedPackage]);

  // Reviews
  const reviews = product ? reviewsMock.filter((r) => r.product_id === product.id) : [];

  // Related products
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.slug !== slug)
      .slice(0, 3)
      .map((p) => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        description: p.description,
        base_price: p.base_price ?? 0,
        image_url: p.image_url,
        discount_percentage: p.discount_percentage ?? 0,
        sales_count: p.sales_count ?? 0,
        average_rating: p.average_rating ?? 0,
        package_count: p.package_count ?? 1,
      }));
  }, [allProducts, slug]);

  // Error messages
  const productsErrorMsg = productsError instanceof Error ? productsError.message : productsError ? "Không thể tải được sản phẩm" : null;
  const packagesErrorMsg = packagesError instanceof Error ? packagesError.message : packagesError ? "Không thể tải thông tin gói sản phẩm" : null;
  const productInfoErrorMsg = productInfoError instanceof Error ? productInfoError.message : productInfoError ? "Không thể tải thông tin chi tiết sản phẩm" : null;

  // Retry handlers
  const handleRetryProducts = () => queryClient.invalidateQueries({ queryKey: ["products"] });
  const handleRetryPackages = () => refetchPackages();
  const handleRetryProductInfo = () => refetchProductInfo();

  return {
    // Data
    product,
    packages,
    durationOptions,
    reviews,
    relatedProducts,
    productInfo,
    selectedPackageImageUrl,
    selectedPackageInfo,
    allProducts,
    categories,

    // Loading: danh sách SP; gói variant tải riêng để trang chi tiết hiện skeleton panel
    loading: loadingProducts,
    loadingPackagesPanel: Boolean(productData?.package && loadingPackages),
    loadingProductInfo,

    // Errors
    productsError: productsErrorMsg,
    packagesError: packagesErrorMsg,
    productInfoError: productInfoErrorMsg,

    // Retry
    handleRetryProducts,
    handleRetryPackages,
    handleRetryProductInfo,
  };
}
