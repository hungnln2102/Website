"use client";

import { Minus, Plus, Trash2, Package, FileText } from "lucide-react";

export interface CartItemData {
  id: string;
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
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
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
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
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

        {/* Additional Info */}
        {item.additionalInfo && Object.keys(item.additionalInfo).length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 dark:border-amber-800/40 dark:bg-amber-900/10">
            <div className="mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Thông tin bổ sung</span>
            </div>
            <div className="space-y-1">
              {Object.entries(item.additionalInfo)
                .filter(([, value]) => value.trim() !== "")
                .map(([key, value]) => (
                  <div key={key} className="flex items-baseline gap-1.5 text-xs">
                    <span className="font-medium text-gray-600 dark:text-slate-400 shrink-0">
                      {item.additionalInfoLabels?.[key] || key}:
                    </span>
                    <span className="text-gray-800 dark:text-slate-200 break-all">
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span
            className={`text-sm font-medium ${
              item.status === "in_stock"
                ? "text-green-600 dark:text-green-400"
                : "text-red-500"
            }`}
          >
            {item.status === "in_stock" ? "Còn hàng" : "Hết hàng"}
          </span>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(item.price)}
          </p>
          {item.original_price && item.discount_percentage && (
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                -{item.discount_percentage}%
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(item.original_price)}
              </span>
            </div>
          )}
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="mt-2 flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          aria-label="Xóa sản phẩm"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
