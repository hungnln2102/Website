/**
 * Product Sold Count Controller
 * Handles materialized view-based sold count statistics.
 */
import type { Request, Response } from "express";
import { productSoldCountService } from "../services/product-sold-count.service";

export async function getProductsWithSoldCount(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const products = await productSoldCountService.getProductsWithSoldCount(limit);

    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Get products with sold count error:", error);
    res.status(500).json({ success: false, error: "Failed to get products" });
  }
}

export async function getProductSoldCount(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id ?? "";
    const product = await productSoldCountService.getProductSoldCount(id);

    if (!product) {
      res.status(404).json({ success: false, error: "Product not found" });
      return;
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
    console.error("Get sold count error:", error);
    res.status(500).json({ success: false, error: "Failed to get sold count" });
  }
}

export async function getTopSelling(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const products = await productSoldCountService.getTopSellingProducts(limit);

    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Get top selling error:", error);
    res.status(500).json({ success: false, error: "Failed to get top selling products" });
  }
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await productSoldCountService.getStats();

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, error: "Failed to get statistics" });
  }
}

export async function refreshSoldCount(_req: Request, res: Response): Promise<void> {
  try {
    await productSoldCountService.refreshSoldCount();

    res.json({ success: true, message: "Sold count refreshed successfully" });
  } catch (error) {
    console.error("Refresh sold count error:", error);
    res.status(500).json({ success: false, error: "Failed to refresh sold count" });
  }
}
