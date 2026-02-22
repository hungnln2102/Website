import { Loader2 } from "lucide-react";

interface MCoinPaymentConfirmProps {
  paymentState: "ready" | "processing";
  total: number;
  error?: string;
  handleConfirmBalance: () => void;
  onBack: () => void;
  formatCurrency: (amount: number) => string;
}

export function MCoinPaymentConfirm({
  paymentState,
  total,
  error,
  handleConfirmBalance,
  onBack,
  formatCurrency,
}: MCoinPaymentConfirmProps) {
  if (paymentState === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600 dark:text-slate-400">
          Đang xử lý thanh toán...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
        Thanh toán bằng MCoin
      </h3>
      <p className="mb-4 text-gray-600 dark:text-slate-400">
        Tổng thanh toán: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
      </p>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="button"
        onClick={handleConfirmBalance}
        className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
      >
        Xác nhận thanh toán
      </button>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
      >
        Quay lại
      </button>
    </div>
  );
}
