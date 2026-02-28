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
  | "promotions"
  | "all-products"
  | "login"
  | "cart"
  | "profile"
  | "topup"
  | "about"
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

  const loginPath = ROUTES.login.replace(/^\/+|\/+$/g, "");
  if (path === loginPath)
    return { view: "login", slug: null, parentPath: ROUTES.home };

  if (path === "register")
    return { view: "login", slug: "register", parentPath: ROUTES.home };

  const cartPath = ROUTES.cart.replace(/^\/+|\/+$/g, "");
  if (path === cartPath || path === "cart")
    return { view: "cart", slug: null, parentPath: ROUTES.home };

  const profilePath = ROUTES.profile.replace(/^\/+|\/+$/g, "");
  if (path === profilePath || path === "profile")
    return { view: "profile", slug: null, parentPath: ROUTES.home };

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
