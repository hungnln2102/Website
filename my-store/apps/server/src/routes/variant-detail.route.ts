import express from 'express';
import type { Request, Response } from 'express';
import { variantDetailService } from '../services/variant-detail.service';

const router = express.Router();

/**
 * Get variant detail by ID
 * GET /api/variants/:id/detail
 */
router.get('/:id/detail', async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id ?? "", 10);
    if (isNaN(variantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid variant ID',
      });
    }

    const detail = await variantDetailService.getVariantDetail(variantId);

    if (!detail) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error('Get variant detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get variant detail',
    });
  }
});

/**
 * Get variant detail by display_name
 * GET /api/variants/by-name/:displayName/detail
 */
router.get('/by-name/:displayName/detail', async (req: Request, res: Response) => {
  try {
    const displayName = req.params.displayName ?? "";
    const detail = await variantDetailService.getVariantDetailByDisplayName(displayName);

    if (!detail) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error('Get variant detail by name error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get variant detail',
    });
  }
});

/**
 * Get all variants for a product (by base_name)
 * GET /api/variants/product/:baseName
 */
router.get('/product/:baseName', async (req: Request, res: Response) => {
  try {
    const baseName = req.params.baseName ?? "";
    const variants = await variantDetailService.getVariantsByBaseName(baseName);

    res.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error('Get variants by base name error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get variants',
    });
  }
});

/**
 * Get product info with all variants
 * GET /api/variants/product-info/:baseName
 */
router.get('/product-info/:baseName', async (req: Request, res: Response) => {
  try {
    const baseName = req.params.baseName ?? "";
    const productInfo = await variantDetailService.getProductInfo(baseName);

    if (!productInfo) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: productInfo,
    });
  } catch (error) {
    console.error('Get product info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product info',
    });
  }
});

export default router;
