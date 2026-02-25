/**
 * Cart request handlers – logic extracted from cart.route
 */
import type { Request, Response } from "express";
import * as cartService from "../services/cart.service";

interface ReqUser {
  id?: number | string;
  userId?: string;
  role?: string;
}

function getAccountId(req: Request): number | null {
  const user = (req as Request & { user?: ReqUser }).user;
  const id = user?.id ?? user?.userId;
  if (id == null) return null;
  return typeof id === "number" ? id : parseInt(String(id), 10);
}

/** Chuẩn hóa price_type theo role: CUSTOMER chỉ retail|promo, CTV chỉ ctv. */
function normalizePriceTypeByRole(role: string | undefined, priceType: string | undefined): cartService.CartPriceType {
  const r = (role ?? "").toUpperCase();
  const p = (priceType ?? "retail").toLowerCase();
  if (r === "CTV") return "ctv";
  if (r === "CUSTOMER") return p === "promo" ? "promo" : "retail";
  return (p === "ctv" ? "ctv" : p === "promo" ? "promo" : "retail") as cartService.CartPriceType;
}

export async function getCart(req: Request, res: Response) {
  try {
    const accountId = getAccountId(req);
    if (accountId == null) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const items = await cartService.getCartItemsEnriched(accountId);
    const count = await cartService.getCartItemCount(accountId);

    // Log để kiểm tra giỏ hàng
    console.log("[Cart] getCart response", {
      accountId,
      totalItems: count,
      items: items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        priceType: item.priceType,
        price: item.price,
        originalPrice: item.originalPrice,
        name: item.name,
        packageName: item.packageName,
      })),
    });

    res.json({
      success: true,
      data: {
        items: items.map((item) => {
          const extra = item.extraInfo;
          const additionalInfo = extra ?? undefined;
          const additionalInfoLabels = extra
            ? Object.fromEntries(Object.keys(extra).map((k) => [k, k]))
            : undefined;
          return {
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            priceType: item.priceType,
            name: item.name,
            packageName: item.packageName,
            duration: item.duration,
            price: item.price,
            originalPrice: item.originalPrice,
            discountPercentage: item.discountPercentage,
            imageUrl: item.imageUrl,
            description: item.description,
            purchaseRules: item.purchaseRules,
            ...extra,
            additionalInfo,
            additionalInfoLabels,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        }),
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

    const user = (req as Request & { user?: ReqUser }).user;
    const { variantId, quantity = 1, priceType, extraInfo } = req.body;
    const effectivePriceType = normalizePriceTypeByRole(user?.role, priceType);

    const item = await cartService.addCartItem({
      accountId,
      variantId,
      quantity,
      priceType: effectivePriceType,
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
          priceType: item.price_type,
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
          ? (() => {
              const extra = item.extra_info;
              const additionalInfo = extra ?? undefined;
              const additionalInfoLabels = extra
                ? Object.fromEntries(Object.keys(extra).map((k) => [k, k]))
                : undefined;
              return {
                id: item.id,
                variantId: item.variant_id,
                quantity: item.quantity,
                ...extra,
                additionalInfo,
                additionalInfoLabels,
              };
            })()
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

    const user = (req as Request & { user?: ReqUser }).user;
    const { items } = req.body;
    const normalizedItems = Array.isArray(items)
      ? items.map((it: { variantId: string; quantity?: number; priceType?: string; extraInfo?: unknown }) => ({
          variantId: it.variantId,
          quantity: it.quantity ?? 1,
          priceType: normalizePriceTypeByRole(user?.role, it.priceType),
          extraInfo: it.extraInfo,
        }))
      : [];

    await cartService.syncCartItems(accountId, normalizedItems);
    const enriched = await cartService.getCartItemsEnriched(accountId);
    const count = await cartService.getCartItemCount(accountId);

    res.json({
      success: true,
      message: "Cart synced successfully",
      data: {
        items: enriched.map((item) => {
          const extra = item.extraInfo;
          const additionalInfo = extra ?? undefined;
          const additionalInfoLabels = extra
            ? Object.fromEntries(Object.keys(extra).map((k) => [k, k]))
            : undefined;
          return {
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            priceType: item.priceType,
            name: item.name,
            packageName: item.packageName,
            duration: item.duration,
            price: item.price,
            originalPrice: item.originalPrice,
            discountPercentage: item.discountPercentage,
            imageUrl: item.imageUrl,
            description: item.description,
            purchaseRules: item.purchaseRules,
            ...extra,
            additionalInfo,
            additionalInfoLabels,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        }),
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
