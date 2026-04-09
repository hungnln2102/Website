/**
 * Application-wide configuration constants
 */

export const APP_CONFIG = {
  name: "Mavryk Premium Store",
  description: "Cửa hàng phần mềm bản quyền chính hãng - Phần mềm bản quyền giá tốt nhất",
  url: typeof window !== "undefined" ? window.location.origin : "https://www.mavrykpremium.store",
  locale: "vi-VN",
  productsPerPage: 12,
  carouselAutoPlayInterval: 8000,
} as const;

/** URL các asset (Lottie, ảnh, v.v.) — sửa tại đây để dùng chung toàn app */
export const ASSET_URLS = {
  /** Animation Lottie thông báo thanh toán thành công — file của bạn: Success.json trong public/ */
  successAnimation: "/Success.json",
} as const;

/**
 * URL trang (đường dẫn ứng dụng) — sửa tại đây để dùng chung toàn app.
 * Ví dụ: link giỏ hàng, đăng nhập, thanh toán...
 */
export const ROUTES = {
  home: "/",
  cart: "/cart",
  login: "/login",
  register: "/register", // query ?register hoặc segment register tùy router
  forgotPassword: "/forgot-password",
  profile: "/profile",
  topup: "/topup",
  /** Trung tâm gói — vào đây trước; các dịch vụ con: /system/... */
  otp: "/system",
  fixAdobeEdu: "/system",
  renewAdobe: "/system/renew-adobe",
  renewZoom: "/system/renew-zoom",
  netflix: "/system/netflix",
  adobeGuide: "/huong-dan-adobe",
  paymentSuccess: "/payment/success",
  paymentError: "/payment/error",
  paymentCancel: "/payment/cancel",
  about: "/about",
  news: "/tin-tuc",
  newProducts: "/new-products",
  bestSelling: "/best-selling",
  promotions: "/promotions",
  allProducts: "/all-products",
  newsArticle: (slug: string) => `/tin-tuc/${encodeURIComponent(slug)}`,
  newsCategory: (slug: string) => `/tin-tuc/danh-muc/${encodeURIComponent(slug)}`,
  /** Đường dẫn danh mục: ROUTES.category(slug) */
  category: (slug: string) => `/danh-muc/${encodeURIComponent(slug)}`,
  /** Đường dẫn sản phẩm trong danh mục: ROUTES.categoryProduct(catSlug, productSlug) */
  categoryProduct: (catSlug: string, productSlug: string) =>
    `/danh-muc/${encodeURIComponent(catSlug)}/${encodeURIComponent(productSlug)}`,
} as const;

/**
 * Đường dẫn thuộc Trung tâm gói — không chặn bởi màn bảo trì toàn site (SPA + apiFetch).
 * Bao gồm `/system/*` và alias cũ (`/check-profile`, …).
 */
export function isSystemHubPath(pathname: string): boolean {
  const p = pathname.replace(/\/+/g, "/");
  const noTrail = p.replace(/\/+$/, "") || "/";
  if (noTrail === "/system" || p.startsWith("/system/")) return true;
  if (
    noTrail === "/check-profile" ||
    noTrail === "/otp" ||
    noTrail === "/renew-adobe" ||
    noTrail === "/renew-zoom" ||
    noTrail === "/netflix"
  ) {
    return true;
  }
  return false;
}

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const SCROLL_THRESHOLDS = {
  headerCollapse: 120,
  headerExpand: 10,
} as const;
