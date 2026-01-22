import express from 'express';
import type { Request, Response } from 'express';
import { productSoldCountService } from '../services/product-sold-count.service';

const router = express.Router();

/**
 * Get all products with sold count
 * GET /api/products/with-sold-count?limit=10
 */
router.get('/with-sold-count', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const products = await productSoldCountService.getProductsWithSoldCount(limit);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get products with sold count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products',
    });
  }
});

/**
 * Get single product sold count
 * GET /api/products/:id/sold-count
 */
router.get('/:id/sold-count', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await productSoldCountService.getProductSoldCount(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: {
        product_id: product.id,
        sold_count: product.sold_count,
        last_updated: product.sold_count_updated_at,
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
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const products = await productSoldCountService.getTopSellingProducts(limit);

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
 * Get sold count statistics
 * GET /api/products/sold-count-stats
 */
router.get('/sold-count-stats', async (req: Request, res: Response) => {
  try {
    const stats = await productSoldCountService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

/**
 * Manually refresh sold count (admin only)
 * POST /api/products/refresh-sold-count
 */
router.post('/refresh-sold-count', async (_req: Request, res: Response) => {
  try {
    await productSoldCountService.refreshSoldCount();

    res.json({
      success: true,
      message: 'Sold count refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh sold count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh sold count',
    });
  }
});

export default router;
