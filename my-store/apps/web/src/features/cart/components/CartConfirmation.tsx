"use client";

import { ArrowLeft, ShoppingBag, CreditCard, QrCode, Wallet, CheckCircle, Shield } from "lucide-react";
import type { CartItemData } from "./CartItem";

export type PaymentMethod = "vnpay" | "qr" | "momo_later" | "momo" | "topup" | "balance";

interface CartConfirmationProps {
  cartItems: CartItemData[];
  total: number;
  discount: number;
  paymentMethod: PaymentMethod;
  onBack: () => void;
  onConfirm: () => void;
}

const formatCurrency = (value: number) =>
  `${value.toLocaleString("vi-VN")}đ`;

const getPaymentMethodInfo = (method: PaymentMethod) => {
  const methods = {
    vnpay: {
      name: "VNPay & Banking",
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    qr: {
      name: "QR Banking",
      icon: QrCode,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      borderColor: "border-indigo-200 dark:border-indigo-800",
    },
    momo_later: {
      name: "Ví Trả Sau MoMo",
      icon: Wallet,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      borderColor: "border-pink-200 dark:border-pink-800",
    },
    momo: {
      name: "MoMo",
      icon: Wallet,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      borderColor: "border-pink-200 dark:border-pink-800",
    },
    topup: {
      name: "Nạp vào tài khoản",
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    balance: {
      name: "Số dư tài khoản",
      icon: Wallet,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
  };
  return methods[method];
};

export function CartConfirmation({
  cartItems,
  total,
  discount,
  paymentMethod,
  onBack,
  onConfirm,
}: CartConfirmationProps) {
  const paymentInfo = getPaymentMethodInfo(paymentMethod);
  const PaymentIcon = paymentInfo.icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Title */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <ShoppingBag className="h-6 w-6 text-blue-600" />
          Xác nhận đơn hàng
        </h2>
      </div>

      {/* Content - Horizontal Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left - Product List */}
        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700 p-6">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <img
                  src={item.image_url || "https://placehold.co/80x80?text=Product"}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Số lượng: {item.quantity}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    {item.original_price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(item.original_price * item.quantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Details */}
          <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-slate-700">
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">Giảm giá</span>
                <span className="font-medium text-green-600">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">Tổng thanh toán</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Right - Payment & Contact Info */}
        <div className="w-full lg:w-96 p-6 space-y-4">
          {/* Payment Method */}
          <div className={`rounded-xl border ${paymentInfo.borderColor} ${paymentInfo.bgColor} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Phương thức thanh toán
            </h3>
            <div className="flex items-center gap-3">
              <div className={`rounded-full ${paymentInfo.bgColor} p-2`}>
                <PaymentIcon className={`h-5 w-5 ${paymentInfo.color}`} />
              </div>
              <div>
                <p className={`font-semibold ${paymentInfo.color}`}>{paymentInfo.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Thanh toán an toàn & bảo mật
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Giao dịch an toàn & bảo mật
                </p>
                <p className="text-xs text-green-700 dark:text-green-500">
                  Thông tin thanh toán của bạn được mã hóa và bảo vệ an toàn.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={onConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 active:scale-95 cursor-pointer"
            >
              <CheckCircle className="h-5 w-5" />
              Xác nhận thanh toán
            </button>
            <button
              onClick={onBack}
              className="flex w-full items-center justify-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 cursor-pointer dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Trở về Giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
