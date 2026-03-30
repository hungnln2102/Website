import { useState, useEffect, useCallback } from "react";
import {
  addToCart,
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCartApi,
  getAuthToken,
} from "@/lib/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { CartItem } from "./cartStorage";

export type { CartItem } from "./cartStorage";

function useIsLoggedIn(): boolean {
  const token = getAuthToken();
  const { isAuthenticated } = useAuth();
  return !!(token || isAuthenticated);
}

/** Giỏ hàng chỉ từ bảng cart_items (bắt buộc đăng nhập). Không dùng localStorage. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isLoggedIn = useIsLoggedIn();

  const fetchFromServer = useCallback(async (token: string | null) => {
    setIsSyncing(true);
    try {
      const response = await fetchCart(token);
      if (response.success && response.data) {
        // Log để kiểm tra giỏ hàng (dữ liệu API trả về)
        console.log("[Cart] fetchCart API response", {
          totalItems: response.data.totalItems,
          items: response.data.items?.map((item: any) => ({
            id: item.id,
            variantId: item.variantId,
            priceType: item.priceType,
            price: item.price,
            name: item.name,
            packageName: item.packageName,
          })),
        });
        const serverItems: CartItem[] = response.data.items.map((item: any) => ({
          id: item.id,
          variantId: item.variantId,
          priceType: item.priceType,
          name: item.name ?? "",
          packageName: item.packageName ?? "",
          duration: item.duration ?? "",
          price: item.price ?? 0,
          originalPrice: item.originalPrice,
          discountPercentage: item.discountPercentage,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          description: item.description,
          purchaseRules: item.purchaseRules,
          additionalInfo: item.additionalInfo,
          additionalInfoLabels: item.additionalInfoLabels,
        }));
        setItems(serverItems);
        // Log item đã map (hiển thị trên UI)
        if (serverItems.length > 0) {
          console.log("[Cart] useCart mapped first item", serverItems[0]);
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setItems([]);
    } finally {
      setIsSyncing(false);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    const token = getAuthToken();
    fetchFromServer(token);
  }, [isLoggedIn, fetchFromServer]);

  useEffect(() => {
    if (isLoaded) {
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: items }));
    }
  }, [items, isLoaded]);

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      if (!isLoggedIn) return;
      const token = getAuthToken();
      try {
        const hasAdditionalInfo = item.additionalInfo && Object.keys(item.additionalInfo).length > 0;
        // Chuyển sang format extra_info: { "input_name": "Dữ liệu ô input" } để lưu vào cart_items.extra_info
        let extraInfo: Record<string, string> | null = null;
        if (hasAdditionalInfo && item.additionalInfo) {
          extraInfo = {};
          for (const [inputId, value] of Object.entries(item.additionalInfo)) {
            const inputName = item.additionalInfoLabels?.[inputId] ?? inputId;
            extraInfo[inputName] = value;
          }
        }
        const result = await addToCart(token, {
          variantId: item.variantId?.toString() || item.id,
          quantity: item.quantity || 1,
          priceType: item.priceType ?? (item.discountPercentage && item.discountPercentage > 0 ? "promo" : "retail"),
          extraInfo,
        });
        if (result.success) await fetchFromServer(token);
        else console.warn("Add to cart API failed:", result.error);
      } catch (error) {
        console.error("Failed to add to cart on server:", error);
      }
    },
    [isLoggedIn, fetchFromServer]
  );

  const removeItem = useCallback(
    async (id: string, _duration?: string) => {
      if (!isLoggedIn) return;
      const token = getAuthToken();
      const itemToRemove = items.find((i) => i.id === id);
      const variantId = itemToRemove?.variantId != null ? String(itemToRemove.variantId) : itemToRemove?.id;
      if (!variantId) return;
      try {
        await removeFromCart(token, variantId);
        await fetchFromServer(token);
      } catch (error) {
        console.error("Failed to remove from cart on server:", error);
      }
    },
    [items, isLoggedIn, fetchFromServer]
  );

  const updateQuantity = useCallback(
    async (id: string, _duration: string, quantity: number): Promise<boolean> => {
      if (!isLoggedIn) return false;
      if (quantity <= 0) {
        removeItem(id);
        return true;
      }
      const token = getAuthToken();
      const item = items.find((i) => i.id === id);
      const variantId = item?.variantId != null ? String(item.variantId) : item?.id;
      if (!variantId) return false;
      try {
        const result = await updateCartItem(token, variantId, quantity);
        if (result.success) {
          await fetchFromServer(token);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to update cart on server:", error);
        return false;
      }
    },
    [items, isLoggedIn, removeItem, fetchFromServer]
  );

  const clearCart = useCallback(async () => {
    if (!isLoggedIn) return;
    const token = getAuthToken();
    try {
      await clearCartApi(token);
    } catch (error) {
      console.error("Failed to clear cart on server:", error);
    }
    setItems([]);
  }, [isLoggedIn]);

  const totals = {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalDiscount: items.reduce((sum, item) => {
      if (item.originalPrice) return sum + (item.originalPrice - item.price) * item.quantity;
      return sum;
    }, 0),
  };

  return {
    items,
    isLoaded,
    isSyncing,
    isLoggedIn,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totals,
    fetchFromServer,
  };
}
