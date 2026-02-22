"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { CartItemData } from "./CartItem";
import type { PaymentMethod } from "./CartConfirmation";
import {
  createPayment,
  checkPaymentStatus,
  generateOrderId,
  confirmBalancePayment,
} from "@/lib/api";
import { MCoinPaymentConfirm } from "./MCoinPaymentConfirm";
import { PaymentOutcome } from "./PaymentOutcome";
import { BankTransferInfo } from "./BankTransferInfo";

interface PaymentStepProps {
  cartItems: CartItemData[];
  total: number;
  paymentMethod: PaymentMethod;
  onBack: () => void;
  onPaymentSuccess: (orderId: string, newBalance?: number) => void;
  onPaymentFailed: (error: string) => void;
}

type PaymentState = "loading" | "ready" | "processing" | "success" | "failed" | "expired";

const formatCurrency = (value: number) =>
  `${value.toLocaleString("vi-VN")}đ`;

const PAYMENT_TIMEOUT = 15 * 60; // 15 minutes in seconds
const SUCCESS_REDIRECT_SECONDS = 5;

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
  const [redirectSeconds, setRedirectSeconds] = useState<number>(SUCCESS_REDIRECT_SECONDS);

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
    if (paymentMethod === "balance" || !orderId || paymentState !== "ready") return;

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

  // Initialize payment on mount: bank/QR flow or balance "ready" with orderId
  useEffect(() => {
    if (paymentMethod === "balance") {
      setOrderId((prev) => prev || generateOrderId());
      setPaymentState("ready");
      return;
    }
    initializePayment();
  }, [paymentMethod]);

  // Countdown timer (bank/QR only)
  useEffect(() => {
    if (paymentMethod === "balance" || paymentState !== "ready" || timeLeft <= 0) return;

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

  // Poll payment status every 5 seconds (bank/QR only)
  useEffect(() => {
    if (paymentMethod === "balance" || paymentState !== "ready") return;
    const pollInterval = setInterval(checkStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [paymentMethod, paymentState, checkStatus]);

  // Redirect countdown after success (balance payment)
  useEffect(() => {
    if (paymentMethod !== "balance" || paymentState !== "success") return;
    setRedirectSeconds(SUCCESS_REDIRECT_SECONDS);
    const timer = setInterval(() => {
      setRedirectSeconds((prev) => {
        if (prev <= 1) {
          window.history.pushState({}, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentMethod, paymentState]);

  // Confirm balance (MCoin) payment: Trừ Coin => Lưu đơn => Lịch sử giao dịch
  const handleConfirmBalance = useCallback(async () => {
    const currentOrderId = orderId || generateOrderId();
    if (!currentOrderId) return;
    setOrderId(currentOrderId);
    setPaymentState("processing");
    setError("");
    const items = cartItems.map((it) => ({
      id_product: it.id,
      name: it.name,
      variant_name: it.variant_name,
      duration: it.duration,
      note: it.note,
      quantity: it.quantity,
      price: it.price,
    }));
    const result = await confirmBalancePayment(currentOrderId, total, items);
    if (result.success && result.data?.newBalance != null) {
      setPaymentState("success");
      toast.success("Thanh toán thành công!");
      onPaymentSuccess(currentOrderId, result.data.newBalance);
    } else {
      setPaymentState("ready");
      setError(result.error || "Xác nhận thanh toán thất bại.");
      onPaymentFailed(result.error || "Xác nhận thanh toán thất bại.");
    }
  }, [orderId, total, cartItems, onPaymentSuccess, onPaymentFailed]);

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

  // Render based on state
  const renderContent = () => {
    // Balance (MCoin): confirm step
    if (paymentMethod === "balance" && (paymentState === "ready" || paymentState === "processing")) {
      return (
        <MCoinPaymentConfirm
          paymentState={paymentState}
          total={total}
          error={error}
          handleConfirmBalance={handleConfirmBalance}
          onBack={onBack}
          formatCurrency={formatCurrency}
        />
      );
    }

    if (
      paymentState === "success" ||
      paymentState === "failed" ||
      paymentState === "expired" ||
      paymentState === "loading"
    ) {
      return (
        <PaymentOutcome
          paymentState={paymentState}
          orderId={orderId}
          error={error}
          redirectSeconds={redirectSeconds}
          paymentMethod={paymentMethod}
          onInitializePayment={initializePayment}
          onBack={onBack}
        />
      );
    }

    if (paymentState === "ready" && paymentMethod !== "balance") {
      return (
        <BankTransferInfo
          bankConfig={BANK_CONFIG}
          total={total}
          transferContent={transferContent}
          qrUrl={qrUrl}
          timeLeft={timeLeft}
          formatCurrency={formatCurrency}
          formatTime={formatTime}
          handleCopy={handleCopy}
          copiedField={copiedField}
          onBack={onBack}
        />
      );
    }

    return null;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {renderContent()}
    </div>
  );
}
