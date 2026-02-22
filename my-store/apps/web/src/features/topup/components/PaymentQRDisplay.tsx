import { Check, Copy, AlertCircle, Clock } from "lucide-react";

interface PaymentQRDisplayProps {
  bankConfig: {
    bankName: string;
    accountNo: string;
    accountName: string;
  };
  generateQRUrl: () => string;
  transactionCode: string;
  getSelectedAmount: () => number;
  formatCurrency: (amount: number) => string;
  handleCopy: (text: string, field: string) => void;
  copiedField: string | null;
  setShowCancelConfirm: (show: boolean) => void;
  // Test Button Props
  isTestLoading?: boolean;
  handleTestTopup?: () => void;
}

export function PaymentQRDisplay({
  bankConfig,
  generateQRUrl,
  transactionCode,
  getSelectedAmount,
  formatCurrency,
  handleCopy,
  copiedField,
  setShowCancelConfirm,
  isTestLoading,
  handleTestTopup,
}: PaymentQRDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Two Column Layout: Bank Info (Left) + QR Code (Right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bank Info - Left */}
        <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
          <h4 className="font-semibold text-white">Thông tin chuyển khoản</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
              <div>
                <p className="text-xs text-slate-500">Ngân hàng</p>
                <p className="font-medium text-white">{bankConfig.bankName}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
              <div>
                <p className="text-xs text-slate-500">Số tài khoản</p>
                <p className="font-medium text-white">{bankConfig.accountNo}</p>
              </div>
              <button
                onClick={() => handleCopy(bankConfig.accountNo, "account")}
                className="rounded-lg bg-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-600"
              >
                {copiedField === "account" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
              <div>
                <p className="text-xs text-slate-500">Chủ tài khoản</p>
                <p className="font-medium text-white">{bankConfig.accountName}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
              <div>
                <p className="text-xs text-slate-500">Số tiền</p>
                <p className="font-medium text-emerald-400">
                  {formatCurrency(getSelectedAmount())}
                </p>
              </div>
              <button
                onClick={() => handleCopy(getSelectedAmount().toString(), "amount")}
                className="rounded-lg bg-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-600"
              >
                {copiedField === "amount" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3">
              <div>
                <p className="text-xs text-slate-500">Nội dung chuyển khoản</p>
                <p className="font-medium text-amber-400">{transactionCode}</p>
              </div>
              <button
                onClick={() => handleCopy(transactionCode, "code")}
                className="rounded-lg bg-slate-700 p-2 text-slate-300 transition-colors hover:bg-slate-600"
              >
                {copiedField === "code" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-200">
              <strong>Quan trọng:</strong> Vui lòng nhập đúng nội dung chuyển
              khoản để hệ thống tự động cộng tiền vào tài khoản của bạn.
            </p>
          </div>
        </div>

        {/* QR Code - Right */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Quét mã QR để thanh toán
          </h3>

          <div className="relative inline-block rounded-2xl bg-white p-4">
            <img
              src={generateQRUrl()}
              alt="QR Code"
              className="h-52 w-52"
            />
            {/* Scan line animation */}
            <div className="pointer-events-none absolute inset-4 overflow-hidden rounded-lg">
              <div className="animate-scan absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-75" />
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Sử dụng app ngân hàng để quét mã
          </p>
        </div>
      </div>

      {/* Waiting Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
          <Clock className="h-5 w-5 animate-pulse text-blue-400" />
          <span className="text-slate-300">
            Đang chờ thanh toán... Số dư sẽ được cập nhật tự động
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Cancel Button */}
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex-1 rounded-xl border border-slate-600 bg-slate-700 py-3 font-medium text-slate-300 transition-all hover:bg-slate-600"
          >
            Hủy
          </button>

          {/* Test Button (Development) - Comment out for production deploy */}
          {/* {handleTestTopup && (
            <button
              onClick={handleTestTopup}
              disabled={isTestLoading}
              className="flex-1 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 py-3 font-medium text-amber-400 transition-all hover:bg-amber-500/20 disabled:opacity-50"
            >
              {isTestLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                "🧪 Test nạp tiền"
              )}
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
