import { Check, Copy, Shield, Clock } from "lucide-react";

interface BankTransferInfoProps {
  bankConfig: {
    bankName: string;
    bankLogo: string;
    accountNo: string;
    accountName: string;
  };
  total: number;
  transferContent: string;
  qrUrl: string;
  timeLeft: number;
  formatCurrency: (amount: number) => string;
  formatTime: (seconds: number) => string;
  handleCopy: (text: string, field: string) => void;
  copiedField: string | null;
  onBack: () => void;
  /** Gọi khi user bấm "Tôi đã chuyển khoản" → ghi lịch sử và kiểm tra trạng thái */
  onConfirmTransfer?: () => Promise<void>;
  isConfirmingTransfer?: boolean;
}

export function BankTransferInfo({
  bankConfig,
  total,
  transferContent,
  qrUrl,
  timeLeft,
  formatCurrency,
  formatTime,
  handleCopy,
  copiedField,
  onBack,
  onConfirmTransfer,
  isConfirmingTransfer = false,
}: BankTransferInfoProps) {
  // Render copy button
  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="ml-2 rounded-lg bg-green-500 p-2 text-white transition-all hover:bg-green-600 active:scale-95"
      title="Sao chép"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row lg:justify-center">
      {/* Left - Bank Info */}
      <div className="w-full lg:w-[420px] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700 p-6">
        <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
          Thông tin thanh toán
        </h3>

        {/* Bank Logo & Name */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src={bankConfig.bankLogo}
            alt={bankConfig.bankName}
            className="h-10 w-auto"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {bankConfig.bankName}
          </span>
        </div>

        {/* Account Info */}
        <div className="space-y-4">
          {/* Account Name */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Chủ tài khoản:
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {bankConfig.accountName}
              </p>
            </div>
          </div>

          {/* Account Number */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Số tài khoản:
              </p>
              <p className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                {bankConfig.accountNo}
              </p>
            </div>
            <CopyButton text={bankConfig.accountNo} field="accountNo" />
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Số tiền:</p>
              <p className="font-mono text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(total)}
              </p>
            </div>
            <CopyButton text={total.toString()} field="amount" />
          </div>

          {/* Transfer Content */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Nội dung chuyển khoản:
              </p>
              <p className="font-mono text-lg font-bold text-orange-600 dark:text-orange-400">
                {transferContent}
              </p>
            </div>
            <CopyButton text={transferContent} field="content" />
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Lưu ý:</strong> Vui lòng nhập chính xác nội dung chuyển khoản
            và số tiền để đơn hàng được xử lý tự động.
          </p>
        </div>
      </div>

      {/* Right - QR Code */}
      <div className="w-full lg:w-[340px] p-6">
        <div className="rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 p-6 text-center text-white">
          <h3 className="mb-4 text-lg font-bold">Quét mã QR để thanh toán</h3>

          {/* QR Code with scan animation */}
          <div className="mx-auto mb-4 w-fit rounded-xl bg-white p-3">
            <div className="relative overflow-hidden">
              <img
                src={qrUrl}
                alt="QR Code thanh toán"
                className="h-52 w-52"
                onError={(e) => {
                  // Fallback if VietQR fails
                  (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `Bank: ${bankConfig.bankName}\nSTK: ${bankConfig.accountNo}\nCTK: ${bankConfig.accountName}\nSố tiền: ${total}\nND: ${transferContent}`
                  )}`;
                }}
              />
              {/* Scan line animation */}
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-80"
                style={{
                  animation: "scanLine 2s ease-in-out infinite",
                }}
              />
              <style>{`
                @keyframes scanLine {
                  0%, 100% {
                    top: 0;
                  }
                  50% {
                    top: calc(100% - 4px);
                  }
                }
              `}</style>
            </div>
          </div>

          <p className="text-sm text-blue-100">
            Sử dụng <strong>ứng dụng ngân hàng</strong> hoặc{" "}
            <strong>ví điện tử</strong> để quét mã
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Giao dịch được bảo mật
              </p>
              <p className="text-xs text-green-700 dark:text-green-500">
                Thanh toán qua VietQR - Tiêu chuẩn QR quốc gia
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons underneath QR code on desktop/mobile */}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 border-t border-gray-200 pt-6 dark:border-slate-700">
          {onConfirmTransfer && (
            <button
              type="button"
              onClick={onConfirmTransfer}
              disabled={isConfirmingTransfer}
              className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isConfirmingTransfer ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
            </button>
          )}
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 w-full justify-center ${
              timeLeft < 60
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              Hết hạn sau:{" "}
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </span>
          </div>

          <button
            onClick={onBack}
            className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300 w-full py-2 text-center"
          >
            Hủy giao dịch
          </button>
        </div>
      </div>
    </div>
  );
}
