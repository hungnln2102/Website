/**
 * Product Stats Controller
 * Handles product sold counts, top selling, and cache management via Redis.
 */
import type { Request, Response } from "express";
import { productStatsService } from "../services/product-stats.service";
import { cacheService } from "../services/cache.service";

export async function getSoldCount(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id ?? "";
    const soldCount = await productStatsService.getProductSoldCount(id);

    res.json({
      success: true,
      data: { product_id: id, sold_count: soldCount },
    });
  } catch (error) {
    console.error("Get sold count error:", error);
    res.status(500).json({ success: false, error: "Failed to get sold count" });
  }
}

export async function getTopSelling(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await productStatsService.getTopSellingProducts(limit);

    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Get top selling error:", error);
    res.status(500).json({ success: false, error: "Failed to get top selling products" });
  }
}

export async function invalidateProductCache(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id ?? "";
    await productStatsService.invalidateProductCache(id);

    res.json({ success: true, message: "Cache invalidated" });
  } catch (error) {
    console.error("Invalidate cache error:", error);
    res.status(500).json({ success: false, error: "Failed to invalidate cache" });
  }
}

export async function warmCache(_req: Request, res: Response): Promise<void> {
  try {
    await productStatsService.warmUpCache();

    res.json({ success: true, message: "Cache warmed up" });
  } catch (error) {
    console.error("Warm cache error:", error);
    res.status(500).json({ success: false, error: "Failed to warm cache" });
  }
}

export async function getCacheStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await productStatsService.getCacheStats();

    res.json({
      success: true,
      data: { ...stats, redis_available: cacheService.isAvailable() },
    });
  } catch (error) {
    console.error("Get cache stats error:", error);
    res.status(500).json({ success: false, error: "Failed to get cache stats" });
  }
}
