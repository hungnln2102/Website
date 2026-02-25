import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProductPackages, fetchProducts, fetchProductInfo, fetchCategories, type CategoryDto } from "@/lib/api";
import { roundToNearestThousand } from "@/lib/pricing";
import { productsMock, productPackagesMock, reviewsMock } from "@/lib/mockData";
import { parseDurationToken } from "../utils";
import type { DurationOption } from "../components/DurationSelector";

export function useProductData(slug: string, selectedPackage: string | null) {
  const queryClient = useQueryClient();

  // Fetch all products
  const {
    data: allProducts = [],
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Find current product
  const productData = useMemo(
    () => allProducts.find((p) => p.slug === slug) ?? null,
    [allProducts, slug]
  );

  // Fetch packages
  const {
    data: packageData = [],
    isLoading: loadingPackages,
    error: packagesError,
    refetch: refetchPackages,
  } = useQuery({
    queryKey: ["product-packages", productData?.package],
    queryFn: () =>
      productData?.package ? fetchProductPackages(productData.package) : Promise.resolve([]),
    enabled: !!productData?.package,
  });

  // Extract base_name for product info
  const baseName = useMemo(() => {
    if (packageData.length === 0) return null;
    const firstItem = packageData[0];
    const idProduct = firstItem.id_product || firstItem.package_product || "";
    return idProduct.split("--")[0] || null;
  }, [packageData]);

  // Fetch product info
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

  // Map product data
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
    [productData]
  );

  const product = mappedProduct ?? (productsMock.find((p) => p.slug === slug) || null);
  const packagesFromMock = product ? productPackagesMock.filter((p) => p.product_id === product.id) : [];

  // Process packages
  const packages = useMemo(() => {
    if (!product) return [];

    if (packageData.length > 0) {
      const dedup = new Map<string, any>();
      packageData.forEach((pkg) => {
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
          if (!existing.image_url && pkg.image_url) existing.image_url = pkg.image_url;
          if (!existing.description && pkg.description) existing.description = pkg.description;
          if (!existing.purchase_rules && pkg.purchase_rules) existing.purchase_rules = pkg.purchase_rules;
        }
      });
      return Array.from(dedup.values());
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
  }, [packageData, product, packagesFromMock]);

  // Process duration options
  const durationOptions = useMemo<DurationOption[]>(() => {
    if (!product) return [];

    if (packageData.length > 0) {
      const activePackageKey = (selectedPackage || "").toLowerCase();
      if (!activePackageKey) return [];

      const options = new Map<string, DurationOption>();
      packageData.forEach((pkg, idx) => {
        const packageKey = (pkg.package_product ?? pkg.package ?? "").trim().toLowerCase();
        if (packageKey !== activePackageKey) return;

        const duration = parseDurationToken(pkg.id_product);
        const price = roundToNearestThousand(pkg.cost);
        const key = duration?.key ?? (pkg.id_product?.trim() || `opt-${idx}`);
        const label = duration?.label ?? (pkg.id_product?.trim() || "Gói");
        const sortValue = duration?.sortValue ?? Number.MAX_SAFE_INTEGER;
        const isActive = pkg.is_active !== false;
        const formId = pkg.form_id != null ? Number(pkg.form_id) : null;

        const existing = options.get(key);
        if (!existing || (price > 0 && (existing.price === 0 || price < existing.price))) {
          options.set(key, {
            id: pkg.id,
            key,
            label,
            price,
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
  }, [packageData, product, selectedPackage]);

  // Selected package info
  const selectedPackageImageUrl = useMemo(() => {
    if (!selectedPackage || !packages.length) return null;
    const pkg = packages.find((p: any) => p.id === selectedPackage);
    return pkg?.image_url || null;
  }, [selectedPackage, packages]);

  const selectedPackageInfo = useMemo(() => {
    if (!selectedPackage || !packages.length) return { description: null, purchase_rules: null };
    const pkg = packages.find((p: any) => p.id === selectedPackage);
    return {
      description: pkg?.description || null,
      purchase_rules: pkg?.purchase_rules || null,
    };
  }, [selectedPackage, packages]);

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

    // Loading
    loading: loadingProducts || (!!productData?.package && loadingPackages),
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
