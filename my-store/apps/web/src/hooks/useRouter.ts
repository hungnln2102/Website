import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  isFixAdobeEduPath,
  isNetflixPath,
  isRenewAdobePath,
  matchesAppRoute,
  normalizePathname,
} from "@/lib/constants/serviceHubRoutes";

export type View =
  | "home"
  | "product"
  | "category"
  | "new-products"
  | "best-selling"
  | "promotions"
  | "all-products"
  | "otp"
  | "renew-adobe"
  | "netflix"
  | "adobe-guide"
  | "login-forgot"
  | "login"
  | "cart"
  | "profile"
  | "topup"
  | "about"
  | "news"
  | "news-category"
  | "news-detail"
  | "payment-success"
  | "payment-error"
  | "payment-cancel";

interface RouteInfo {
  view: View;
  slug: string | null;
  parentPath: string | null;
}

const parsePath = (categories: CategoryDto[]): RouteInfo => {
  if (typeof window === "undefined") return { view: "home", slug: null, parentPath: null };
  const path = normalizePathname(window.location.pathname);
  if (!path) return { view: "home", slug: null, parentPath: null };

  if (matchesAppRoute(path, ROUTES.about))
    return { view: "about", slug: null, parentPath: ROUTES.home };

  const newsPath = normalizePathname(ROUTES.news);
  if (matchesAppRoute(path, ROUTES.news))
    return { view: "news", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${newsPath}/danh-muc/`)) {
    const categorySlug = decodeURIComponent(path.replace(`${newsPath}/danh-muc/`, ""));
    return { view: "news-category", slug: categorySlug, parentPath: ROUTES.news };
  }
  if (path.startsWith(`${newsPath}/`)) {
    const articleSlug = decodeURIComponent(path.replace(`${newsPath}/`, ""));
    return { view: "news-detail", slug: articleSlug, parentPath: ROUTES.news };
  }

  if (matchesAppRoute(path, ROUTES.login))
    return { view: "login", slug: null, parentPath: ROUTES.home };

  if (matchesAppRoute(path, ROUTES.register))
    return { view: "login", slug: "register", parentPath: ROUTES.home };

  if (matchesAppRoute(path, ROUTES.forgotPassword))
    return { view: "login-forgot", slug: null, parentPath: ROUTES.login };

  if (matchesAppRoute(path, ROUTES.cart))
    return { view: "cart", slug: null, parentPath: ROUTES.home };

  if (matchesAppRoute(path, ROUTES.profile))
    return { view: "profile", slug: null, parentPath: ROUTES.home };

  if (isFixAdobeEduPath(path))
    return { view: "otp", slug: null, parentPath: ROUTES.home };

  /** URL Renew Zoom đã bỏ — chuyển về trung tâm gói Adobe Edu. */
  const legacyZoom = new Set([
    "system/renew-zoom",
    "renew-zoom",
  ]);
  if (legacyZoom.has(path)) {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", ROUTES.fixAdobeEdu);
    }
    return { view: "otp", slug: null, parentPath: ROUTES.fixAdobeEdu };
  }

  if (isRenewAdobePath(path))
    return { view: "renew-adobe", slug: null, parentPath: ROUTES.fixAdobeEdu };
  if (isNetflixPath(path))
    return { view: "netflix", slug: null, parentPath: ROUTES.fixAdobeEdu };

  if (matchesAppRoute(path, ROUTES.adobeGuide))
    return { view: "adobe-guide", slug: null, parentPath: ROUTES.fixAdobeEdu };

  if (matchesAppRoute(path, ROUTES.topup))
    return { view: "topup", slug: null, parentPath: ROUTES.home };

  if (matchesAppRoute(path, ROUTES.paymentSuccess))
    return { view: "payment-success", slug: null, parentPath: ROUTES.home };

  if (matchesAppRoute(path, ROUTES.paymentError))
    return { view: "payment-error", slug: null, parentPath: ROUTES.home };

  if (matchesAppRoute(path, ROUTES.paymentCancel))
    return { view: "payment-cancel", slug: null, parentPath: ROUTES.home };

  const newProductsPath = normalizePathname(ROUTES.newProducts);
  if (matchesAppRoute(path, ROUTES.newProducts))
    return { view: "new-products", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${newProductsPath}/`)) {
    const productSlug = decodeURIComponent(path.replace(`${newProductsPath}/`, ""));
    return { view: "product", slug: productSlug, parentPath: ROUTES.newProducts };
  }

  const bestSellingPath = normalizePathname(ROUTES.bestSelling);
  if (matchesAppRoute(path, ROUTES.bestSelling))
    return { view: "best-selling", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${bestSellingPath}/`)) {
    const productSlug = decodeURIComponent(path.replace(`${bestSellingPath}/`, ""));
    return { view: "product", slug: productSlug, parentPath: ROUTES.bestSelling };
  }

  const promotionsPath = normalizePathname(ROUTES.promotions);
  if (matchesAppRoute(path, ROUTES.promotions))
    return { view: "promotions", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${promotionsPath}/`)) {
    const productSlug = decodeURIComponent(path.replace(`${promotionsPath}/`, ""));
    return { view: "product", slug: productSlug, parentPath: ROUTES.promotions };
  }

  const allProductsPath = normalizePathname(ROUTES.allProducts);
  if (matchesAppRoute(path, ROUTES.allProducts))
    return { view: "all-products", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${allProductsPath}/`)) {
    const productSlug = decodeURIComponent(path.replace(`${allProductsPath}/`, ""));
    return { view: "product", slug: productSlug, parentPath: ROUTES.allProducts };
  }

  if (path.startsWith("danh-muc/")) {
    const rest = path.replace("danh-muc/", "");
    const parts = rest.split("/");
    const categorySlug = decodeURIComponent(parts[0]);
    const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === categorySlug);

    if (isCategory) {
      if (parts.length > 1) {
        const productSlug = decodeURIComponent(parts[1]);
        return { view: "product", slug: productSlug, parentPath: ROUTES.category(categorySlug) };
      }
      return { view: "category", slug: categorySlug, parentPath: ROUTES.home };
    }
  }

  const decodedPath = decodeURIComponent(path);
  const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === decodedPath);
  if (isCategory) {
    return { view: "category", slug: decodedPath, parentPath: ROUTES.home };
  }

  return { view: "product", slug: decodedPath, parentPath: ROUTES.home };
};

export function useRouter() {
  const [view, setView] = useState<View>("home");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const applyRoute = useCallback(
    (route: RouteInfo) => {
      setView(route.view);
      setSelectedSlug(route.slug);
      setParentPath(route.parentPath);
    },
    []
  );

  // Initialize route from URL
  useEffect(() => {
    applyRoute(parsePath(categories));
  }, [categories, applyRoute]);

  // Sync with browser popstate (back/forward navigation)
  useEffect(() => {
    const onPopState = () => applyRoute(parsePath(categories));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [categories, applyRoute]);

  const getCurrentBasePath = useCallback(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (path === ROUTES.allProducts.replace(/^\/+|\/+$/g, "")) return ROUTES.allProducts;
    if (path === ROUTES.newProducts.replace(/^\/+|\/+$/g, "")) return ROUTES.newProducts;
    if (path === ROUTES.bestSelling.replace(/^\/+|\/+$/g, "")) return ROUTES.bestSelling;
    if (path === ROUTES.promotions.replace(/^\/+|\/+$/g, "")) return ROUTES.promotions;
    if (path.startsWith("danh-muc/")) {
      const parts = path.split("/");
      if (parts.length >= 2) return ROUTES.category(decodeURIComponent(parts[1]));
    }
    return "";
  }, []);

  const handleProductClick = useCallback(
    (slug: string, isCategorySlug: boolean = false) => {
      const isCategory = isCategorySlug || categories.some((c: CategoryDto) => slugify(c.name) === slug);

      if (isCategory) {
        const url = ROUTES.category(slug);
        window.history.pushState({}, "", url);
        setSelectedSlug(slug);
        setParentPath(ROUTES.home);
        setView("category");
      } else {
        const basePath = getCurrentBasePath();
        const url = basePath ? `${basePath}/${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}`;
        window.history.pushState({}, "", url);
        setSelectedSlug(slug);
        setParentPath(basePath || ROUTES.home);
        setView("product");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [categories, getCurrentBasePath]
  );

  const handleBack = useCallback(() => {
    const backPath = parentPath || ROUTES.home;
    window.history.pushState({}, "", backPath);
    applyRoute(parsePath(categories));
    if (backPath === ROUTES.home) setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [parentPath, categories, applyRoute]);

  return {
    view,
    selectedSlug,
    searchQuery,
    setSearchQuery,
    handleProductClick,
    handleBack,
  };
}
