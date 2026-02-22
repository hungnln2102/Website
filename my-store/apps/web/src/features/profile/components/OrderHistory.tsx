import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  X,
  Eye,
  Calendar,
  Package,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ShoppingBag
} from "lucide-react";
import { fetchUserOrders, type UserOrder } from "@/lib/api";

export function OrderHistory() {
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await fetchUserOrders();
      if (!res.success || !res.data) return [];
      return res.data;
    },
  });
  const allOrders: UserOrder[] = ordersData ?? [];

  // --- Filters ---
  const [filterOrderId, setFilterOrderId] = useState("");
  const [filterAmountFrom, setFilterAmountFrom] = useState("");
  const [filterAmountTo, setFilterAmountTo] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    orderId: "",
    amountFrom: "",
    amountTo: "",
    dateFrom: "",
    dateTo: "",
  });

  // --- Pagination ---
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Detail modal ---
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getOrderTotal = (order: UserOrder) =>
    order.items.reduce((s, i) => s + (i.price || 0) * (i.quantity ?? 1), 0);

  const calculateExpirationDate = (purchaseDate: string, duration?: string) => {
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
  };

  const getDynamicStatus = (order: UserOrder) => {
    if (order.status === "cancelled") {
      return { label: "Đã Hủy", cls: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700" };
    }
    if (order.status === "refunded") {
      return { label: "Hoàn Tiền", cls: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30" };
    }
    if (order.status === "pending") {
      return { label: "Đang Xử Lý", cls: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" };
    }

    let duration = order.items[0]?.duration;
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
    } else if (remaining_days <= 4) {
      return { label: "Cần Gia Hạn", cls: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30" };
    } else {
      return { label: "Đã Thanh Toán", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" };
    }
  };

  const formatDateTime = (dateString: string | Date) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (v: number) => `${v.toLocaleString("vi-VN")}đ`;

  const getDurationDays = (duration?: string) => {
    if (!duration) return null;
    const amount = parseInt(duration, 10);
    if (isNaN(amount)) return null;
    if (duration.endsWith("m")) return amount * 30;
    if (duration.endsWith("y")) return amount * 365;
    if (duration.endsWith("d")) return amount;
    return null;
  };

  const formatCompoundProductName = (item: any) => {
    // Determine the base product name (e.g., "Netflix Premium")
    const baseName = item.display_name || item.name || item.id_product.split("--")[0] || item.id_product;
    
    // Extract duration from id_product pattern like "--1m" if item.duration is not explicitly set
    let duration = item.duration;
    if (!duration && item.id_product && item.id_product.includes("--")) {
       duration = item.id_product.split("--").pop();
    }

    let parts = [];
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
  };

  // Apply filters
  const handleFilter = () => {
    setAppliedFilters({
      orderId: filterOrderId.trim(),
      amountFrom: filterAmountFrom.trim(),
      amountTo: filterAmountTo.trim(),
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterOrderId("");
    setFilterAmountFrom("");
    setFilterAmountTo("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setAppliedFilters({ orderId: "", amountFrom: "", amountTo: "", dateFrom: "", dateTo: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== "");

  // Filtered orders
  const filteredOrders = allOrders.filter((order) => {
    if (appliedFilters.orderId && !order.id_order.toLowerCase().includes(appliedFilters.orderId.toLowerCase())) return false;
    const total = getOrderTotal(order);
    if (appliedFilters.amountFrom && total < Number(appliedFilters.amountFrom)) return false;
    if (appliedFilters.amountTo && total > Number(appliedFilters.amountTo)) return false;
    if (appliedFilters.dateFrom) {
      const from = new Date(appliedFilters.dateFrom);
      if (new Date(order.order_date) < from) return false;
    }
    if (appliedFilters.dateTo) {
      const to = new Date(appliedFilters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(order.order_date) > to) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử đơn hàng</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Hiển thị thông tin các sản phẩm bạn đã mua tại Mavryk Premium Store
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Mã đơn hàng */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Mã đơn hàng</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={filterOrderId}
                onChange={(e) => setFilterOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                placeholder="Nhập mã đơn..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
              />
            </div>
          </div>

          {/* Số tiền từ */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Số tiền từ</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterAmountFrom}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) setFilterAmountFrom(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
            />
          </div>

          {/* Số tiền đến */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Số tiền đến</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterAmountTo}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) setFilterAmountTo(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder="10,000,000"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
            />
          </div>

          {/* Từ ngày */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Từ ngày</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:[color-scheme:dark]"
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">Đến ngày</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:[color-scheme:dark]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleFilter}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Filter className="h-4 w-4" />
              Lọc
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                title="Xóa bộ lọc"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results summary */}
      {!isLoading && !error && (
        <div className="mb-3 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
          <span>
            {hasActiveFilters
              ? `Tìm thấy ${filteredOrders.length} đơn hàng`
              : `Tổng cộng ${allOrders.length} đơn hàng`}
          </span>
          {filteredOrders.length > ITEMS_PER_PAGE && (
            <span>
              Trang {currentPage}/{totalPages}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
          <p className="text-gray-500 dark:text-slate-400">Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-red-500 dark:text-red-400">Không thể tải đơn hàng. Vui lòng thử lại.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-slate-600" />
          <p className="font-medium text-gray-500 dark:text-slate-400">
            {hasActiveFilters ? "Không tìm thấy đơn hàng phù hợp" : "Bạn chưa có đơn hàng nào"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden rounded-xl border border-gray-200 dark:border-slate-700 md:block overflow-hidden">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80">
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap">Mã đơn hàng</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300">Sản phẩm</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300 min-w-[150px]">Thông tin sản phẩm</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap">Ngày mua</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap">Ngày hết hạn</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap">Tổng tiền</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap">Trạng thái</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-gray-600 dark:text-slate-300 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {paginatedOrders.map((order) => {
                  const total = getOrderTotal(order);
                  const status = getDynamicStatus(order);
                  const productNames = order.items.map((i) => formatCompoundProductName(i)).join(", ");
                  const productNotes = order.items.map((i) => i.information_order || i.note).filter(Boolean).join(" | ");
                  const dbExpDateStr = order.items[0]?.order_expired;
                  const expDate = dbExpDateStr ? new Date(dbExpDateStr) : null;
                  return (
                    <tr
                      key={order.id_order}
                      className="bg-white transition-colors hover:bg-blue-50/30 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">{order.id_order}</span>
                          <button
                            onClick={() => copyOrderId(order.id_order)}
                            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
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
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700 dark:text-slate-300 break-words" title={productNames}>
                          {productNames}
                        </p>
                        {order.items.length > 1 && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {order.items.length} sản phẩm
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-600 dark:text-slate-400 break-all" title={productNotes}>
                          {productNotes || "—"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-gray-600 dark:text-slate-400">
                        {formatDateTime(order.order_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-gray-600 dark:text-slate-400">
                        {expDate ? formatDateTime(expDate.toISOString()) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {paginatedOrders.map((order) => {
              const total = getOrderTotal(order);
              const status = getDynamicStatus(order);
              return (
                <div
                  key={order.id_order}
                  onClick={() => setSelectedOrder(order)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order.id_order}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(order.order_date)}
                  </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400 dark:text-slate-500">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
                        currentPage === p
                          ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed inset-x-4 top-1/2 z-[101] max-h-[85vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 dark:border-slate-700 dark:bg-slate-900">
            {/* Modal header */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết đơn hàng</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order info */}
            <div className="mb-5 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Mã đơn hàng</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedOrder.id_order}</span>
                  <button
                    onClick={() => copyOrderId(selectedOrder.id_order)}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {copiedId === selectedOrder.id_order ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Thời gian</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateTime(selectedOrder.order_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-slate-400">Trạng thái</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getDynamicStatus(selectedOrder).cls}`}>
                  {getDynamicStatus(selectedOrder).label}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                Chi tiết sản phẩm ({selectedOrder.items.length})
              </h4>
              {selectedOrder.items.map((item, idx) => {
                const compoundName = formatCompoundProductName(item);
                const expDate = calculateExpirationDate(selectedOrder.order_date, item.duration);
                const durationDays = getDurationDays(item.duration);
                return (
                  <div key={idx} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                    <div className="mb-3 border-b border-gray-100 pb-3 dark:border-slate-700 w-full flex items-start justify-between">
                      <div className="min-w-0 pr-4">
                         <h5 className="font-semibold text-gray-900 dark:text-white leading-tight">
                            {compoundName}
                         </h5>
                         {item.quantity != null && item.quantity > 1 && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                               Số lượng: {item.quantity} × {formatCurrency(item.unitPrice || item.price)}
                            </p>
                         )}
                      </div>
                      <span className="shrink-0 font-bold text-gray-900 dark:text-white">
                         {formatCurrency((item.price || 0) * (item.quantity ?? 1))}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                       <div>
                          <span className="block text-xs font-medium text-gray-500 dark:text-slate-400">Ngày mua</span>
                          <span className="font-medium text-gray-800 dark:text-slate-200">{formatDateTime(selectedOrder.order_date)}</span>
                       </div>
                       
                       {durationDays != null && (
                         <div>
                            <span className="block text-xs font-medium text-gray-500 dark:text-slate-400">Số ngày</span>
                            <span className="font-medium text-gray-800 dark:text-slate-200">{durationDays} ngày</span>
                         </div>
                       )}

                       {expDate && (
                         <div>
                            <span className="block text-xs font-medium text-gray-500 dark:text-slate-400">Ngày hết hạn</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">{formatDateTime(expDate)}</span>
                         </div>
                       )}
                    </div>
                    
                    {item.note && (
                       <div className="mt-4 rounded-lg bg-orange-50/80 p-3 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
                          <span className="mb-1 block text-xs font-semibold text-orange-800 dark:text-orange-400">Ghi chú</span>
                          <p className="text-sm text-orange-900 dark:text-orange-200 whitespace-pre-wrap leading-relaxed">{item.note}</p>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
              <span className="font-semibold text-gray-700 dark:text-slate-300">Tổng cộng</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(getOrderTotal(selectedOrder))}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
