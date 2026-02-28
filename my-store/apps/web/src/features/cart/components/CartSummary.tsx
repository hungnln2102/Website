"use client";

import { useState } from "react";
import { Percent, QrCode, Wallet } from "lucide-react";

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
  const [discountCode, setDiscountCode] = useState("");

  return (
    <div className="space-y-4">
      {/* Discount Code */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Mã khuyến mãi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(event) => setDiscountCode(event.target.value)}
            placeholder="Nhập mã khuyến mãi"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
          />
          <button
            type="button"
            className="h-10 shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            Áp Dụng
          </button>
        </div>
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
        </div>
      </div>

      {/* Payment Buttons - Chỉ 2 lựa chọn: Thanh Toán Mcoin + Mua Siêu Tốc Qua... (QR) */}
      <div className="space-y-3">
        <button
          onClick={() => onPaymentSelect("balance")}
          disabled={balance < total}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-emerald-500/25"
        >
          <Wallet className="h-5 w-5" />
          Thanh Toán Mcoin
        </button>

        <button
          onClick={() => onPaymentSelect("qr")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-500 bg-white py-3 font-semibold text-indigo-600 transition-all hover:bg-indigo-50 cursor-pointer active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <QrCode className="h-5 w-5" />
          Thanh Toán Qua QR
        </button>
      </div>
    </div>
  );
}
