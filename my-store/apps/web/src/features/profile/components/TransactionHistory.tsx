import { useQuery } from "@tanstack/react-query";
import { Receipt, X } from "lucide-react";
import { fetchUserTransactions } from "@/lib/api";
import type { WalletTransactionDto } from "@/lib/api";

function formatDateTime(dateString: string | Date): string {
  const d = new Date(dateString);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${h}:${m}`;
}

function formatMcoin(v: number): string {
  return `${v.toLocaleString("vi-VN")} Mcoin`;
}

function formatVnd(v: number): string {
  return `${v.toLocaleString("vi-VN")}đ`;
}

/** Giao dịch dùng Mcoin (Ví Mcoin) → hiển thị Mcoin; còn lại (VD chuyển khoản) → VND */
function isMcoinTransaction(t: WalletTransactionDto): boolean {
  const m = (t.method ?? "").toLowerCase();
  return (
    m === "balance" ||
    m === "mcoin" ||
    m === "topup" ||
    m === "refund" ||
    m === "adjust"
  );
}

function formatAmount(t: WalletTransactionDto): string {
  const sign = t.direction === "DEBIT" ? "-" : "+";
  const value = isMcoinTransaction(t)
    ? formatMcoin(t.amount)
    : formatVnd(t.amount);
  return `${sign}${value}`;
}

function getMethodLabel(method: string | null): string {
  if (!method) return "—";
  const map: Record<string, string> = {
    balance: "Ví Mcoin",
    Mcoin: "Ví Mcoin",
    mcoin: "Ví Mcoin",
    topup: "Nạp tiền",
    bank_transfer: "Chuyển khoản",
    BANK_TRANSFER: "Chuyển khoản",
    adjust: "Điều chỉnh",
    refund: "Hoàn tiền",
  };
  return map[method] ?? method;
}

/** Trạng thái = type từ wallet_transactions (PURCHASE, TOPUP, REFUND, ADJUST) */
function getTypeLabel(type: string | null): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    PURCHASE: "Thanh toán",
    TOPUP: "Nạp tiền",
    REFUND: "Hoàn tiền",
    ADJUST: "Điều chỉnh",
  };
  return map[type] ?? type;
}

function getTypeCls(type: string | null): string {
  if (type === "TOPUP" || type === "REFUND") return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30";
  if (type === "PURCHASE") return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30";
  if (type === "ADJUST") return "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-600/30 dark:text-slate-400 dark:border-slate-500/30";
  return "bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400";
}

export function TransactionHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-transactions"],
    queryFn: async () => {
      const res = await fetchUserTransactions();
      if (!res.success || !res.data) return [];
      return res.data;
    },
  });
  const transactions: WalletTransactionDto[] = data ?? [];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử giao dịch</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Các giao dịch Mcoin của bạn: nạp tiền, thanh toán đơn hàng, hoàn tiền
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
          <p className="text-gray-500 dark:text-slate-400">Đang tải giao dịch...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-red-500 dark:text-red-400">Không thể tải lịch sử giao dịch. Vui lòng thử lại.</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center">
          <Receipt className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có giao dịch nào</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/30">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80">
                  <th className="px-3 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Mã giao dịch</th>
                  <th className="px-3 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Số dư</th>
                  <th className="px-3 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Số tiền</th>
                  <th className="px-3 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Thời gian thanh toán</th>
                  <th className="px-3 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Phương thức</th>
                  <th className="px-3 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Khuyến mãi</th>
                  <th className="px-3 py-3.5 font-semibold text-gray-600 dark:text-slate-300">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="bg-white transition-colors hover:bg-blue-50/30 dark:bg-slate-900/50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-3 py-3.5 font-mono text-xs text-gray-900 dark:text-white">
                      {t.id}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {isMcoinTransaction(t) ? formatMcoin(t.balanceAfter) : formatVnd(t.balanceAfter)}
                    </td>
                    <td
                      className={`px-3 py-3.5 font-semibold whitespace-nowrap ${
                        t.direction === "DEBIT" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatAmount(t)}
                    </td>
                    <td className="px-3 py-3.5 text-gray-600 dark:text-slate-400">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="px-3 py-3.5 text-gray-600 dark:text-slate-400">
                      {getMethodLabel(t.method)}
                    </td>
                    <td className="px-3 py-3.5 text-gray-600 dark:text-slate-400">
                      {t.promoCode ?? "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getTypeCls(t.type)}`}>
                        {getTypeLabel(t.type)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {t.id}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getTypeCls(t.type)}`}>
                    {getTypeLabel(t.type)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Số dư sau</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {isMcoinTransaction(t) ? formatMcoin(t.balanceAfter) : formatVnd(t.balanceAfter)}
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">{isMcoinTransaction(t) ? "Mcoin" : "Số tiền"}</span>
                  <span
                    className={`font-semibold text-right ${
                      t.direction === "DEBIT" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatAmount(t)}
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">Thời gian thanh toán</span>
                  <span className="text-gray-700 dark:text-slate-300 text-right">{formatDateTime(t.createdAt)}</span>
                  <span className="text-gray-500 dark:text-slate-400">Phương thức</span>
                  <span className="text-gray-700 dark:text-slate-300 text-right">{getMethodLabel(t.method)}</span>
                  {t.promoCode && (
                    <>
                      <span className="text-gray-500 dark:text-slate-400">Khuyến mãi</span>
                      <span className="text-gray-700 dark:text-slate-300 text-right">{t.promoCode}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
