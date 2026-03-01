import type { CartItemData } from "../components/CartItem";
import type { CartItem } from "@/hooks/useCart";
import { formatDuration } from "@/lib/utils";

const DEFAULT_IMAGE = "https://placehold.co/200x200?text=Product";

export function mapStorageItemsToCartItemData(storageItems: CartItem[]): CartItemData[] {
  const result = storageItems.map((item) => ({
    id: item.id,
    variantId: item.variantId ?? item.id,
    name: item.packageName || item.name,
    description: formatDuration(item.duration) || undefined,
    image_url: item.imageUrl || DEFAULT_IMAGE,
    price: item.price,
    original_price: item.originalPrice,
    discount_percentage: item.discountPercentage,
    quantity: item.quantity,
    tags: [],
    status: "in_stock" as const,
    additionalInfo: item.additionalInfo,
    additionalInfoLabels: item.additionalInfoLabels,
    variant_name: item.packageName || undefined,
    duration: item.duration,
    note: item.additionalInfo
      ? Object.entries(item.additionalInfo)
          .filter(([, val]) => String(val).trim() !== "")
          .map(([k, v]) => `${item.additionalInfoLabels?.[k] || k}: ${v}`)
          .join(" | ")
      : undefined,
  }));
  if (result.length > 0) {
    console.log("[Cart] mapStorageItemsToCartItemData first item (UI)", {
      id: result[0].id,
      name: result[0].name,
      description: result[0].description,
      price: result[0].price,
      quantity: result[0].quantity,
    });
  }
  return result;
}

export function computeCartTotals(items: CartItemData[]): {
  subtotal: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = items.reduce((sum, item) => {
    if (item.original_price && item.discount_percentage) {
      return sum + (item.original_price - item.price) * item.quantity;
    }
    return sum;
  }, 0);
  return { subtotal, discount, total: subtotal };
}
