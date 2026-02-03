"use client";

import { useState } from "react";
import { User, Percent, Gift, CreditCard, QrCode, Wallet } from "lucide-react";

type PaymentMethod = "vnpay" | "qr" | "momo_later" | "momo" | "topup" | "balance";

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  balance: number;
  onPaymentSelect: (paymentMethod: PaymentMethod) => void;
}

const formatCurrency = (value: number) =>
  `${value.toLocaleString("vi-VN")}đ`;

export function CartSummary({
  subtotal,
  discount,
  total,
  balance,
  onPaymentSelect,
}: CartSummaryProps) {
  const [referralCode, setReferralCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [isGift, setIsGift] = useState(false);

  const amountToAdd = Math.max(0, total - balance);

  return (
    <div className="space-y-4">
      {/* Referral Code */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Bạn có mã giới thiệu?
          </span>
        </div>
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer">
          Nhập mã
        </button>
      </div>

      {/* Discount Code */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Bạn có mã ưu đãi?
          </span>
        </div>
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer">
          Nhập mã
        </button>
      </div>

      {/* Gift Option */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Bạn muốn tặng cho bạn bè?
          </span>
        </div>
        <button
          onClick={() => setIsGift(!isGift)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            isGift ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
              isGift ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Payment Summary */}
      <div className="border-t border-gray-200 pt-4 dark:border-slate-700">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Thanh toán
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-slate-400">
              Tổng giá trị sản phẩm
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(subtotal)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-400">
                Giảm giá
              </span>
              <span className="font-medium text-green-600">
                -{formatCurrency(discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-3 dark:border-slate-700">
            <span className="font-medium text-gray-900 dark:text-white">
              Tổng giá trị phải thanh toán
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-slate-400">
              Số dư hiện tại
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(balance)}
            </span>
          </div>
          {amountToAdd > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-400">
                Số tiền cần nạp thêm
              </span>
              <span className="font-medium text-red-500">
                {formatCurrency(amountToAdd)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Buttons */}
      <div className="space-y-3">
        {balance >= total ? (
          <button
            onClick={() => onPaymentSelect("balance")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 cursor-pointer active:scale-95"
          >
            <Wallet className="h-5 w-5" />
            Thanh toán Mcoin
          </button>
        ) : (
          <>
            <button
              onClick={() => onPaymentSelect("topup")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 cursor-pointer active:scale-95"
            >
              <Wallet className="h-5 w-5" />
              Nạp thêm vào tài khoản
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-slate-400">
              Quét mã. Thanh toán. Không cần nạp tiền.
            </p>
          </>
        )}

        <button
          onClick={() => onPaymentSelect("vnpay")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-500 bg-white py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50 cursor-pointer active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <CreditCard className="h-5 w-5" />
          Mua siêu tốc qua VNPay & Banking
        </button>

        <button
          onClick={() => onPaymentSelect("qr")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-500 bg-white py-3 font-semibold text-indigo-600 transition-all hover:bg-indigo-50 cursor-pointer active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <QrCode className="h-5 w-5" />
          Mua siêu tốc qua QR Banking
        </button>

        <button
          onClick={() => onPaymentSelect("momo_later")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3 font-semibold text-white shadow-lg shadow-pink-500/25 transition-all hover:shadow-pink-500/40 cursor-pointer active:scale-95"
        >
          <Wallet className="h-5 w-5" />
          Thanh toán với Ví Trả Sau trên MoMo
        </button>

        <button
          onClick={() => onPaymentSelect("momo")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 py-3 font-semibold text-white shadow-lg shadow-pink-500/25 transition-all hover:shadow-pink-500/40 cursor-pointer active:scale-95"
        >
          <Wallet className="h-5 w-5" />
          Mua siêu tốc với MoMo
        </button>
      </div>
    </div>
  );
}
