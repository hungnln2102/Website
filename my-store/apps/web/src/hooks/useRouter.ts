import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";

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

  if (path === "gioi-thieu" || path === "about")
    return { view: "about", slug: null, parentPath: "/" };

  if (path === "login")
    return { view: "login", slug: null, parentPath: "/" };

  if (path === "register")
    return { view: "login", slug: "register", parentPath: "/" };

  if (path === "gio-hang" || path === "cart")
    return { view: "cart", slug: null, parentPath: "/" };

  if (path === "tai-khoan" || path === "profile")
    return { view: "profile", slug: null, parentPath: "/" };

  if (path === "nap-tien" || path === "topup")
    return { view: "topup", slug: null, parentPath: "/" };

  if (path === "payment/success")
    return { view: "payment-success", slug: null, parentPath: "/" };

  if (path === "payment/error")
    return { view: "payment-error", slug: null, parentPath: "/" };

  if (path === "payment/cancel")
    return { view: "payment-cancel", slug: null, parentPath: "/" };

  if (path === "san-pham-moi")
    return { view: "new-products", slug: null, parentPath: "/" };
  if (path.startsWith("san-pham-moi/")) {
    const productSlug = decodeURIComponent(path.replace("san-pham-moi/", ""));
    return { view: "product", slug: productSlug, parentPath: "/san-pham-moi" };
  }

  if (path === "khuyen-mai")
    return { view: "promotions", slug: null, parentPath: "/" };
  if (path.startsWith("khuyen-mai/")) {
    const productSlug = decodeURIComponent(path.replace("khuyen-mai/", ""));
    return { view: "product", slug: productSlug, parentPath: "/khuyen-mai" };
  }

  if (path === "tat-ca-san-pham")
    return { view: "all-products", slug: null, parentPath: "/" };
  if (path.startsWith("tat-ca-san-pham/")) {
    const productSlug = decodeURIComponent(path.replace("tat-ca-san-pham/", ""));
    return { view: "product", slug: productSlug, parentPath: "/tat-ca-san-pham" };
  }

  if (path.startsWith("danh-muc/")) {
    const rest = path.replace("danh-muc/", "");
    const parts = rest.split("/");
    const categorySlug = decodeURIComponent(parts[0]);
    const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === categorySlug);

    if (isCategory) {
      if (parts.length > 1) {
        const productSlug = decodeURIComponent(parts[1]);
        return { view: "product", slug: productSlug, parentPath: `/danh-muc/${encodeURIComponent(categorySlug)}` };
      }
      return { view: "category", slug: categorySlug, parentPath: "/" };
    }
  }

  const decodedPath = decodeURIComponent(path);
  const isCategory = categories.some((c: CategoryDto) => slugify(c.name) === decodedPath);
  if (isCategory) {
    return { view: "category", slug: decodedPath, parentPath: "/" };
  }

  return { view: "product", slug: decodedPath, parentPath: "/" };
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
    if (path === "tat-ca-san-pham") return "/tat-ca-san-pham";
    if (path === "san-pham-moi") return "/san-pham-moi";
    if (path === "khuyen-mai") return "/khuyen-mai";
    if (path.startsWith("danh-muc/")) {
      const parts = path.split("/");
      if (parts.length >= 2) return `/danh-muc/${parts[1]}`;
    }
    return "";
  }, []);

  const handleProductClick = useCallback(
    (slug: string, isCategorySlug: boolean = false) => {
      const isCategory = isCategorySlug || categories.some((c: CategoryDto) => slugify(c.name) === slug);

      if (isCategory) {
        const url = `/danh-muc/${encodeURIComponent(slug)}`;
        window.history.pushState({}, "", url);
        setSelectedSlug(slug);
        setParentPath("/");
        setView("category");
      } else {
        const basePath = getCurrentBasePath();
        const url = basePath ? `${basePath}/${encodeURIComponent(slug)}` : `/${encodeURIComponent(slug)}`;
        window.history.pushState({}, "", url);
        setSelectedSlug(slug);
        setParentPath(basePath || "/");
        setView("product");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [categories, getCurrentBasePath]
  );

  const handleBack = useCallback(() => {
    const backPath = parentPath || "/";
    window.history.pushState({}, "", backPath);
    applyRoute(parsePath(categories));
    if (backPath === "/") setSearchQuery("");
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
