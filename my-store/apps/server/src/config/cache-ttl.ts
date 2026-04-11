/**
 * TTL thống nhất (giây) — HTTP catalog cache in-memory + tham chiếu RedisMap.
 * Điều chỉnh tập trung để tránh lệch giữa warmup / controller / tài liệu.
 */
export const CACHE_TTL_SEC = {
  /** Danh sách sản phẩm theo scope giá */
  PRODUCTS_LIST: 600,
  /** Danh sách khuyến mãi */
  PROMOTIONS_LIST: 600,
  /** Danh mục */
  CATEGORIES_LIST: 900,
  /** Chi tiết gói (product-packages) */
  PRODUCT_PACKAGES: 300,
  /** JWT blacklist (RedisMap mặc định) */
  TOKEN_BLACKLIST: 900,
  /** Login / captcha rate (RedisMap) */
  LOGIN_CAPTCHA: 900,
  /** CSRF token map */
  CSRF: 3600,
} as const;
