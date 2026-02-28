import { CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface PaymentStatusPanelProps {
  topupResult: {
    success: boolean;
    newBalance: number;
    totalAmount: number;
  } | null;
  countdown: number;
  formatCurrency: (amount: number) => string;
}

export function PaymentStatusPanel({
  topupResult,
  countdown,
  formatCurrency,
}: PaymentStatusPanelProps) {
  if (!topupResult) return null;

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h3 className="mt-4 text-2xl font-bold text-white">
          Nạp tiền thành công!
        </h3>
        <p className="mt-3 text-slate-300">
          Đã cộng{" "}
          <span className="font-semibold text-emerald-400">
            {formatCurrency(topupResult.totalAmount)}
          </span>{" "}
          vào tài khoản
        </p>
        <p className="mt-2 text-slate-400">
          Số dư mới:{" "}
          <span className="font-semibold text-white">
            {formatCurrency(topupResult.newBalance)}
          </span>
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Tự động chuyển về trang chủ sau{" "}
          <span className="font-semibold text-blue-400">{countdown}s</span>
        </p>
        <button
          onClick={() => {
            window.history.pushState({}, "", ROUTES.home);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          className="mt-6 rounded-xl bg-emerald-500 px-8 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
