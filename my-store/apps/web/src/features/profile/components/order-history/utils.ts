import type { UserOrder } from "@/lib/api";

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

export function getDynamicStatus(order: UserOrder): OrderStatusInfo {
  if (order.status === "Đang Tạo Đơn" || order.status === "dang_tao_don") {
    return { label: "Đang Tạo Đơn", cls: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30" };
  }
  if (order.status === "cancelled") {
    return { label: "Đã Hủy", cls: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700" };
  }
  if (order.status === "refunded") {
    return { label: "Hoàn Tiền", cls: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30" };
  }
  if (order.status === "pending") {
    return { label: "Đang Xử Lý", cls: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" };
  }

  const duration = order.items[0]?.duration;
  if (!duration) {
    return { label: "Đã Thanh Toán", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" };
  }

  const expDateStr = order.items[0]?.order_expired || calculateExpirationDate(order.order_date, duration);
  if (!expDateStr) {
    return { label: "Đã Thanh Toán", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" };
  }

  const expDate = new Date(expDateStr);
  const now = new Date();
  const diffTime = expDate.getTime() - now.getTime();
  const remaining_days = diffTime / (1000 * 60 * 60 * 24);

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
  const rawId = item.id_product ?? "";
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
  amountFrom: string;
  amountTo: string;
  dateFrom: string;
  dateTo: string;
};

export function filterOrders(orders: UserOrder[], applied: OrderFilters, getOrderTotalFn: (o: UserOrder) => number): UserOrder[] {
  return orders.filter((order) => {
    if (applied.orderId && !(order.id_order ?? "").toLowerCase().includes(applied.orderId.toLowerCase())) return false;
    const total = getOrderTotalFn(order);
    if (applied.amountFrom && total < Number(applied.amountFrom)) return false;
    if (applied.amountTo && total > Number(applied.amountTo)) return false;
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
