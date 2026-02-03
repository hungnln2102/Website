import { useState, useEffect, useCallback } from "react";
import {
  addToCart,
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCartApi,
  syncCart,
} from "@/lib/api";

export interface CartItem {
  id: string;
  variantId?: string;
  name: string;
  packageName: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  quantity: number;
  imageUrl?: string;
}

const CART_STORAGE_KEY = "mavryk_cart";
const AUTH_TOKEN_KEY = "accessToken";

// Get auth token
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Load cart from localStorage
const loadCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save cart to localStorage
const saveCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save cart:", e);
  }
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load cart on mount
  useEffect(() => {
    const localItems = loadCart();
    setItems(localItems);
    setIsLoaded(true);

    // If user is logged in, sync with server
    const token = getAuthToken();
    if (token && localItems.length > 0) {
      syncWithServer(token, localItems);
    } else if (token) {
      // Fetch cart from server if no local items
      fetchFromServer(token);
    }
  }, []);

  // Sync local cart with server
  const syncWithServer = async (token: string, localItems: CartItem[]) => {
    setIsSyncing(true);
    try {
      const response = await syncCart(
        token,
        localItems.map((item) => ({
          variantId: item.variantId || item.id,
          quantity: item.quantity,
          extraInfo: {
            name: item.name,
            packageName: item.packageName,
            duration: item.duration,
            price: item.price,
            originalPrice: item.originalPrice,
            discountPercentage: item.discountPercentage,
            imageUrl: item.imageUrl,
          },
        }))
      );

      if (response.success && response.data) {
        const serverItems: CartItem[] = response.data.items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          name: item.name || "",
          packageName: item.packageName || "",
          duration: item.duration || "",
          price: item.price || 0,
          originalPrice: item.originalPrice,
          discountPercentage: item.discountPercentage,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        }));
        setItems(serverItems);
        saveCart(serverItems);
      }
    } catch (error) {
      console.error("Failed to sync cart:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch cart from server
  const fetchFromServer = async (token: string) => {
    setIsSyncing(true);
    try {
      const response = await fetchCart(token);
      if (response.success && response.data) {
        const serverItems: CartItem[] = response.data.items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          name: item.name || "",
          packageName: item.packageName || "",
          duration: item.duration || "",
          price: item.price || 0,
          originalPrice: item.originalPrice,
          discountPercentage: item.discountPercentage,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        }));
        setItems(serverItems);
        saveCart(serverItems);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save cart when items change
  useEffect(() => {
    if (isLoaded) {
      saveCart(items);
      // Dispatch event for other components to listen
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: items }));
    }
  }, [items, isLoaded]);

  // Add item to cart
  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const token = getAuthToken();
      const newItem = { ...item, quantity: item.quantity || 1 };

      // Update local state immediately
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.id === item.id && i.duration === item.duration
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + (item.quantity || 1),
          };
          return updated;
        }

        return [...prev, newItem as CartItem];
      });

      // Sync to server if logged in
      if (token) {
        try {
          await addToCart(token, {
            variantId: item.variantId?.toString() || item.id,
            quantity: item.quantity || 1,
            extraInfo: {
              name: item.name,
              packageName: item.packageName,
              duration: item.duration,
              price: item.price,
              originalPrice: item.originalPrice,
              discountPercentage: item.discountPercentage,
              imageUrl: item.imageUrl,
            },
          });
        } catch (error) {
          console.error("Failed to add to cart on server:", error);
        }
      }
    },
    []
  );

  // Remove item from cart
  const removeItem = useCallback(async (id: string, duration?: string) => {
    const token = getAuthToken();

    setItems((prev) =>
      prev.filter((item) => !(item.id === id && (!duration || item.duration === duration)))
    );

    // Sync to server if logged in
    if (token) {
      try {
        const item = items.find((i) => i.id === id && (!duration || i.duration === duration));
        if (item) {
          await removeFromCart(token, item.variantId || item.id);
        }
      } catch (error) {
        console.error("Failed to remove from cart on server:", error);
      }
    }
  }, [items]);

  // Update item quantity
  const updateQuantity = useCallback(
    async (id: string, duration: string, quantity: number) => {
      const token = getAuthToken();

      if (quantity <= 0) {
        removeItem(id, duration);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id && item.duration === duration ? { ...item, quantity } : item
        )
      );

      // Sync to server if logged in
      if (token) {
        try {
          const item = items.find((i) => i.id === id && i.duration === duration);
          if (item) {
            await updateCartItem(token, item.variantId || item.id, quantity);
          }
        } catch (error) {
          console.error("Failed to update cart on server:", error);
        }
      }
    },
    [items, removeItem]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    const token = getAuthToken();

    setItems([]);

    // Sync to server if logged in
    if (token) {
      try {
        await clearCartApi(token);
      } catch (error) {
        console.error("Failed to clear cart on server:", error);
      }
    }
  }, []);

  // Get cart totals
  const totals = {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalDiscount: items.reduce((sum, item) => {
      if (item.originalPrice) {
        return sum + (item.originalPrice - item.price) * item.quantity;
      }
      return sum;
    }, 0),
  };

  return {
    items,
    isLoaded,
    isSyncing,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totals,
    syncWithServer,
    fetchFromServer,
  };
}

// Helper to get cart items count (for header badge)
export function getCartItemCount(): number {
  const items = loadCart();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
