import { Calendar, Package } from "lucide-react";
import type { UserOrder } from "@/lib/api";
import { getOrderTotal, getDynamicStatus, formatDateTime, formatCurrency, formatCompoundProductName, getCountdownLabel } from "./utils";

export type OrderHistoryCardsProps = {
  orders: UserOrder[];
  now: Date;
  onSelectOrder: (order: UserOrder) => void;
};

export function OrderHistoryCards({ orders, now, onSelectOrder }: OrderHistoryCardsProps) {
  return (
    <div className="space-y-3 md:hidden">
      {orders.map((order) => {
        const total = getOrderTotal(order);
        const status = getDynamicStatus(order);
        const mobileExpDate = order.items[0]?.order_expired ? new Date(order.items[0].order_expired) : null;
        return (
          <div
            key={order.id_order}
            onClick={() => onSelectOrder(order)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order.id_order}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${status.cls}`}>
                {status.label}
              </span>
            </div>
            <div className="mb-1.5 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>Ngày đăng ký: {formatDateTime(order.order_date)}</span>
            </div>
            {mobileExpDate && (
              <>
                <div className="mb-1 text-xs text-gray-500 dark:text-slate-400">
                  Ngày hết hạn: {formatDateTime(mobileExpDate.toISOString())}
                </div>
                <div
                  className={`mb-2 text-xs font-medium ${
                    mobileExpDate.getTime() <= now.getTime() ? "text-rose-600 dark:text-rose-400" : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {getCountdownLabel(mobileExpDate, now)}
                </div>
              </>
            )}
            <div className="mb-3 flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
              <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-slate-500" />
              <span className="line-clamp-2">
                {order.items.map((i) => formatCompoundProductName(i)).join(", ")}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-slate-700">
              <span className="text-xs text-gray-500 dark:text-slate-400">{order.items.length} sản phẩm</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
