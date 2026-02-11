/**
 * Cart request handlers – logic extracted from cart.route
 */
import type { Request, Response } from "express";
import * as cartService from "../services/cart.service";

interface ReqUser {
  id?: number | string;
  userId?: string;
}

function getAccountId(req: Request): number | null {
  const user = (req as Request & { user?: ReqUser }).user;
  const id = user?.id ?? user?.userId;
  if (id == null) return null;
  return typeof id === "number" ? id : parseInt(String(id), 10);
}

export async function getCart(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
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
}

export async function addItem(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
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

export async function updateItem(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const variantId = req.params.variantId ?? "";
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

export async function removeItem(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const variantId = req.params.variantId ?? "";
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

export async function clearCart(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
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
}

export async function syncCart(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
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

export async function getCount(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
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
}
