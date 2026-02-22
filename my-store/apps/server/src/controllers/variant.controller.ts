/**
 * Variant Controller
 * Handles variant detail retrieval by ID, display name, and product grouping.
 */
import type { Request, Response } from "express";
import { variantDetailService } from "../services/variant-detail.service";

export async function getVariantDetail(req: Request, res: Response): Promise<void> {
  try {
    const variantId = parseInt(req.params.id ?? "", 10);
    if (isNaN(variantId)) {
      res.status(400).json({ success: false, error: "Invalid variant ID" });
      return;
    }

    const detail = await variantDetailService.getVariantDetail(variantId);

    if (!detail) {
      res.status(404).json({ success: false, error: "Variant not found" });
      return;
    }

    res.json({ success: true, data: detail });
  } catch (error) {
    console.error("Get variant detail error:", error);
    res.status(500).json({ success: false, error: "Failed to get variant detail" });
  }
}

export async function getVariantByName(req: Request, res: Response): Promise<void> {
  try {
    const displayName = req.params.displayName ?? "";
    const detail = await variantDetailService.getVariantDetailByDisplayName(displayName);

    if (!detail) {
      res.status(404).json({ success: false, error: "Variant not found" });
      return;
    }

    res.json({ success: true, data: detail });
  } catch (error) {
    console.error("Get variant detail by name error:", error);
    res.status(500).json({ success: false, error: "Failed to get variant detail" });
  }
}

export async function getVariantsByBaseName(req: Request, res: Response): Promise<void> {
  try {
    const baseName = req.params.baseName ?? "";
    const variants = await variantDetailService.getVariantsByBaseName(baseName);

    res.json({ success: true, data: variants });
  } catch (error) {
    console.error("Get variants by base name error:", error);
    res.status(500).json({ success: false, error: "Failed to get variants" });
  }
}

export async function getProductInfo(req: Request, res: Response): Promise<void> {
  try {
    const baseName = req.params.baseName ?? "";
    const productInfo = await variantDetailService.getProductInfo(baseName);

    if (!productInfo) {
      res.status(404).json({ success: false, error: "Product not found" });
      return;
    }

    res.json({ success: true, data: productInfo });
  } catch (error) {
    console.error("Get product info error:", error);
    res.status(500).json({ success: false, error: "Failed to get product info" });
  }
}
