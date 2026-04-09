import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

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
  | "renew-zoom"
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
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return { view: "home", slug: null, parentPath: null };

  const aboutPath = ROUTES.about.replace(/^\/+|\/+$/g, "");
  if (path === aboutPath || path === "about")
    return { view: "about", slug: null, parentPath: ROUTES.home };

  const newsPath = ROUTES.news.replace(/^\/+|\/+$/g, "");
  if (path === newsPath || path === "tin-tuc")
    return { view: "news", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${newsPath}/danh-muc/`)) {
    const categorySlug = decodeURIComponent(path.replace(`${newsPath}/danh-muc/`, ""));
    return { view: "news-category", slug: categorySlug, parentPath: ROUTES.news };
  }
  if (path.startsWith(`${newsPath}/`)) {
    const articleSlug = decodeURIComponent(path.replace(`${newsPath}/`, ""));
    return { view: "news-detail", slug: articleSlug, parentPath: ROUTES.news };
  }

  const loginPath = ROUTES.login.replace(/^\/+|\/+$/g, "");
  if (path === loginPath)
    return { view: "login", slug: null, parentPath: ROUTES.home };

  if (path === "register")
    return { view: "login", slug: "register", parentPath: ROUTES.home };

  const forgotPath = ROUTES.forgotPassword.replace(/^\/+|\/+$/g, "");
  if (path === forgotPath || path === "forgot-password")
    return { view: "login-forgot", slug: null, parentPath: ROUTES.login };

  const cartPath = ROUTES.cart.replace(/^\/+|\/+$/g, "");
  if (path === cartPath || path === "cart")
    return { view: "cart", slug: null, parentPath: ROUTES.home };

  const profilePath = ROUTES.profile.replace(/^\/+|\/+$/g, "");
  if (path === profilePath || path === "profile")
    return { view: "profile", slug: null, parentPath: ROUTES.home };

  const otpPath = ROUTES.otp.replace(/^\/+|\/+$/g, "");
  const renewAdobePath = ROUTES.renewAdobe.replace(/^\/+|\/+$/g, "");
  const renewZoomPath = ROUTES.renewZoom.replace(/^\/+|\/+$/g, "");
  const netflixPath = ROUTES.netflix.replace(/^\/+|\/+$/g, "");
  if (path === otpPath || path === "check-profile" || path === "otp")
    return { view: "otp", slug: null, parentPath: ROUTES.home };

  if (path === renewAdobePath || path === "renew-adobe")
    return { view: "renew-adobe", slug: null, parentPath: ROUTES.fixAdobeEdu };
  if (path === renewZoomPath || path === "renew-zoom")
    return { view: "renew-zoom", slug: null, parentPath: ROUTES.fixAdobeEdu };
  if (path === netflixPath || path === "netflix")
    return { view: "netflix", slug: null, parentPath: ROUTES.fixAdobeEdu };

  const adobeGuidePath = ROUTES.adobeGuide.replace(/^\/+|\/+$/g, "");
  if (path === adobeGuidePath || path === "huong-dan-adobe")
    return { view: "adobe-guide", slug: null, parentPath: ROUTES.otp };

  const topupPath = ROUTES.topup.replace(/^\/+|\/+$/g, "");
  if (path === topupPath || path === "topup")
    return { view: "topup", slug: null, parentPath: ROUTES.home };

  if (path === "payment/success")
    return { view: "payment-success", slug: null, parentPath: ROUTES.home };

  if (path === "payment/error")
    return { view: "payment-error", slug: null, parentPath: ROUTES.home };

  if (path === "payment/cancel")
    return { view: "payment-cancel", slug: null, parentPath: ROUTES.home };

  const newProductsPath = ROUTES.newProducts.replace(/^\/+|\/+$/g, "");
  if (path === newProductsPath)
    return { view: "new-products", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${newProductsPath}/`)) {
    const productSlug = decodeURIComponent(path.replace(`${newProductsPath}/`, ""));
    return { view: "product", slug: productSlug, parentPath: ROUTES.newProducts };
  }

  const bestSellingPath = ROUTES.bestSelling.replace(/^\/+|\/+$/g, "");
  if (path === bestSellingPath)
    return { view: "best-selling", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${bestSellingPath}/`)) {
    const productSlug = decodeURIComponent(path.replace(`${bestSellingPath}/`, ""));
    return { view: "product", slug: productSlug, parentPath: ROUTES.bestSelling };
  }

  const promotionsPath = ROUTES.promotions.replace(/^\/+|\/+$/g, "");
  if (path === promotionsPath)
    return { view: "promotions", slug: null, parentPath: ROUTES.home };
  if (path.startsWith(`${promotionsPath}/`)) {
    const productSlug = decodeURIComponent(path.replace(`${promotionsPath}/`, ""));
    return { view: "product", slug: productSlug, parentPath: ROUTES.promotions };
  }

  const allProductsPath = ROUTES.allProducts.replace(/^\/+|\/+$/g, "");
  if (path === allProductsPath)
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
