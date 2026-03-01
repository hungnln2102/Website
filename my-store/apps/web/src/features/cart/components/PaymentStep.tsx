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
  createPaymentCodes,
  confirmBalancePayment,
  confirmTransfer,
  getAuthToken,
} from "@/lib/api";
import {
  CART_BANK_CONFIG,
  PAYMENT_TIMEOUT_SECONDS,
  SUCCESS_REDIRECT_SECONDS,
  formatPaymentCurrency,
  formatPaymentTime,
} from "../constants";
import { MCoinPaymentConfirm } from "./MCoinPaymentConfirm";
import { PaymentOutcome } from "./PaymentOutcome";
import { BankTransferInfo } from "./BankTransferInfo";
import { ROUTES } from "@/lib/constants";

interface PaymentStepProps {
  cartItems: CartItemData[];
  total: number;
  paymentMethod: PaymentMethod;
  onBack: () => void;
  onPaymentSuccess: (orderId: string, newBalance?: number) => void;
  onPaymentFailed: (error: string) => void;
  /** Khi Mcoin thành công từ step 2 → chuyển step 3 và hiển thị màn success này */
  initialSuccess?: { orderId: string; newBalance?: number } | null;
  /** Gọi khi bấm "Về trang chủ" trên màn success (đi về trang chủ, không quay lại giỏ) */
  onGoHome?: () => void;
}

type PaymentState = "loading" | "ready" | "processing" | "success" | "failed" | "expired";

export function PaymentStep({
  cartItems,
  total,
  paymentMethod,
  onBack,
  onPaymentSuccess,
  onPaymentFailed,
  initialSuccess = null,
  onGoHome,
}: PaymentStepProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>("loading");
  const [orderId, setOrderId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(PAYMENT_TIMEOUT_SECONDS);
  const [error, setError] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [redirectSeconds, setRedirectSeconds] = useState<number>(SUCCESS_REDIRECT_SECONDS);
  const [isConfirmingTransfer, setIsConfirmingTransfer] = useState(false);
  /** Mã đơn + transaction từ API create-codes (dùng cho Mcoin confirm và QR create). */
  const [paymentCodes, setPaymentCodes] = useState<{ orderIds: string[]; transactionId: string } | null>(null);

  const transferContent = orderId.replace(/-/g, "").slice(-8).toUpperCase();
  const qrUrl = `https://img.vietqr.io/image/${CART_BANK_CONFIG.bankId}-${CART_BANK_CONFIG.accountNo}-compact.png?amount=${total}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(CART_BANK_CONFIG.accountName)}`;

  // Initialize payment (QR): tạo mã trước, rồi gọi create với mã đó
  const initializePayment = useCallback(async () => {
    setPaymentState("loading");
    setError("");

    try {
      const itemCount = cartItems.length;
      const codesRes = await createPaymentCodes(itemCount, "MAVL");
      const orderIds = codesRes.success && codesRes.data ? codesRes.data.orderIds : null;
      const transactionId = codesRes.success && codesRes.data ? codesRes.data.transactionId : null;

      const items = cartItems.map((it) => ({
        id_product: it.variantId ?? it.id,
        duration: it.duration,
        extraInfo: it.additionalInfo,
      }));
      const response = await createPayment(
        {
          amount: total,
          description: `Thanh toán đơn hàng`,
          items,
          ...(orderIds && transactionId ? { orderIds, transactionId } : {}),
        },
        getAuthToken() ?? undefined
      );

      if (response.success && response.data) {
        const orderIdFromApi = response.data.transactionId ?? response.data.orderId ?? transactionId ?? "";
        setOrderId(orderIdFromApi);
        setPaymentState("ready");
        setTimeLeft(PAYMENT_TIMEOUT_SECONDS);
      } else {
        setPaymentState("ready");
        setTimeLeft(PAYMENT_TIMEOUT_SECONDS);
        setOrderId(transactionId ?? generateOrderId());
        console.warn("Payment API warning:", response.error);
      }
    } catch (err) {
      setPaymentState("ready");
      setTimeLeft(PAYMENT_TIMEOUT_SECONDS);
      setOrderId(generateOrderId());
      console.warn("Payment init warning:", err);
    }
  }, [total, cartItems]);

  // Check payment status
  const checkStatus = useCallback(async () => {
    if (paymentMethod === "balance" || !orderId || paymentState !== "ready") return;

    try {
      const response = await checkPaymentStatus(
        orderId,
        getAuthToken() ?? undefined
      );

      if (response.success && response.data) {
        const { status } = response.data;

        if (status === "PAID") {
          setPaymentState("success");
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
  }, [orderId, paymentState, paymentMethod, onPaymentSuccess, onPaymentFailed]);

  // Initialize payment on mount: balance gọi create-codes; bank/QR gọi initializePayment (đã gồm create-codes + create)
  useEffect(() => {
    if (paymentMethod === "balance") {
      let cancelled = false;
      createPaymentCodes(cartItems.length, "MAVL").then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setPaymentCodes(res.data);
          setOrderId(res.data.transactionId || res.data.orderIds[0] || "");
        } else {
          setOrderId(generateOrderId());
        }
        setPaymentState("ready");
      }).catch(() => {
        if (!cancelled) {
          setOrderId(generateOrderId());
          setPaymentState("ready");
        }
      });
      return () => { cancelled = true; };
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

  // Đếm ngược khi success (balance từ step 3 hoặc initialSuccess từ step 2 Mcoin)
  useEffect(() => {
    if (initialSuccess) {
      setRedirectSeconds(SUCCESS_REDIRECT_SECONDS);
      const timer = setInterval(() => {
        setRedirectSeconds((prev) => {
          if (prev <= 1) {
            onGoHome?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    if (paymentMethod !== "balance" || paymentState !== "success") return;
    setRedirectSeconds(SUCCESS_REDIRECT_SECONDS);
    const timer = setInterval(() => {
      setRedirectSeconds((prev) => {
        if (prev <= 1) {
          onGoHome?.() ?? (window.history.pushState({}, "", ROUTES.home), window.dispatchEvent(new PopStateEvent("popstate")));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentMethod, paymentState, initialSuccess, onGoHome]);

  // Confirm balance (MCoin) payment: dùng mã từ create-codes (paymentCodes), trừ Coin => Lưu đơn => note
  const handleConfirmBalance = useCallback(async () => {
    setPaymentState("processing");
    setError("");
    const items = cartItems.map((it) => ({
      id_product: it.variantId ?? it.id,
      name: it.name,
      variant_name: it.variant_name,
      duration: it.duration,
      note: it.note,
      quantity: it.quantity,
      price: it.price,
      extraInfo: it.additionalInfo,
    }));
    const result = await confirmBalancePayment(total, items, {
      orderIds: paymentCodes?.orderIds,
      transactionId: paymentCodes?.transactionId,
    });
    if (result.success && result.data?.newBalance != null) {
      setPaymentState("success");
      const orderIdForCallback = result.data.orderIds?.[0] ?? result.data.transactionId ?? "";
      setOrderId(orderIdForCallback);
      onPaymentSuccess(orderIdForCallback, result.data.newBalance);
    } else {
      setPaymentState("ready");
      setError(result.error || "Xác nhận thanh toán thất bại.");
      onPaymentFailed(result.error || "Xác nhận thanh toán thất bại.");
    }
  }, [total, cartItems, paymentCodes, onPaymentSuccess, onPaymentFailed]);

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

  // Test: gọi API confirmTransfer để ghi nhận thanh toán + gửi Telegram, rồi hiển thị màn thành công
  const handleTestPaymentSuccess = useCallback(async () => {
    const currentOrderId = orderId || generateOrderId();
    if (!currentOrderId || total <= 0) return;
    setOrderId(currentOrderId);
    setError("");
    try {
      const result = await confirmTransfer(currentOrderId, total);
      if (result.success) {
        setPaymentState("success");
        onPaymentSuccess(currentOrderId);
      } else {
        toast.error(result.error || "Xác nhận thanh toán thất bại.");
      }
    } catch {
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
    }
  }, [orderId, total, onPaymentSuccess]);

  // Xác nhận đã chuyển khoản/QR → ghi lịch sử giao dịch, sau đó kiểm tra trạng thái
  const handleConfirmTransfer = useCallback(async () => {
    const currentOrderId = orderId || generateOrderId();
    if (!currentOrderId || total <= 0) return;
    setOrderId(currentOrderId);
    setIsConfirmingTransfer(true);
    setError("");
    try {
      const result = await confirmTransfer(currentOrderId, total);
      if (result.success) {
        toast.success(result.message || "Đã ghi nhận thanh toán.");
        await checkStatus();
      } else {
        toast.error(result.error || "Xác nhận thất bại.");
      }
    } finally {
      setIsConfirmingTransfer(false);
    }
  }, [orderId, total, checkStatus]);

  // Render based on state
  const renderContent = () => {
    // Mcoin thành công từ step 2 → hiển thị màn thông báo thành công (cùng giao diện với QR/balance step 3)
    if (initialSuccess) {
      return (
        <PaymentOutcome
          paymentState="success"
          orderId={initialSuccess.orderId}
          error={undefined}
          redirectSeconds={redirectSeconds}
          paymentMethod="balance"
          onInitializePayment={initializePayment}
          onBack={onBack}
          onGoHome={onGoHome}
        />
      );
    }
    // Balance (MCoin): confirm step
    if (paymentMethod === "balance" && (paymentState === "ready" || paymentState === "processing")) {
      return (
        <MCoinPaymentConfirm
          paymentState={paymentState}
          total={total}
          error={error}
          handleConfirmBalance={handleConfirmBalance}
          onBack={onBack}
          formatCurrency={formatPaymentCurrency}
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
          onGoHome={onGoHome}
        />
      );
    }

    if (paymentState === "ready" && paymentMethod !== "balance") {
      return (
        <BankTransferInfo
          bankConfig={CART_BANK_CONFIG}
          total={total}
          transferContent={transferContent}
          qrUrl={qrUrl}
          timeLeft={timeLeft}
          formatCurrency={formatPaymentCurrency}
          formatTime={formatPaymentTime}
          handleCopy={handleCopy}
          copiedField={copiedField}
          onBack={onBack}
          onConfirmTransfer={handleConfirmTransfer}
          isConfirmingTransfer={isConfirmingTransfer}
          onTestPaymentSuccess={handleTestPaymentSuccess}
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
