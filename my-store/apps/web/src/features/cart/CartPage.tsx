"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { CartProgressSteps, CartItem, CartSummary, CartConfirmation, PaymentStep } from "./components";
import type { CartItemData, PaymentMethod } from "./components";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useScroll } from "@/hooks/useScroll";
import { useAuth } from "@/features/auth/hooks";
import { fetchProducts, fetchCategories, type CategoryDto } from "@/lib/api";
import { slugify } from "@/lib/utils";

interface CartPageProps {
  onBack: () => void;
  onProductClick: (slug: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export default function CartPage({ 
  onBack, 
  onProductClick,
  searchQuery = "",
  onSearchChange = () => {},
}: CartPageProps) {
  const isScrolled = useScroll();
  const { user, logout, updateUser } = useAuth();

  // Fetch products and categories for header
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { items: cartStorageItems, updateQuantity, removeItem, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  // Convert cart storage items to CartItemData format
  const cartItems: CartItemData[] = useMemo(() => 
    cartStorageItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.duration,
      image_url: item.imageUrl || "https://placehold.co/200x200?text=Product",
      price: item.price,
      original_price: item.originalPrice,
      discount_percentage: item.discountPercentage,
      quantity: item.quantity,
      tags: [item.packageName, item.duration].filter(Boolean),
      status: "in_stock" as const,
      additionalInfo: item.additionalInfo,
      additionalInfoLabels: item.additionalInfoLabels,
      variant_name: item.packageName || undefined,
      duration: item.duration,
      note: item.additionalInfo 
        ? Object.entries(item.additionalInfo)
            .filter(([, val]) => val.trim() !== "")
            .map(([k, v]) => `${item.additionalInfoLabels?.[k] || k}: ${v}`)
            .join(' | ') 
        : undefined,
    })),
  [cartStorageItems]);

  // Handle category click
  const handleCategoryClick = (catSlug: string) => {
    window.history.pushState({}, "", `/danh-muc/${encodeURIComponent(catSlug)}`);
    window.dispatchEvent(new Event("popstate"));
  };

  // Calculate totals
  const { subtotal, discount, total } = useMemo(() => {
    const sub = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const disc = cartItems.reduce((sum, item) => {
      if (item.original_price && item.discount_percentage) {
        return sum + (item.original_price - item.price) * item.quantity;
      }
      return sum;
    }, 0);
    return {
      subtotal: sub,
      discount: disc,
      total: sub,
    };
  }, [cartItems]);

  const balance = typeof user?.balance === "number" ? user.balance : 0;

  const handleQuantityChange = (id: string, quantity: number) => {
    // Find the item to get its duration for the updateQuantity call
    const item = cartStorageItems.find((i) => i.id === id);
    if (item) {
      updateQuantity(id, item.duration, quantity);
    }
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  // Handle payment method selection - go to step 2
  const handlePaymentSelect = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Go back to step 1
  const handleBackToCart = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Confirm payment - go to step 3
  const handleConfirmPayment = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle payment success (newBalance from MCoin payment)
  const handlePaymentSuccess = (orderId: string, newBalance?: number) => {
    toast.success("Thanh toán thành công!");
    if (typeof newBalance === "number" && updateUser) {
      updateUser({ balance: newBalance });
    }
    clearCart();
  };

  // Handle payment failure
  const handlePaymentFailed = (error: string) => {
    toast.error(error || "Thanh toán thất bại");
    console.log("Payment failed:", error);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Site Header */}
      <SiteHeader
        isScrolled={isScrolled}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onLogoClick={onBack}
        products={allProducts.map((p) => ({
          id: String(p.id),
          name: p.name,
          slug: p.slug,
          image_url: p.image_url,
          base_price: p.base_price ?? 0,
          discount_percentage: p.discount_percentage ?? 0,
        }))}
        categories={categories.map((c: CategoryDto) => ({
          id: String(c.id),
          name: c.name,
          slug: slugify(c.name),
        }))}
        onProductClick={onProductClick}
        onCategoryClick={handleCategoryClick}
        user={user}
        onLogout={logout}
      />

      {/* Back Navigation - Hide on payment step */}
      {currentStep !== 3 && (
        <div className="border-b border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 active:scale-95 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {/* Progress Steps */}
        <CartProgressSteps currentStep={currentStep} />

        {currentStep === 3 && selectedPaymentMethod ? (
          /* Step 3: Payment */
          <PaymentStep
            cartItems={cartItems}
            total={total}
            paymentMethod={selectedPaymentMethod}
            onBack={handleBackToCart}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailed={handlePaymentFailed}
          />
        ) : currentStep === 2 && selectedPaymentMethod ? (
          /* Step 2: Confirmation */
          <CartConfirmation
            cartItems={cartItems}
            total={total}
            discount={discount}
            paymentMethod={selectedPaymentMethod}
            onBack={handleBackToCart}
            onConfirm={handleConfirmPayment}
          />
        ) : cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-800">
            <ShoppingCart className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-600" />
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Giỏ hàng trống
            </h2>
            <p className="mb-6 text-gray-500 dark:text-slate-400">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <button
              onClick={onBack}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
            >
              Khám phá sản phẩm
            </button>
          </div>
        ) : currentStep === 1 ? (
          /* Step 1: Cart Content - Horizontal Layout */
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            {/* Title */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <ShoppingCart className="h-6 w-6" />
                Giỏ hàng
                <span className="text-base font-normal text-gray-500 dark:text-slate-400">
                  ({cartItems.length} sản phẩm)
                </span>
              </h2>
            </div>

            {/* Content - Horizontal */}
            <div className="flex flex-col lg:flex-row">
              {/* Left - Cart Items */}
              <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700 p-6">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              </div>

              {/* Right - Summary */}
              <div className="w-full lg:w-96 p-6">
                <CartSummary
                  subtotal={subtotal}
                  discount={discount}
                  total={total}
                  balance={balance}
                  onPaymentSelect={handlePaymentSelect}
                />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
