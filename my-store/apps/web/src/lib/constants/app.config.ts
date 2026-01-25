/**
 * Application-wide configuration constants
 */

export const APP_CONFIG = {
  name: "Mavryk Premium Store",
  description: "Cửa hàng phần mềm bản quyền chính hãng - Phần mềm bản quyền giá tốt nhất",
  url: typeof window !== "undefined" ? window.location.origin : "https://mavryk.store",
  locale: "vi-VN",
  productsPerPage: 12,
  carouselAutoPlayInterval: 8000,
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
