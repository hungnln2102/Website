"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  RefreshCcw,
  Shield,
  AlertTriangle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { CartItemData } from "./CartItem";
import type { PaymentMethod } from "./CartConfirmation";
import {
  createPayment,
  checkPaymentStatus,
  generateOrderId,
} from "@/lib/api";

interface PaymentStepProps {
  cartItems: CartItemData[];
  total: number;
  paymentMethod: PaymentMethod;
  onBack: () => void;
  onPaymentSuccess: (orderId: string) => void;
  onPaymentFailed: (error: string) => void;
}

type PaymentState = "loading" | "ready" | "processing" | "success" | "failed" | "expired";

const formatCurrency = (value: number) =>
  `${value.toLocaleString("vi-VN")}đ`;

const PAYMENT_TIMEOUT = 15 * 60; // 15 minutes in seconds

// Bank configuration - Cấu hình thông tin ngân hàng
const BANK_CONFIG = {
  bankId: "ACB", // Mã ngân hàng VietQR
  bankName: "Ngân hàng Á Châu (ACB)",
  bankLogo: "https://api.vietqr.io/img/ACB.png",
  accountNo: "46282537", // Số tài khoản
  accountName: "NGUYEN THI THU TRANG", // Tên chủ tài khoản
};

export function PaymentStep({
  cartItems,
  total,
  paymentMethod,
  onBack,
  onPaymentSuccess,
  onPaymentFailed,
}: PaymentStepProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>("loading");
  const [orderId, setOrderId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(PAYMENT_TIMEOUT);
  const [error, setError] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Generate transfer content (nội dung chuyển khoản)
  const transferContent = orderId.replace(/-/g, "").slice(-8).toUpperCase();

  // Generate VietQR URL (template: compact = QR + logo only, no account info)
  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact.png?amount=${total}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  // Initialize payment
  const initializePayment = useCallback(async () => {
    setPaymentState("loading");
    setError("");

    const newOrderId = generateOrderId();
    setOrderId(newOrderId);

    try {
      // Call API to create payment record
      const response = await createPayment({
        orderId: newOrderId,
        amount: total,
        description: `Thanh toán đơn hàng ${newOrderId}`,
      });

      if (response.success) {
        setPaymentState("ready");
        setTimeLeft(PAYMENT_TIMEOUT);
      } else {
        // Even if API fails, still show payment info for manual transfer
        setPaymentState("ready");
        setTimeLeft(PAYMENT_TIMEOUT);
        console.warn("Payment API warning:", response.error);
      }
    } catch (err) {
      // Still show payment info even if API fails
      setPaymentState("ready");
      setTimeLeft(PAYMENT_TIMEOUT);
      console.warn("Payment init warning:", err);
    }
  }, [total]);

  // Check payment status
  const checkStatus = useCallback(async () => {
    if (!orderId || paymentState !== "ready") return;

    try {
      const response = await checkPaymentStatus(orderId);

      if (response.success && response.data) {
        const { status } = response.data;

        if (status === "PAID") {
          setPaymentState("success");
          toast.success("Thanh toán thành công!");
          onPaymentSuccess(orderId);
        } else if (status === "FAILED" || status === "CANCELLED") {
          setPaymentState("failed");
          setError("Thanh toán không thành công");
          onPaymentFailed("Thanh toán không thành công");
        }
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
    }
  }, [orderId, paymentState, onPaymentSuccess, onPaymentFailed]);

  // Initialize payment on mount
  useEffect(() => {
    initializePayment();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (paymentState !== "ready" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState, timeLeft]);

  // Poll payment status every 5 seconds
  useEffect(() => {
    if (paymentState !== "ready") return;

    const pollInterval = setInterval(checkStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [paymentState, checkStatus]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Copy to clipboard
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Đã sao chép!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Không thể sao chép");
    }
  };

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

  // Render based on state
  const renderContent = () => {
    switch (paymentState) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-600 dark:text-slate-400">
              Đang tạo giao dịch thanh toán...
            </p>
          </div>
        );

      case "ready":
        return (
          <div className="flex flex-col">
            {/* Main content */}
            <div className="flex flex-col lg:flex-row lg:justify-center">
              {/* Left - Bank Info */}
              <div className="w-full lg:w-[420px] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700 p-6">
                <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
                  Thông tin thanh toán
                </h3>

                {/* Bank Logo & Name */}
                <div className="mb-6 flex items-center gap-3">
                  <img
                    src={BANK_CONFIG.bankLogo}
                    alt={BANK_CONFIG.bankName}
                    className="h-10 w-auto"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {BANK_CONFIG.bankName}
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
                        {BANK_CONFIG.accountName}
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
                        {BANK_CONFIG.accountNo}
                      </p>
                    </div>
                    <CopyButton text={BANK_CONFIG.accountNo} field="accountNo" />
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Số tiền:
                      </p>
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
                    <strong>Lưu ý:</strong> Vui lòng nhập chính xác nội dung chuyển khoản và số tiền để đơn hàng được xử lý tự động.
                  </p>
                </div>
              </div>

              {/* Right - QR Code */}
              <div className="w-full lg:w-[340px] p-6">
                <div className="rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 p-6 text-center text-white">
                  <h3 className="mb-4 text-lg font-bold">
                    Quét mã QR để thanh toán
                  </h3>

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
                            `Bank: ${BANK_CONFIG.bankName}\nSTK: ${BANK_CONFIG.accountNo}\nCTK: ${BANK_CONFIG.accountName}\nSố tiền: ${total}\nND: ${transferContent}`
                          )}`;
                        }}
                      />
                      {/* Scan line animation */}
                      <div 
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-80"
                        style={{
                          animation: 'scanLine 2s ease-in-out infinite',
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
              </div>
            </div>

            {/* Footer - Timer & Cancel */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col items-center justify-center gap-3">
                <div
                  className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                    timeLeft < 60
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    Đơn hàng sẽ hết hạn sau:{" "}
                    <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                  </span>
                </div>

                <button
                  onClick={onBack}
                  className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300"
                >
                  Hủy giao dịch
                </button>
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 rounded-full bg-green-100 p-6 dark:bg-green-900/30">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Thanh toán thành công!
            </h3>
            <p className="mb-2 text-gray-600 dark:text-slate-400">
              Mã đơn hàng: <span className="font-mono font-semibold">{orderId}</span>
            </p>
            <p className="text-gray-500 dark:text-slate-500">
              Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.
            </p>
          </div>
        );

      case "failed":
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
                onClick={initializePayment}
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

      case "expired":
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
                onClick={initializePayment}
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

      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {renderContent()}
    </div>
  );
}
