/**
 * Status Constants — định nghĩa tập trung tất cả giá trị status dùng trong UI.
 * Mỗi status có: code (giá trị DB), label_vi, label_en, description, sort_order, is_active.
 * Badge style (cls) dành riêng cho frontend hiển thị.
 */

export interface StatusDef {
  code: string;
  label_vi: string;
  label_en: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface OrderStatusDisplay extends StatusDef {
  /** Tailwind class cho badge */
  cls: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Code constants (khớp với giá trị lưu trong DB)
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_CUSTOMER_STATUS = {
  CREATING:        "Đang Tạo Đơn",
  CREATING_LEGACY: "dang_tao_don",
  PENDING:         "pending",
  PAID:            "paid",
} as const;

export const ORDER_LIST_STATUS = {
  UNPAID:         "Chưa Thanh Toán",
  PROCESSING:     "Đang Xử Lý",
  PAID:           "Đã Thanh Toán",
  NEEDS_RENEWAL:  "Cần Gia Hạn",
  EXPIRED:        "Hết Hạn",
  PENDING_REFUND: "Chưa Hoàn",
  REFUNDED:       "Đã Hoàn",
  CANCELLED:      "Đã Hủy",
} as const;

export type OrderStatusCode =
  | (typeof ORDER_CUSTOMER_STATUS)[keyof typeof ORDER_CUSTOMER_STATUS]
  | (typeof ORDER_LIST_STATUS)[keyof typeof ORDER_LIST_STATUS];

// ─────────────────────────────────────────────────────────────────────────────
// Display definitions (label + badge style)
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_STATUS_DISPLAY: OrderStatusDisplay[] = [
  {
    code:        ORDER_CUSTOMER_STATUS.CREATING,
    label_vi:    "Đang Tạo Đơn",
    label_en:    "Creating Order",
    description: "Đơn vừa được tạo, đang chờ hệ thống xử lý",
    sort_order:  1,
    is_active:   true,
    cls: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.UNPAID,
    label_vi:    "Chưa Thanh Toán",
    label_en:    "Unpaid",
    description: "Đơn QR đang chờ khách xác nhận thanh toán",
    sort_order:  2,
    is_active:   true,
    cls: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.PROCESSING,
    label_vi:    "Đang Xử Lý",
    label_en:    "Processing",
    description: "Thanh toán xác nhận, bot đang bàn giao dịch vụ",
    sort_order:  3,
    is_active:   true,
    cls: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.PAID,
    label_vi:    "Đã Thanh Toán",
    label_en:    "Paid",
    description: "Bot đã bàn giao xong, dịch vụ đang hoạt động",
    sort_order:  4,
    is_active:   true,
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.NEEDS_RENEWAL,
    label_vi:    "Cần Gia Hạn",
    label_en:    "Needs Renewal",
    description: "Dịch vụ sắp hết hạn trong vòng 4 ngày",
    sort_order:  5,
    is_active:   true,
    cls: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.EXPIRED,
    label_vi:    "Hết Hạn",
    label_en:    "Expired",
    description: "Dịch vụ đã hết hạn sử dụng",
    sort_order:  6,
    is_active:   true,
    cls: "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.PENDING_REFUND,
    label_vi:    "Chưa Hoàn",
    label_en:    "Pending Refund",
    description: "Đơn đang chờ hoàn tiền",
    sort_order:  7,
    is_active:   true,
    cls: "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.REFUNDED,
    label_vi:    "Đã Hoàn",
    label_en:    "Refunded",
    description: "Đã hoàn tiền cho khách hàng",
    sort_order:  8,
    is_active:   true,
    cls: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
  },
  {
    code:        ORDER_LIST_STATUS.CANCELLED,
    label_vi:    "Đã Hủy",
    label_en:    "Cancelled",
    description: "Đơn hàng đã bị hủy",
    sort_order:  9,
    is_active:   true,
    cls: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  },
];

/** Tra cứu nhanh display theo code */
export const ORDER_STATUS_MAP: Record<string, OrderStatusDisplay> = Object.fromEntries(
  ORDER_STATUS_DISPLAY.map((s) => [s.code, s])
);

/**
 * Lấy display info cho một status code.
 * Fallback về PAID nếu không tìm thấy.
 */
export function getStatusDisplay(code: string): OrderStatusDisplay {
  return (
    ORDER_STATUS_MAP[code] ??
    ORDER_STATUS_MAP[ORDER_LIST_STATUS.PAID]!
  );
}
