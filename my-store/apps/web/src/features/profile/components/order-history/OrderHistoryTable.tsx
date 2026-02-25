import { Eye, Copy, Check } from "lucide-react";
import type { UserOrder } from "@/lib/api";
import {
  getOrderTotal,
  getDynamicStatus,
  formatCompoundProductName,
  formatDateTime,
  formatCurrency,
  getCountdownLabel,
  type OrderStatusInfo,
} from "./utils";

export type OrderHistoryTableProps = {
  orders: UserOrder[];
  now: Date;
  copiedId: string | null;
  onCopyId: (id: string) => void;
  onSelectOrder: (order: UserOrder) => void;
};

export function OrderHistoryTable({
  orders,
  now,
  copiedId,
  onCopyId,
  onSelectOrder,
}: OrderHistoryTableProps) {
  return (
    <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/30">
      <table className="w-full table-fixed text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80">
            <th className="w-[10%] px-2 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Mã đơn hàng</th>
            <th className="w-[26%] px-2 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Sản phẩm</th>
            <th className="w-[20%] px-2 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Thời hạn</th>
            <th className="w-[12%] px-2 py-3.5 text-right font-semibold text-gray-600 dark:text-slate-300">Tổng tiền</th>
            <th className="w-[15%] px-2 py-3.5 text-center font-semibold text-gray-600 dark:text-slate-300">Trạng thái</th>
            <th className="w-[10%] px-2 py-3.5 text-center font-semibold text-gray-600 dark:text-slate-300"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {orders.map((order) => {
            const total = getOrderTotal(order);
            const status = getDynamicStatus(order);
            const productNames = order.items.map((i) => formatCompoundProductName(i)).join(", ");
            const dbExpDateStr = order.items[0]?.order_expired;
            const expDate = dbExpDateStr ? new Date(dbExpDateStr) : null;
            return (
              <tr
                key={order.id_order}
                className="bg-white transition-colors hover:bg-blue-50/30 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
              >
                <td className="px-2 py-3.5 align-middle">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white truncate min-w-0" title={order.id_order}>
                      {order.id_order}
                    </span>
                    <button
                      onClick={() => onCopyId(order.id_order)}
                      className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      title="Sao chép mã"
                    >
                      {copiedId === order.id_order ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-2 py-3.5 align-middle">
                  <p className="text-gray-700 dark:text-slate-300 truncate min-w-0" title={productNames}>
                    {productNames}
                  </p>
                  {order.items.length > 1 && (
                    <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 block" title={`${order.items.length} sản phẩm`}>
                      {order.items.length} sp
                    </span>
                  )}
                </td>
                <td className="px-2 py-3.5 text-gray-600 dark:text-slate-400 align-middle min-w-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs whitespace-nowrap">
                      {formatDateTime(order.order_date)} - {expDate ? formatDateTime(expDate.toISOString()) : "—"}
                    </span>
                    <span className={expDate && expDate.getTime() <= now.getTime() ? "text-rose-600 dark:text-rose-400 font-medium text-xs" : "text-xs"}>
                      {getCountdownLabel(expDate, now)}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3.5 text-right font-semibold text-gray-900 dark:text-white align-middle whitespace-nowrap">
                  {formatCurrency(total)}
                </td>
                <td className="px-2 py-3.5 text-center align-middle">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${status.cls}`}
                    title={status.label}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-2 py-3.5 text-center align-middle">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="inline-flex rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
