/**
 * Status Constants — định nghĩa tập trung tất cả giá trị status dùng trong hệ thống.
 * Dùng các hằng số này thay vì hardcode string trực tiếp trong SQL / service.
 */

export interface StatusDef {
  code: string;
  label_vi: string;
  label_en: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// order_customer.status
// Ghi vào khi tạo đơn; cập nhật khi thanh toán xác nhận.
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_CUSTOMER_STATUS = {
  /** MCoin: tạo đơn ngay sau khi trừ ví */
  CREATING: "Đang Tạo Đơn",
  /** QR: đơn chờ thanh toán (chưa xác nhận) */
  PENDING: "Chờ Thanh Toán",
  /** QR: thanh toán đã được xác nhận (webhook / confirm) */
  PAID: "Hoàn Thành",
  CANCELLED: "Đã Hủy",
} as const;

export type OrderCustomerStatus = (typeof ORDER_CUSTOMER_STATUS)[keyof typeof ORDER_CUSTOMER_STATUS];

// ─────────────────────────────────────────────────────────────────────────────
// order_list.status
// Nguồn duy nhất để xác định trạng thái đơn hàng.
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_LIST_STATUS = {
  /** QR: đơn đã tạo, khách chưa thanh toán */
  UNPAID:         "Chưa Thanh Toán",
  /** Thanh toán xác nhận, bot đang xử lý giao hàng */
  PROCESSING:     "Đang Xử Lý",
  /** Bot đã bàn giao xong, dịch vụ đang hoạt động */
  PAID:           "Đã Thanh Toán",
  /** Dịch vụ sắp hết hạn (trong vòng 4 ngày) */
  NEEDS_RENEWAL:  "Cần Gia Hạn",
  /** Dịch vụ đã hết hạn sử dụng */
  EXPIRED:        "Hết Hạn",
  /** Đang chờ hoàn tiền */
  PENDING_REFUND: "Chưa Hoàn",
  /** Đã hoàn tiền cho khách */
  REFUNDED:       "Đã Hoàn",
  /** Đơn hàng đã bị hủy */
  CANCELLED:      "Đã Hủy",
} as const;

export type OrderListStatus = (typeof ORDER_LIST_STATUS)[keyof typeof ORDER_LIST_STATUS];

/** Các status bị loại khỏi thống kê doanh thu */
export const ORDER_LIST_STATUS_EXCLUDE_FROM_STATS: string[] = [
  ORDER_LIST_STATUS.PENDING_REFUND,
  ORDER_LIST_STATUS.REFUNDED,
  ORDER_LIST_STATUS.CANCELLED,
];

// ─────────────────────────────────────────────────────────────────────────────
// Metadata đầy đủ — dùng khi cần render hoặc seed DB
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_STATUS_DEFS: StatusDef[] = [
  {
    code:        ORDER_CUSTOMER_STATUS.CREATING,
    label_vi:    "Đang Tạo Đơn",
    label_en:    "Creating Order",
    description: "Đơn vừa được tạo, đang chờ hệ thống xử lý",
    sort_order:  1,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.UNPAID,
    label_vi:    "Chưa Thanh Toán",
    label_en:    "Unpaid",
    description: "Đơn QR đang chờ khách xác nhận thanh toán",
    sort_order:  2,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.PROCESSING,
    label_vi:    "Đang Xử Lý",
    label_en:    "Processing",
    description: "Thanh toán xác nhận, bot đang bàn giao dịch vụ",
    sort_order:  3,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.PAID,
    label_vi:    "Đã Thanh Toán",
    label_en:    "Paid",
    description: "Bot đã bàn giao xong, dịch vụ đang hoạt động",
    sort_order:  4,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.NEEDS_RENEWAL,
    label_vi:    "Cần Gia Hạn",
    label_en:    "Needs Renewal",
    description: "Dịch vụ sắp hết hạn trong vòng 4 ngày",
    sort_order:  5,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.EXPIRED,
    label_vi:    "Hết Hạn",
    label_en:    "Expired",
    description: "Dịch vụ đã hết hạn sử dụng",
    sort_order:  6,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.PENDING_REFUND,
    label_vi:    "Chưa Hoàn",
    label_en:    "Pending Refund",
    description: "Đơn đang chờ hoàn tiền",
    sort_order:  7,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.REFUNDED,
    label_vi:    "Đã Hoàn",
    label_en:    "Refunded",
    description: "Đã hoàn tiền cho khách",
    sort_order:  8,
    is_active:   true,
  },
  {
    code:        ORDER_LIST_STATUS.CANCELLED,
    label_vi:    "Đã Hủy",
    label_en:    "Cancelled",
    description: "Đơn hàng đã bị hủy",
    sort_order:  9,
    is_active:   true,
  },
];

/** Tra cứu nhanh metadata theo code */
export const ORDER_STATUS_MAP: Record<string, StatusDef> = Object.fromEntries(
  ORDER_STATUS_DEFS.map((s) => [s.code, s])
);
