import { CheckCircle, XCircle, AlertTriangle, RefreshCcw, Loader2 } from "lucide-react";

interface PaymentOutcomeProps {
  paymentState: "success" | "failed" | "expired" | "loading";
  orderId?: string;
  error?: string;
  redirectSeconds?: number;
  paymentMethod?: string;
  onInitializePayment: () => void;
  onBack: () => void;
}

export function PaymentOutcome({
  paymentState,
  orderId,
  error,
  redirectSeconds,
  paymentMethod,
  onInitializePayment,
  onBack,
}: PaymentOutcomeProps) {
  if (paymentState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600 dark:text-slate-400">
          Đang tạo giao dịch thanh toán...
        </p>
      </div>
    );
  }

  if (paymentState === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 rounded-full bg-green-100 p-6 dark:bg-green-900/30">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Thanh toán thành công!
        </h3>
        {orderId && (
          <p className="mb-2 text-gray-600 dark:text-slate-400">
            Mã đơn hàng: <span className="font-mono font-semibold">{orderId}</span>
          </p>
        )}
        <p className="text-gray-500 dark:text-slate-500">
          Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.
        </p>
        
        {paymentMethod === "balance" && redirectSeconds !== undefined && (
          <>
            <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
              Tự động quay về trang chủ sau {redirectSeconds}s.
            </p>
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Về trang chủ ngay
            </button>
          </>
        )}
      </div>
    );
  }

  if (paymentState === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 rounded-full bg-red-100 p-6 dark:bg-red-900/30">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Thanh toán thất bại
        </h3>
        <p className="mb-6 text-gray-600 dark:text-slate-400">
          {error || "Đã xảy ra lỗi trong quá trình thanh toán."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onInitializePayment}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <RefreshCcw className="h-5 w-5" />
            Thử lại
          </button>
          <button
            onClick={onBack}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (paymentState === "expired") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 rounded-full bg-amber-100 p-6 dark:bg-amber-900/30">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Giao dịch hết hạn
        </h3>
        <p className="mb-6 text-gray-600 dark:text-slate-400">
          Thời gian thanh toán đã hết. Vui lòng tạo giao dịch mới.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onInitializePayment}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <RefreshCcw className="h-5 w-5" />
            Tạo giao dịch mới
          </button>
          <button
            onClick={onBack}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return null;
}
