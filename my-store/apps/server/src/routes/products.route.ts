import express from "express";
import { strictLimiter } from "../middleware/rateLimiter";
import { getProductsList } from "../services/products-list.service";
import { getPromotionsList } from "../services/promotions.service";
import { getCategoriesList } from "../services/categories.service";
import { getProductPackages } from "../services/product-packages.service";
import { cache } from "../utils/cache";

const router = express.Router();

// ── Cache TTLs (seconds) ────────────────────────────────────────────
const PRODUCTS_TTL = 120;     // 2 minutes
const PROMOTIONS_TTL = 120;   // 2 minutes
const CATEGORIES_TTL = 300;   // 5 minutes
const PACKAGES_TTL = 180;     // 3 minutes

// ── Cache keys ──────────────────────────────────────────────────────
const CACHE_KEYS = {
  products: "products:list",
  promotions: "promotions:list",
  categories: "categories:list",
  packages: (name: string) => `packages:${name.toLowerCase()}`,
} as const;

// ── Helper: get-or-set cache with timing logs ───────────────────────
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

// ── Routes ──────────────────────────────────────────────────────────

router.get("/products", async (_req, res) => {
  try {
    const products = await cachedQuery(
      CACHE_KEYS.products, "products", PRODUCTS_TTL, getProductsList,
    );
    res.json({ data: products });
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/promotions", async (_req, res) => {
  try {
    const promotions = await cachedQuery(
      CACHE_KEYS.promotions, "promotions", PROMOTIONS_TTL, getPromotionsList,
    );
    res.json({ data: promotions });
  } catch (err) {
    console.error("Fetch promotions error:", err);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

router.get("/categories", async (_req, res) => {
  try {
    const rows = await cachedQuery(
      CACHE_KEYS.categories, "categories", CATEGORIES_TTL, getCategoriesList,
    );
    res.json({ data: rows });
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

const productPackagesHandler: express.RequestHandler = async (req, res) => {
  const packageParam = (req.params.package as string | undefined)?.trim();
  const packageQuery = (req.query.package as string | undefined)?.trim();
  const packageName = packageParam || packageQuery;
  if (!packageName) {
    return res.status(400).json({ error: "Missing package parameter" });
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
};

router.get("/product-packages/:package", strictLimiter, productPackagesHandler);
router.get("/product-packages", strictLimiter, productPackagesHandler);

// ── Cache invalidation ──────────────────────────────────────────────
// POST /cache/invalidate?keys=products,promotions,categories
// POST /cache/invalidate  (no keys = clear all product caches)
router.post("/cache/invalidate", (req, res) => {
  const keysParam = (req.query.keys as string | undefined)?.trim();

  if (!keysParam) {
    // Clear all known product-related caches
    cache.delete(CACHE_KEYS.products);
    cache.delete(CACHE_KEYS.promotions);
    cache.delete(CACHE_KEYS.categories);
    console.log("[cache] invalidated ALL product caches");
    return res.json({ message: "All product caches invalidated" });
  }

  const keys = keysParam.split(",").map((k) => k.trim());
  for (const k of keys) {
    if (k === "products") cache.delete(CACHE_KEYS.products);
    else if (k === "promotions") cache.delete(CACHE_KEYS.promotions);
    else if (k === "categories") cache.delete(CACHE_KEYS.categories);
  }
  console.log(`[cache] invalidated: ${keys.join(", ")}`);
  res.json({ message: `Caches invalidated: ${keys.join(", ")}` });
});

export default router;
