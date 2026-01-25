/**
 * React Query keys for caching
 */

export const QUERY_KEYS = {
  products: ["products"] as const,
  categories: ["categories"] as const,
  promotions: ["promotions"] as const,
  productPackages: (packageName: string) => ["product-packages", packageName] as const,
  productInfo: (baseName: string) => ["product-info", baseName] as const,
} as const;
