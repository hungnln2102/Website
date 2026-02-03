import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import * as cartService from "../services/cart.service";

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

/**
 * GET /api/cart
 * Get all cart items for authenticated user
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const accountId = (req as any).user?.id;
    if (!accountId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const items = await cartService.getCartItems(accountId);
    const count = await cartService.getCartItemCount(accountId);

    res.json({
      success: true,
      data: {
        items: items.map((item) => ({
          id: item.id,
          variantId: item.variant_id,
          quantity: item.quantity,
          ...item.extra_info,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        totalItems: count,
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/cart/add
 * Add item to cart
 */
router.post(
  "/add",
  authenticate,
  [
    body("variantId").notEmpty().withMessage("Variant ID is required"),
    body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("extraInfo").optional().isObject().withMessage("Extra info must be an object"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as any).user?.id;
      if (!accountId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { variantId, quantity = 1, extraInfo } = req.body;

      const item = await cartService.addCartItem({
        accountId,
        variantId,
        quantity,
        extraInfo,
      });

      const count = await cartService.getCartItemCount(accountId);

      res.json({
        success: true,
        message: "Item added to cart",
        data: {
          item: {
            id: item.id,
            variantId: item.variant_id,
            quantity: item.quantity,
            ...item.extra_info,
          },
          totalItems: count,
        },
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

/**
 * PUT /api/cart/:variantId
 * Update cart item quantity
 */
router.put(
  "/:variantId",
  authenticate,
  [
    param("variantId").notEmpty().withMessage("Variant ID is required"),
    body("quantity").isInt({ min: 0 }).withMessage("Quantity must be 0 or greater"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as any).user?.id;
      if (!accountId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { variantId } = req.params;
      const { quantity } = req.body;

      const item = await cartService.updateCartItemQuantity({
        accountId,
        variantId,
        quantity,
      });

      const count = await cartService.getCartItemCount(accountId);

      res.json({
        success: true,
        message: quantity === 0 ? "Item removed from cart" : "Cart updated",
        data: {
          item: item
            ? {
                id: item.id,
                variantId: item.variant_id,
                quantity: item.quantity,
                ...item.extra_info,
              }
            : null,
          totalItems: count,
        },
      });
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/cart/:variantId
 * Remove item from cart
 */
router.delete(
  "/:variantId",
  authenticate,
  [
    param("variantId").notEmpty().withMessage("Variant ID is required"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as any).user?.id;
      if (!accountId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { variantId } = req.params;
      await cartService.removeCartItem(accountId, variantId);
      const count = await cartService.getCartItemCount(accountId);

      res.json({
        success: true,
        message: "Item removed from cart",
        data: { totalItems: count },
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete("/", authenticate, async (req: Request, res: Response) => {
  try {
    const accountId = (req as any).user?.id;
    if (!accountId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await cartService.clearCart(accountId);

    res.json({
      success: true,
      message: "Cart cleared",
      data: { totalItems: 0 },
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/cart/sync
 * Sync localStorage cart to database (on login)
 */
router.post(
  "/sync",
  authenticate,
  [
    body("items").isArray().withMessage("Items must be an array"),
    body("items.*.variantId").notEmpty().withMessage("Variant ID is required"),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const accountId = (req as any).user?.id;
      if (!accountId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { items } = req.body;

      const syncedItems = await cartService.syncCartItems(accountId, items);
      const count = await cartService.getCartItemCount(accountId);

      res.json({
        success: true,
        message: "Cart synced successfully",
        data: {
          items: syncedItems.map((item) => ({
            id: item.id,
            variantId: item.variant_id,
            quantity: item.quantity,
            ...item.extra_info,
          })),
          totalItems: count,
        },
      });
    } catch (error) {
      console.error("Error syncing cart:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

/**
 * GET /api/cart/count
 * Get cart item count
 */
router.get("/count", authenticate, async (req: Request, res: Response) => {
  try {
    const accountId = (req as any).user?.id;
    if (!accountId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await cartService.getCartItemCount(accountId);

    res.json({
      success: true,
      data: { totalItems: count },
    });
  } catch (error) {
    console.error("Error getting cart count:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
