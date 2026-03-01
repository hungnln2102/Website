"use client";

import { Minus, Plus, Trash2, Package, FileText } from "lucide-react";

export interface CartItemData {
  id: string;
  /** variant_id từ DB — dùng cho order_list.id_product khi thanh toán */
  variantId?: string;
  name: string;
  description?: string;
  image_url: string | null;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  quantity: number;
  tags?: string[];
  status: "in_stock" | "out_of_stock";
  /** Thông tin bổ sung: { [input_id]: value } */
  additionalInfo?: Record<string, string>;
  /** Label tương ứng: { [input_id]: input_name } */
  additionalInfoLabels?: Record<string, string>;
  /** Dữ liệu map cho Order lưu database */
  variant_name?: string;
  duration?: string;
  note?: string;
}

interface CartItemProps {
  item: CartItemData;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const formatCurrency = (value: number) =>
  `${value.toLocaleString("vi-VN")}đ`;

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/95 dark:shadow-none dark:hover:shadow-none">
      {/* Product Image */}
      <div className="flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-24 w-24 rounded-lg object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700 sm:h-32 sm:w-32">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              {item.description}
            </p>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Giá — một hàng ngang: giá hiện tại, % giảm, giá gốc gạch ngang */}
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
            {formatCurrency(item.price)}
          </span>
          {item.original_price != null && item.original_price > item.price && (
            <>
              {item.discount_percentage != null && item.discount_percentage > 0 && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                  -{Math.round(item.discount_percentage)}%
                </span>
              )}
              <span className="text-sm tabular-nums text-gray-400 line-through dark:text-slate-500">
                {formatCurrency(item.original_price)}
              </span>
            </>
          )}
        </div>

        {/* Thông tin bổ sung — nằm dưới giá (màu vàng/amber như trước) */}
        {item.additionalInfo && Object.keys(item.additionalInfo).length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Thông tin bổ sung
              </span>
            </div>
            <ul className="mt-1.5 space-y-1 border-t border-amber-200/80 pt-1.5 dark:border-amber-700/50">
              {Object.entries(item.additionalInfo)
                .filter(([, value]) => value.trim() !== "")
                .map(([key, value]) => (
                  <li key={key} className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
                    <span className="shrink-0 font-medium text-amber-800/90 dark:text-amber-200/90">
                      {item.additionalInfoLabels?.[key] || key}:
                    </span>
                    <span className="min-w-0 break-words text-gray-800 dark:text-amber-100">
                      {value}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${
              item.status === "in_stock"
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                item.status === "in_stock" ? "bg-green-500" : "bg-red-500"
              }`}
              aria-hidden
            />
            {item.status === "in_stock" ? "Còn hàng" : "Hết hàng"}
          </span>
        </div>
      </div>

      {/* Right: Quantity + Remove (giá đã chuyển lên trên form ở cột giữa) */}
      <div className="flex flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Giảm số lượng"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-900 dark:text-white">
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Tăng số lượng"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          aria-label="Xóa sản phẩm"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
