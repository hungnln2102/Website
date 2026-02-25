"use client";

import { useMemo } from "react";
import { allocatePromoByItems } from "@/lib/utils/promoAllocation";

export interface PromoAllocationItem {
  /** Nhãn hiển thị (tùy chọn) */
  label?: string;
  /** Giá đơn vị */
  price: number;
  /** Số lượng, mặc định 1 */
  quantity?: number;
}

export interface PromoAllocationProps {
  /** Danh sách item (giá + số lượng) */
  items: PromoAllocationItem[];
  /** Tổng discount cần phân bổ (D) */
  totalDiscount: number;
  /** Có hiển thị bảng chi tiết từng dòng không */
  showBreakdown?: boolean;
  /** Format số tiền */
  formatCurrency?: (value: number) => string;
  /** Class name cho container */
  className?: string;
}

const defaultFormat = (v: number) => `${v.toLocaleString("vi-VN")}đ`;

/**
 * Component tính toán và hiển thị phân bổ giá trị promo (discount) theo công thức:
 * - Bước 1: Di = round(D * Pi / S) với i = 1..n-1
 * - Bước 2: Dn = D - (D1 + ... + D(n-1))
 * Đảm bảo tổng discount phân bổ = totalDiscount chính xác, không lệch 1 đồng.
 */
export function PromoAllocation({
  items,
  totalDiscount,
  showBreakdown = true,
  formatCurrency = defaultFormat,
  className = "",
}: PromoAllocationProps) {
  const { subtotal, allocation, totalAfterDiscount } = useMemo(() => {
    const lineTotals = items.map((i) => (i.price || 0) * Math.max(1, i.quantity ?? 1));
    const subtotal = lineTotals.reduce((s, p) => s + p, 0);
    const allocation = allocatePromoByItems(
      items.map((i) => ({ price: i.price, quantity: i.quantity ?? 1 })),
      totalDiscount
    );
    const totalAfterDiscount = Math.max(0, subtotal - totalDiscount);
    return { subtotal, allocation, totalAfterDiscount };
  }, [items, totalDiscount]);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {showBreakdown && (
        <div className="space-y-1 text-sm">
          {items.map((item, i) => {
            const qty = Math.max(1, item.quantity ?? 1);
            const lineTotal = item.price * qty;
            const discount = allocation[i] ?? 0;
            return (
              <div
                key={i}
                className="flex justify-between text-gray-600 dark:text-slate-400"
              >
                <span>
                  {item.label ?? `Sản phẩm ${i + 1}`}
                  {qty > 1 && ` × ${qty}`}
                </span>
                <span>
                  {formatCurrency(lineTotal)}
                  {discount > 0 && (
                    <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(discount)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 border-t border-gray-200 dark:border-slate-600 pt-2 space-y-1 text-sm">
        <div className="flex justify-between font-medium text-gray-700 dark:text-slate-300">
          <span>Tạm tính</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Giảm giá</span>
            <span>-{formatCurrency(totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
          <span>Tổng thanh toán</span>
          <span>{formatCurrency(totalAfterDiscount)}</span>
        </div>
      </div>
    </div>
  );
}
