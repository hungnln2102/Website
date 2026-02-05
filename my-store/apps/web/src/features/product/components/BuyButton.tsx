"use client";

import { useState } from "react";
import { ShoppingCart, MessageCircle, PhoneCall, Send, X } from "lucide-react";
import { toast } from "sonner";
import { roundToNearestThousand } from "@/lib/pricing";
import { useCart } from "@/hooks/useCart";
import type { DurationOption } from "./DurationSelector";

const CONTACT_LINKS = [
  { label: "Telegram", bg: "#229ED9", icon: Send, href: "https://t.me/hung_culi" },
  { label: "Messenger", bg: "#0084FF", icon: MessageCircle, href: "https://m.me/cyrusdemons" },
  { label: "Zalo", bg: "#0068FF", icon: PhoneCall, href: "https://zalo.me/0378304963" },
];

interface BuyButtonProps {
  selectedPackage: string | null;
  selectedDuration: string | null;
  selectedDurationData: DurationOption | null;
  productName?: string;
  imageUrl?: string;
}

export function BuyButton({ 
  selectedPackage, 
  selectedDuration, 
  selectedDurationData, 
  productName,
  imageUrl,
}: BuyButtonProps) {
  const { addItem } = useCart();
  const [showContactPopup, setShowContactPopup] = useState(false);
  const isEnabled = selectedPackage && selectedDuration;

  const getFinalPrice = () => {
    if (!selectedDurationData) return null;
    const discountPctRaw = Number((selectedDurationData as any).pct_promo) || 0;
    const hasPromo = discountPctRaw > 0;
    return hasPromo
      ? roundToNearestThousand(
          selectedDurationData.price * (1 - (discountPctRaw > 1 ? discountPctRaw / 100 : discountPctRaw))
        )
      : selectedDurationData.price;
  };

  const getOriginalPrice = () => {
    if (!selectedDurationData) return null;
    return selectedDurationData.price;
  };

  const getDiscountPercentage = () => {
    if (!selectedDurationData) return 0;
    const discountPctRaw = Number((selectedDurationData as any).pct_promo) || 0;
    return discountPctRaw > 1 ? discountPctRaw : discountPctRaw * 100;
  };

  const finalPrice = getFinalPrice();
  const originalPrice = getOriginalPrice();
  const discountPercentage = getDiscountPercentage();
  const isFreeProduct = isEnabled && finalPrice !== null && finalPrice === 0;

  const handleAddToCart = () => {
    if (!isEnabled || !selectedDurationData || finalPrice === null) return;

    const cartItem = {
      id: `${selectedPackage}-${selectedDuration}`,
      variantId: (selectedDurationData as any).id,
      name: productName || selectedPackage || "Sản phẩm",
      packageName: selectedPackage || "",
      duration: selectedDurationData.label,
      price: finalPrice,
      originalPrice: discountPercentage > 0 ? originalPrice || undefined : undefined,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      imageUrl,
    };

    addItem(cartItem);
    toast.success(`Đã thêm "${productName || selectedPackage}" vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    if (!isEnabled || !selectedDurationData || finalPrice === null) return;

    const cartItem = {
      id: `${selectedPackage}-${selectedDuration}`,
      variantId: (selectedDurationData as any).id,
      name: productName || selectedPackage || "Sản phẩm",
      packageName: selectedPackage || "",
      duration: selectedDurationData.label,
      price: finalPrice,
      originalPrice: discountPercentage > 0 ? originalPrice || undefined : undefined,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      imageUrl,
      quantity: 1,
    };

    // Save directly to localStorage before navigating
    const CART_STORAGE_KEY = "mavryk_cart";
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const existingItems = stored ? JSON.parse(stored) : [];
      
      const existingIndex = existingItems.findIndex(
        (i: any) => i.id === cartItem.id && i.duration === cartItem.duration
      );

      if (existingIndex >= 0) {
        existingItems[existingIndex].quantity += 1;
      } else {
        existingItems.push(cartItem);
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(existingItems));
      
      // Dispatch event for badge update
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: existingItems }));
    } catch (e) {
      console.error("Failed to save cart:", e);
    }

    toast.success(`Đã thêm "${productName || selectedPackage}" vào giỏ hàng!`);
    
    // Navigate to cart page
    window.history.pushState({}, "", "/gio-hang");
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="pt-2">
      <div className="flex gap-2">
        {isFreeProduct ? (
          /* Sản phẩm giá 0: nút Liên Hệ, bấm mở popup Telegram / Messenger / Zalo */
          <button
            type="button"
            onClick={() => setShowContactPopup(true)}
            className="group cursor-pointer relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Liên hệ</span>
          </button>
        ) : (
          <>
            {/* Mua ngay */}
            <button
              onClick={handleBuyNow}
              disabled={!isEnabled}
              className={`group cursor-pointer relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] ${
                isEnabled
                  ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600"
                  : "bg-gray-300 cursor-not-allowed text-gray-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              <ShoppingCart className={`h-4 w-4 ${!isEnabled && "text-gray-400 dark:text-slate-500"}`} />
              <span>Mua ngay</span>
            </button>

            {/* Thêm vào giỏ */}
            <button
              onClick={handleAddToCart}
              disabled={!isEnabled}
              title="Thêm vào giỏ hàng"
              className={`cursor-pointer flex items-center justify-center rounded-lg px-3 py-2.5 transition-all active:scale-[0.98] ${
                isEnabled
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-600 hover:to-indigo-600"
                  : "bg-gray-200 cursor-not-allowed text-gray-400 dark:bg-slate-700 dark:text-slate-500"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Popup Liên hệ: Telegram, Messenger, Zalo */}
      {showContactPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowContactPopup(false)}
          role="dialog"
          aria-label="Liên hệ"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Liên hệ với chúng tôi</h3>
              <button
                type="button"
                onClick={() => setShowContactPopup(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center gap-4">
              {CONTACT_LINKS.map(({ label, bg, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 sm:h-14 sm:w-14"
                  style={{ backgroundColor: bg }}
                  aria-label={label}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </a>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-gray-500 dark:text-slate-400">
              Chọn kênh để liên hệ
            </p>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {!selectedPackage && (
        <p className="mt-2 text-center text-[10px] font-semibold text-red-500 animate-pulse">
          * Vui lòng chọn gói sản phẩm
        </p>
      )}
      {selectedPackage && !selectedDuration && (
        <p className="mt-2 text-center text-[10px] font-semibold text-red-500 animate-pulse">
          * Vui lòng chọn thời gian sử dụng
        </p>
      )}
    </div>
  );
}
