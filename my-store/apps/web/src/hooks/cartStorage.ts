/** retail = khách lẻ, promo = khuyến mãi, ctv = cộng tác viên */
export type CartPriceType = "retail" | "promo" | "ctv";

export interface CartItem {
  id: string;
  variantId?: string;
  priceType?: CartPriceType;
  name: string;
  packageName: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  quantity: number;
  imageUrl?: string;
  description?: string | null;
  purchaseRules?: string | null;
  additionalInfo?: Record<string, string>;
  additionalInfoLabels?: Record<string, string>;
}
