/**
 * Product Controller
 * Handles product listing, promotions, categories, and cache operations.
 */
import type { Request, Response } from "express";
import { getProductsList } from "../services/products-list.service";
import { getPromotionsList } from "../services/promotions.service";
import { getCategoriesList } from "../services/categories.service";
import { getProductPackages } from "../services/product-packages.service";
import { cache } from "../utils/cache";

// ── Cache config ────────────────────────────────────────────────────

const PRODUCTS_TTL = 120;     // 2 minutes
const PROMOTIONS_TTL = 120;   // 2 minutes
const CATEGORIES_TTL = 300;   // 5 minutes
const PACKAGES_TTL = 180;     // 3 minutes

const CACHE_KEYS = {
  products: "products:list",
  promotions: "promotions:list",
  categories: "categories:list",
  packages: (name: string) => `packages:${name.toLowerCase()}`,
} as const;

async function cachedQuery<T>(
  key: string,
  label: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== null) {
    console.log(`[${label}] cache HIT`);
    return hit;
  }

  const startedAt = Date.now();
  const data = await fetcher();
  const duration = Date.now() - startedAt;

  cache.set(key, data, ttl);
  const rowCount = Array.isArray(data) ? ` rows=${data.length}` : "";
  console.log(`[${label}] cache MISS${rowCount} duration=${duration}ms`);
  return data;
}

// ── Handlers ────────────────────────────────────────────────────────

export async function getProducts(_req: Request, res: Response): Promise<void> {
  try {
    const products = await cachedQuery(
      CACHE_KEYS.products, "products", PRODUCTS_TTL, getProductsList,
    );
    res.json({ data: products });
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

export async function getPromotions(_req: Request, res: Response): Promise<void> {
  try {
    const promotions = await cachedQuery(
      CACHE_KEYS.promotions, "promotions", PROMOTIONS_TTL, getPromotionsList,
    );
    res.json({ data: promotions });
  } catch (err) {
    console.error("Fetch promotions error:", err);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await cachedQuery(
      CACHE_KEYS.categories, "categories", CATEGORIES_TTL, getCategoriesList,
    );
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
      CACHE_KEYS.packages(packageName),
      `packages:${packageName}`,
      PACKAGES_TTL,
      () => getProductPackages(packageName),
    );
    res.json({ data });
  } catch (err) {
    console.error("Fetch product-packages error:", err);
    res.status(500).json({ error: "Failed to fetch product packages" });
  }
}

export function invalidateCache(req: Request, res: Response): void {
  const keysParam = (req.query.keys as string | undefined)?.trim();

  if (!keysParam) {
    cache.delete(CACHE_KEYS.products);
    cache.delete(CACHE_KEYS.promotions);
    cache.delete(CACHE_KEYS.categories);
    console.log("[cache] invalidated ALL product caches");
    res.json({ message: "All product caches invalidated" });
    return;
  }

  const keys = keysParam.split(",").map((k) => k.trim());
  for (const k of keys) {
    if (k === "products") cache.delete(CACHE_KEYS.products);
    else if (k === "promotions") cache.delete(CACHE_KEYS.promotions);
    else if (k === "categories") cache.delete(CACHE_KEYS.categories);
  }
  console.log(`[cache] invalidated: ${keys.join(", ")}`);
  res.json({ message: `Caches invalidated: ${keys.join(", ")}` });
}
