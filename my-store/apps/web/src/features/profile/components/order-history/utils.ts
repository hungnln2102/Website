import type { UserOrder } from "@/lib/api";
import { ORDER_CUSTOMER_STATUS, ORDER_LIST_STATUS, ORDER_STATUS_MAP } from "@/lib/constants/status";

export function getOrderTotal(order: UserOrder): number {
  return order.items.reduce((s, i) => s + (i.price || 0) * (i.quantity ?? 1), 0);
}

export function calculateExpirationDate(purchaseDate: string, duration?: string): string | null {
  if (!duration) return null;
  const d = new Date(purchaseDate);
  const amount = parseInt(duration, 10);
  if (isNaN(amount)) return null;
  if (duration.endsWith("m")) {
    d.setMonth(d.getMonth() + amount);
  } else if (duration.endsWith("y")) {
    d.setFullYear(d.getFullYear() + amount);
  } else if (duration.endsWith("d")) {
    d.setDate(d.getDate() + amount);
  } else {
    return null;
  }
  return d.toISOString();
}

export type OrderStatusInfo = { label: string; cls: string };

const DIRECT_STATUS_CODES = new Set([
  ORDER_LIST_STATUS.UNPAID,
  ORDER_LIST_STATUS.PROCESSING,
  ORDER_LIST_STATUS.NEEDS_RENEWAL,
  ORDER_LIST_STATUS.EXPIRED,
  ORDER_LIST_STATUS.PENDING_REFUND,
  ORDER_LIST_STATUS.REFUNDED,
  ORDER_LIST_STATUS.CANCELLED,
  ORDER_CUSTOMER_STATUS.CREATING,
  ORDER_CUSTOMER_STATUS.CREATING_LEGACY,
]);

export function getDynamicStatus(order: UserOrder): OrderStatusInfo {
  // Statuses that are rendered directly from the DB value without expiry computation
  if (DIRECT_STATUS_CODES.has(order.status as string)) {
    const def = ORDER_STATUS_MAP[order.status];
    if (def) return { label: def.label_vi, cls: def.cls };
  }

  // For PAID status, compute client-side expiration as a fallback in case
  // the background job hasn't updated order_list.status yet
  const duration = order.items[0]?.duration;
  if (!duration) {
    return { label: "Đã Thanh Toán", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" };
  }

  const expDateStr = order.items[0]?.expired_at || calculateExpirationDate(order.order_date, duration);
  if (!expDateStr) {
    return { label: "Đã Thanh Toán", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" };
  }

  const expDate = new Date(expDateStr);
  const now = new Date();
  const remaining_days = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (remaining_days <= 0) {
    return { label: "Hết Hạn", cls: "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30" };
  }
  if (remaining_days <= 4) {
    return { label: "Cần Gia Hạn", cls: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30" };
  }
  return { label: "Đã Thanh Toán", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" };
}

export function formatDateTime(dateString: string | Date): string {
  const d = new Date(dateString);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatCurrency(v: number): string {
  return `${v.toLocaleString("vi-VN")}đ`;
}

export function getCountdownLabel(expDate: Date | null, now: Date): string {
  if (!expDate) return "—";
  const diff = expDate.getTime() - now.getTime();
  if (diff <= 0) return "Đã hết hạn";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
  if (minutes > 0) return `Còn ${minutes} phút`;
  return "Còn dưới 1 phút";
}

export function formatCompoundProductName(item: {
  display_name?: string | null;
  name?: string;
  id_product?: string | null;
  variant_name?: string | null;
  duration?: string;
}): string {
  const rawId = String(item.id_product ?? "");
  const baseName = item.display_name || item.name || (rawId ? rawId.split("--")[0] : null) || rawId || "—";
  let duration = item.duration;
  if (!duration && rawId.includes("--")) {
    duration = rawId.split("--").pop() ?? undefined;
  }
  const parts: string[] = [];
  if (item.variant_name && item.variant_name !== baseName) parts.push(item.variant_name);
  if (duration) {
    let formattedDuration = duration;
    const amount = parseInt(duration, 10);
    if (!isNaN(amount)) {
      if (duration.endsWith("m")) formattedDuration = `${amount} Tháng`;
      else if (duration.endsWith("y")) formattedDuration = `${amount} Năm`;
      else if (duration.endsWith("d")) formattedDuration = `${amount} Ngày`;
    }
    parts.push(`(${formattedDuration})`);
  }
  return parts.length > 0 ? `${baseName} ${parts.join(" ")}` : baseName;
}

export type OrderFilters = {
  orderId: string;
  productName: string;
  dateFrom: string;
  dateTo: string;
};

export function filterOrders(orders: UserOrder[], applied: OrderFilters): UserOrder[] {
  return orders.filter((order) => {
    if (applied.orderId && !(order.id_order ?? "").toLowerCase().includes(applied.orderId.toLowerCase())) return false;
    if (applied.productName) {
      const q = applied.productName.toLowerCase().trim();
      const hit = order.items.some((item) => formatCompoundProductName(item).toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (applied.dateFrom) {
      const from = new Date(applied.dateFrom);
      if (new Date(order.order_date) < from) return false;
    }
    if (applied.dateTo) {
      const to = new Date(applied.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(order.order_date) > to) return false;
    }
    return true;
  });
}
