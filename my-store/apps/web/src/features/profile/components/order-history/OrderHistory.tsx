import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ShoppingBag } from "lucide-react";
import { fetchUserOrders, type UserOrder } from "@/lib/api";
import { ITEMS_PER_PAGE } from "./constants";
import {
  getOrderTotal,
  filterOrders,
  type OrderFilters,
} from "./utils";
import { useOrderCountdown } from "./useOrderCountdown";
import { OrderHistoryFilters } from "./OrderHistoryFilters";
import { OrderHistoryTable } from "./OrderHistoryTable";
import { OrderHistoryCards } from "./OrderHistoryCards";
import { OrderHistoryPagination } from "./OrderHistoryPagination";
import { OrderDetailModal } from "./OrderDetailModal";

const emptyFilters: OrderFilters = {
  orderId: "",
  amountFrom: "",
  amountTo: "",
  dateFrom: "",
  dateTo: "",
};

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
  const now = useOrderCountdown();

  const [filterOrderId, setFilterOrderId] = useState("");
  const [filterAmountFrom, setFilterAmountFrom] = useState("");
  const [filterAmountTo, setFilterAmountTo] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== "");
  const filteredOrders = filterOrders(allOrders, appliedFilters, getOrderTotal);
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
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử đơn hàng</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Hiển thị thông tin các sản phẩm bạn đã mua tại Mavryk Premium Store
        </p>
      </div>

      <OrderHistoryFilters
        filterOrderId={filterOrderId}
        setFilterOrderId={setFilterOrderId}
        filterAmountFrom={filterAmountFrom}
        setFilterAmountFrom={setFilterAmountFrom}
        filterAmountTo={filterAmountTo}
        setFilterAmountTo={setFilterAmountTo}
        filterDateFrom={filterDateFrom}
        setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo}
        setFilterDateTo={setFilterDateTo}
        onFilter={handleFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {!isLoading && !error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
          <span className="font-medium text-gray-700 dark:text-slate-300">
            {hasActiveFilters ? `Tìm thấy ${filteredOrders.length} đơn hàng` : `Tổng cộng ${allOrders.length} đơn hàng`}
          </span>
          {filteredOrders.length > ITEMS_PER_PAGE && (
            <span className="text-gray-500 dark:text-slate-400">
              Trang {currentPage}/{totalPages}
            </span>
          )}
        </div>
      )}

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
          <OrderHistoryTable
            orders={paginatedOrders}
            now={now}
            copiedId={copiedId}
            onCopyId={copyOrderId}
            onSelectOrder={setSelectedOrder}
          />
          <OrderHistoryCards orders={paginatedOrders} now={now} onSelectOrder={setSelectedOrder} />
          <OrderHistoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          now={now}
          copiedId={copiedId}
          onCopyId={copyOrderId}
        />
      )}
    </div>
  );
}
