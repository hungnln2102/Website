import express from 'express';
import type { Request, Response } from 'express';
import { productStatsService } from '../services/product-stats.service';
import { cacheService } from '../services/cache.service';

const router = express.Router();

/**
 * Get product sold count
 * GET /api/products/:id/sold-count
 */
router.get('/:id/sold-count', async (req: Request, res: Response) => {
  try {
    const id = req.params.id ?? "";
    const soldCount = await productStatsService.getProductSoldCount(id);

    res.json({
      success: true,
      data: {
        product_id: id,
        sold_count: soldCount,
      },
    });
  } catch (error) {
    console.error('Get sold count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sold count',
    });
  }
});

/**
 * Get top selling products
 * GET /api/products/top-selling?limit=10
 */
router.get('/top-selling', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const products = await productStatsService.getTopSellingProducts(limit);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get top selling error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top selling products',
    });
  }
});

/**
 * Invalidate product cache
 * POST /api/products/:id/invalidate-cache
 */
router.post('/:id/invalidate-cache', async (req: Request, res: Response) => {
  try {
    const id = req.params.id ?? "";
    await productStatsService.invalidateProductCache(id);

    res.json({
      success: true,
      message: 'Cache invalidated',
    });
  } catch (error) {
    console.error('Invalidate cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
    });
  }
});

/**
 * Warm up cache
 * POST /api/products/warm-cache
 */
router.post('/warm-cache', async (_req: Request, res: Response) => {
  try {
    await productStatsService.warmUpCache();

    res.json({
      success: true,
      message: 'Cache warmed up',
    });
  } catch (error) {
    console.error('Warm cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to warm cache',
    });
  }
});

/**
 * Get cache statistics
 * GET /api/products/cache-stats
 */
router.get('/cache-stats', async (_req: Request, res: Response) => {
  try {
    const stats = await productStatsService.getCacheStats();

    res.json({
      success: true,
      data: {
        ...stats,
        redis_available: cacheService.isAvailable(),
      },
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
    });
  }
});

export default router;
