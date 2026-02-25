import { useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { mapStorageItemsToCartItemData, computeCartTotals } from "../utils/cartItemMapper";
import type { CartItemData } from "../components/CartItem";

export function useCartPageData() {
  const { items: cartStorageItems, updateQuantity, removeItem, clearCart, isLoggedIn } = useCart();

  const cartItems: CartItemData[] = useMemo(
    () => mapStorageItemsToCartItemData(cartStorageItems),
    [cartStorageItems]
  );

  const { subtotal, discount, total } = useMemo(
    () => computeCartTotals(cartItems),
    [cartItems]
  );

  return {
    cartItems,
    cartStorageItems,
    subtotal,
    discount,
    total,
    updateQuantity,
    removeItem,
    clearCart,
    isLoggedIn,
  };
}
