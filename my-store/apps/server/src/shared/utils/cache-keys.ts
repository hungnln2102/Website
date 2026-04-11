/**
 * Quy ước key cache in-memory (HTTP catalog).
 *
 * - Namespace cố định `http` để tách khỏi Redis domain sau này.
 * - Prefix env `MEMORY_CACHE_KEY_PREFIX` (mặc định `my-store:v1`) — dùng chung Redis DB khác service.
 */
const raw = process.env.MEMORY_CACHE_KEY_PREFIX?.trim();
const PREFIX =
  raw && raw.length > 0 ? raw.replace(/:+$/, "") : "my-store:v1";

function join(...parts: string[]): string {
  return [PREFIX, "http", ...parts].join(":");
}

export const httpCacheKeys = {
  productsList: (scope: string) => join("products", "list", scope),
  promotionsList: () => join("promotions", "list"),
  categoriesList: () => join("categories", "list"),
  packages: (packageName: string) =>
    join("packages", packageName.trim().toLowerCase()),
} as const;
