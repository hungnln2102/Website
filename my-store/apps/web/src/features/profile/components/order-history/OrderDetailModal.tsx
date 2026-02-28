import { useState, useCallback } from "react";
import { X, Check, Copy, ShoppingBag } from "lucide-react";
import FocusTrap from "@/components/accessibility/FocusTrap";
import type { UserOrder } from "@/lib/api";
import {
  getOrderTotal,
  getDynamicStatus,
  formatDateTime,
  formatCurrency,
  formatCompoundProductName,
  getCountdownLabel,
} from "./utils";

export type OrderDetailModalProps = {
  order: UserOrder;
  onClose: () => void;
  now: Date;
  copiedId: string | null;
  onCopyId: (id: string) => void;
};

export function OrderDetailModal({ order, onClose, now, copiedId, onCopyId }: OrderDetailModalProps) {
  const [copiedAccountIdx, setCopiedAccountIdx] = useState<number | null>(null);

  const copyAccountInfo = useCallback((text: string, itemIdx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAccountIdx(itemIdx);
      setTimeout(() => setCopiedAccountIdx(null), 2000);
    });
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <FocusTrap isActive onEscape={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          className="fixed inset-x-4 top-1/2 z-[101] max-h-[85vh] max-w-4xl w-full -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 dark:border-slate-700 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h3 id="order-detail-title" className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết đơn hàng</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-y-auto min-h-0 bg-white dark:bg-slate-900">
          <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/20 flex flex-col gap-6">
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Mã đơn hàng</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order.id_order}</span>
                  <button
                    onClick={() => onCopyId(order.id_order)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    title="Sao chép mã"
                  >
                    {copiedId === order.id_order ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Thời gian đặt</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(order.order_date)}</span>
              </div>
              {order.payment_id != null && order.payment_id !== "" && (
                <div>
                  <span className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">ID thanh toán</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white break-all">{order.payment_id}</span>
                    <button
                      onClick={() => onCopyId(order.payment_id!)}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300 shrink-0"
                      title="Sao chép ID thanh toán"
                    >
                      {copiedId === order.payment_id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Trạng thái</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getDynamicStatus(order).cls}`}>
                  {getDynamicStatus(order).label}
                </span>
              </div>
            </div>
            <div className="mt-auto rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30">
              <span className="block text-sm font-medium text-blue-600/80 dark:text-blue-400/80 mb-1">Tổng cộng</span>
              <span className="block text-2xl font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(getOrderTotal(order))}
              </span>
            </div>
          </div>

          <div className="flex-1 p-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-200 mb-4">
              <ShoppingBag className="h-4 w-4 text-blue-500" />
              Sản phẩm ({order.items.length})
            </h4>
            <div className="space-y-4">
              {order.items.map((item, idx) => {
                const compoundName = formatCompoundProductName(item);
                const infoNote = item.information_order || item.note;
                const slot = item.slot;
                const expDate = item.order_expired ? new Date(item.order_expired) : null;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-5 shadow-sm dark:border-slate-600/60 dark:bg-slate-800/50"
                  >
                    {/* Tên sản phẩm + giá */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-gray-200/80 dark:border-slate-600/60">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-base leading-snug">
                        {compoundName}
                      </h5>
                      <span className="shrink-0 text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency((item.price || 0) * (item.quantity ?? 1))}
                      </span>
                    </div>
                    {item.quantity != null && item.quantity > 1 && (
                      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
                        Số lượng: {item.quantity} × {formatCurrency(item.unitPrice || item.price)}
                      </p>
                    )}
                    {/* Lưới thông tin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1 rounded-xl bg-white/80 px-4 py-3 dark:bg-slate-700/40 dark:border dark:border-slate-600/40">
                          <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">Ngày mua</span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                            {formatDateTime(order.order_date)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 rounded-xl bg-blue-50/80 px-4 py-3 dark:bg-blue-900/25 dark:border dark:border-blue-800/40">
                          <span className="text-xs font-medium uppercase tracking-wider text-blue-600/90 dark:text-blue-400/90">Ngày hết hạn</span>
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {order.status === "Đang Tạo Đơn" ? "—" : (expDate ? formatDateTime(expDate.toISOString()) : "—")}
                          </span>
                          {!order.status?.includes("Đang Tạo Đơn") && expDate && (
                            <span
                              className={`inline-flex w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                expDate.getTime() <= now.getTime()
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              }`}
                            >
                              {getCountdownLabel(expDate, now)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {slot && (
                          <div className="flex flex-col gap-1 rounded-xl bg-white/80 px-4 py-3 dark:bg-slate-700/40 dark:border dark:border-slate-600/40">
                            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">Slot</span>
                            <span className="inline-flex w-fit rounded-lg bg-gray-200/80 px-2.5 py-1 text-sm font-semibold text-gray-800 dark:bg-slate-600/60 dark:text-slate-200">
                              {slot}
                            </span>
                          </div>
                        )}
                        {infoNote && order.status !== "Đang Tạo Đơn" && (
                          <div className="flex flex-col gap-1.5 rounded-xl bg-white/80 px-4 py-3 dark:bg-slate-700/40 dark:border dark:border-slate-600/40 min-h-0">
                            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-500">Thông tin tài khoản</span>
                            <div className="flex items-center gap-2 rounded-lg bg-gray-100/80 p-3 dark:bg-slate-800/60">
                              <code className="flex-1 min-w-0 text-sm font-mono text-gray-800 dark:text-slate-200 break-words select-all leading-relaxed">
                                {infoNote}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyAccountInfo(infoNote, idx)}
                                className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-600 dark:hover:text-slate-300"
                                title="Sao chép thông tin tài khoản"
                              >
                                {copiedAccountIdx === idx ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      </FocusTrap>
    </>
  );
}
