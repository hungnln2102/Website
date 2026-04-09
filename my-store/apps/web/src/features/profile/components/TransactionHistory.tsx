import { useMemo } from "react";
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

function formatBalance(balanceAfter: number | undefined): string {
  return formatMcoin(balanceAfter ?? 0);
}

function formatAmountSigned(t: WalletTransactionDto): string {
  const sign = t.direction === "DEBIT" ? "-" : "+";
  const value = isMcoinTransaction(t) ? formatMcoin(t.amount) : formatVnd(t.amount);
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

function getTypeLabel(type: string | null): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    PURCHASE: "Thanh toán đơn",
    TOPUP: "Nạp Mcoin",
    REFUND: "Hoàn Mcoin",
    ADJUST: "Điều chỉnh",
  };
  return map[type] ?? type;
}

function normType(t: WalletTransactionDto): string {
  return (t.type || "").toUpperCase();
}

function isOrderPayment(t: WalletTransactionDto): boolean {
  return normType(t) === "PURCHASE";
}

function isTopupSection(t: WalletTransactionDto): boolean {
  return (t.direction || "").toUpperCase() === "CREDIT";
}

const tableShell =
  "overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/90 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/35 dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]";

const thClass =
  "px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600 bg-gray-100 dark:text-slate-400 dark:bg-slate-800/90";

const tdClass = "px-3 py-3 text-sm text-gray-800 dark:text-slate-200";

const badgeTopup =
  "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 dark:text-emerald-300";
const badgeSpend =
  "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-500/15 text-rose-600 border border-rose-500/25 dark:text-rose-300";
const badgeOrder =
  "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-600 border border-blue-500/25 dark:text-blue-300";

function typeBadgeClass(t: WalletTransactionDto): string {
  if (isOrderPayment(t)) return badgeOrder;
  if (isTopupSection(t)) return badgeTopup;
  return badgeSpend;
}

function amountClassName(t: WalletTransactionDto): string {
  const credit = (t.direction || "").toUpperCase() === "CREDIT";
  return credit
    ? `${tdClass} font-semibold text-emerald-500 dark:text-emerald-400`
    : `${tdClass} font-semibold text-rose-500 dark:text-rose-400`;
}

export function TransactionHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-transactions", 100],
    queryFn: async () => {
      const res = await fetchUserTransactions({ limit: 100 });
      if (!res.success) {
        throw new Error(res.error || "Không thể tải lịch sử giao dịch");
      }
      return res.data ?? [];
    },
  });

  const sortedRows = useMemo(() => {
    const list = data ?? [];
    return [...list].sort((a, b) => {
      const tb = new Date(b.createdAt).getTime();
      const ta = new Date(a.createdAt).getTime();
      return tb - ta;
    });
  }, [data]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử giao dịch</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Nạp Mcoin, tiêu Mcoin và thanh toán đơn hàng bằng ví — gom trong một bảng, mới nhất lên trên.
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
          <p className="text-red-500 dark:text-red-400">
            {error instanceof Error ? error.message : "Không thể tải lịch sử giao dịch. Vui lòng thử lại."}
          </p>
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/90 py-12 text-center dark:border-slate-700/80 dark:bg-slate-900/35">
          <Receipt className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-slate-600" />
          <p className="text-gray-500 dark:text-slate-400">Bạn chưa có giao dịch nào</p>
        </div>
      ) : (
        <section className={tableShell} aria-labelledby="tx-all-heading">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-100/90 to-transparent px-4 py-4 dark:border-slate-700/70 dark:from-slate-800/50 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="tx-all-heading" className="text-base font-bold text-gray-900 dark:text-white">
                Tất cả giao dịch
              </h3>
              <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-slate-700/80 dark:text-slate-300">
                {sortedRows.length} giao dịch
              </span>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700/60">
                  <th className={thClass}>Thời gian</th>
                  <th className={thClass}>Mã giao dịch</th>
                  <th className={thClass}>Mã đơn</th>
                  <th className={thClass}>Số tiền</th>
                  <th className={thClass}>Số dư sau</th>
                  <th className={thClass}>Loại</th>
                  <th className={thClass}>Phương thức</th>
                  <th className={thClass}>Khuyến mãi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/40">
                {sortedRows.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className={`${tdClass} whitespace-nowrap text-gray-500 dark:text-slate-400`}>
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className={`${tdClass} font-mono text-xs text-gray-900 dark:text-white`}>{t.id}</td>
                    <td className={`${tdClass} font-mono text-xs text-amber-800 dark:text-amber-200/90`}>
                      {t.orderId ?? "—"}
                    </td>
                    <td className={amountClassName(t)}>{formatAmountSigned(t)}</td>
                    <td className={`${tdClass} whitespace-nowrap font-medium`}>{formatBalance(t.balanceAfter)}</td>
                    <td className={tdClass}>
                      <span className={typeBadgeClass(t)}>{getTypeLabel(t.type)}</span>
                    </td>
                    <td className={`${tdClass} text-gray-600 dark:text-slate-400`}>{getMethodLabel(t.method)}</td>
                    <td className={`${tdClass} text-gray-600 dark:text-slate-400`}>{t.promoCode ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {sortedRows.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800/40"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">{t.id}</span>
                  <span className={typeBadgeClass(t)}>{getTypeLabel(t.type)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <span className="text-gray-500 dark:text-slate-500">Thời gian</span>
                  <span className="text-right text-gray-800 dark:text-slate-300">{formatDateTime(t.createdAt)}</span>
                  <span className="text-gray-500 dark:text-slate-500">Mã đơn</span>
                  <span className="text-right font-mono text-amber-800 dark:text-amber-200/90">{t.orderId ?? "—"}</span>
                  <span className="text-gray-500 dark:text-slate-500">Số tiền</span>
                  <span
                    className={`text-right font-semibold ${
                      (t.direction || "").toUpperCase() === "CREDIT"
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {formatAmountSigned(t)}
                  </span>
                  <span className="text-gray-500 dark:text-slate-500">Số dư sau</span>
                  <span className="text-right font-medium text-gray-900 dark:text-slate-200">{formatBalance(t.balanceAfter)}</span>
                  <span className="text-gray-500 dark:text-slate-500">Phương thức</span>
                  <span className="text-right text-gray-600 dark:text-slate-400">{getMethodLabel(t.method)}</span>
                  <span className="text-gray-500 dark:text-slate-500">Khuyến mãi</span>
                  <span className="text-right text-gray-600 dark:text-slate-400">{t.promoCode ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
