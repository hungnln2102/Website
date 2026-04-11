/**
 * Product Controller
 * Handles product listing, promotions, categories, and cache operations.
 */
import type { Request, Response } from "express";
import { getProductsList } from "./products-list.service";
import { getPromotionsList } from "./promotions.service";
import { getCategoriesList } from "./categories.service";
import { getProductPackages } from "./product-packages.service";
import { CACHE_TTL_SEC } from "../../config/cache-ttl";
import { cache } from "../../shared/utils/cache";
import { httpCacheKeys } from "../../shared/utils/cache-keys";
import { normalizeProductListPriceScope, PRODUCT_LIST_PRICE_SCOPES } from "../../shared/utils/role-code";

function setPublicCacheHeaders(res: Response, maxAgeSeconds: number, staleSeconds: number) {
  res.setHeader(
    "Cache-Control",
    `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleSeconds}`
  );
}

function setPrivateNoStore(res: Response) {
  res.setHeader("Cache-Control", "private, no-store");
}

async function cachedQuery<T>(
  key: string,
  label: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const { value, cacheHit } = await cache.getOrSet(key, ttl, async () => {
    const startedAt = Date.now();
    const data = await fetcher();
    const duration = Date.now() - startedAt;
    const rowCount = Array.isArray(data) ? ` rows=${data.length}` : "";
    console.log(`[${label}] cache MISS${rowCount} duration=${duration}ms`);
    return data;
  });
  if (cacheHit) {
    console.log(`[${label}] cache HIT`);
  }
  return value;
}

// ── Handlers ────────────────────────────────────────────────────────

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as Request & { user?: { roleCode?: string } | null }).user;
    const scope = normalizeProductListPriceScope(user?.roleCode);
    const cacheKey = httpCacheKeys.productsList(scope);
    const products = await cachedQuery(
      cacheKey,
      `products:${scope}`,
      CACHE_TTL_SEC.PRODUCTS_LIST,
      () => getProductsList(scope),
    );
    if (user) setPrivateNoStore(res);
    else setPublicCacheHeaders(res, 60, CACHE_TTL_SEC.PRODUCTS_LIST);
    res.json({ data: products, price_scope: scope });
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

export async function getPromotions(_req: Request, res: Response): Promise<void> {
  try {
    const promotions = await cachedQuery(
      httpCacheKeys.promotionsList(),
      "promotions",
      CACHE_TTL_SEC.PROMOTIONS_LIST,
      getPromotionsList,
    );
    setPublicCacheHeaders(res, 60, CACHE_TTL_SEC.PROMOTIONS_LIST);
    res.json({ data: promotions });
  } catch (err) {
    console.error("Fetch promotions error:", err);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await cachedQuery(
      httpCacheKeys.categoriesList(),
      "categories",
      CACHE_TTL_SEC.CATEGORIES_LIST,
      getCategoriesList,
    );
    setPublicCacheHeaders(res, 120, CACHE_TTL_SEC.CATEGORIES_LIST);
    res.json({ data: rows });
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}

export async function getProductPackagesHandler(req: Request, res: Response): Promise<void> {
  const packageParam = (req.params.package as string | undefined)?.trim();
  const packageQuery = (req.query.package as string | undefined)?.trim();
  const packageName = packageParam || packageQuery;
  if (!packageName) {
    res.status(400).json({ error: "Missing package parameter" });
    return;
  }

  try {
    const data = await cachedQuery(
      httpCacheKeys.packages(packageName),
      `packages:${packageName}`,
      CACHE_TTL_SEC.PRODUCT_PACKAGES,
      () => getProductPackages(packageName),
    );
    setPublicCacheHeaders(res, 60, CACHE_TTL_SEC.PRODUCT_PACKAGES);
    res.json({ data });
  } catch (err) {
    console.error("Fetch product-packages error:", err);
    res.status(500).json({ error: "Failed to fetch product packages" });
  }
}

export function invalidateCache(req: Request, res: Response): void {
  const keysParam = (req.query.keys as string | undefined)?.trim();

  if (!keysParam) {
    cache.clear();
    console.log("[cache] invalidated ALL product caches");
    res.json({ message: "All product caches invalidated" });
    return;
  }

  const keys = keysParam.split(",").map((k) => k.trim());
  for (const k of keys) {
    if (k === "products") {
      for (const scope of PRODUCT_LIST_PRICE_SCOPES) {
        cache.delete(httpCacheKeys.productsList(scope));
      }
    } else if (k === "promotions") {
      cache.delete(httpCacheKeys.promotionsList());
    } else if (k === "categories") {
      cache.delete(httpCacheKeys.categoriesList());
    } else if (k === "all") {
      cache.clear();
    } else if (k.startsWith("packages:")) {
      const name = k.slice("packages:".length).trim();
      if (name) cache.delete(httpCacheKeys.packages(name));
    }
  }
  console.log(`[cache] invalidated: ${keys.join(", ")}`);
  res.json({ message: `Caches invalidated: ${keys.join(", ")}` });
}
