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
  profile: "/profile",
  topup: "/topup",
  paymentSuccess: "/payment/success",
  paymentError: "/payment/error",
  paymentCancel: "/payment/cancel",
  about: "/about",
  newProducts: "/new-products",
  promotions: "/promotions",
  allProducts: "/all-products",
  /** Đường dẫn danh mục: ROUTES.category(slug) */
  category: (slug: string) => `/category/${encodeURIComponent(slug)}`,
  /** Đường dẫn sản phẩm trong danh mục: ROUTES.categoryProduct(catSlug, productSlug) */
  categoryProduct: (catSlug: string, productSlug: string) =>
    `/category/${encodeURIComponent(catSlug)}/${encodeURIComponent(productSlug)}`,
} as const;

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
