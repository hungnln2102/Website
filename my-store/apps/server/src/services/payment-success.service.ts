/**
 * Component chung cho bước "thanh toán thành công" (Mcoin & QR).
 * Ghi order_list (khi có itemsForOrderList) + gửi thông báo Telegram topic 2733.
 * Gọi từ: confirmBalancePayment (Mcoin), confirmTransfer (QR), processWebhook (QR).
 */

import { notifyNewOrder } from "./telegram.service";
import type { TelegramOrderLine } from "./telegram.service";
import { insertOrderListFromPayment } from "./order-list.service";
import type { OrderListItemInput } from "./order-list.service";

export type PaymentMethod = "Mcoin" | "QR";

export interface HandlePaymentSuccessParams {
  orderIds: string[];
  accountId: number;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  /** Có thì ghi order_list (Mcoin); QR thường không có từng dòng. */
  itemsForOrderList?: OrderListItemInput[] | null;
  /** Dòng cho Telegram (Mcoin); QR dùng mặc định "Đơn thanh toán QR". */
  linesForTelegram?: TelegramOrderLine[] | null;
  /** Link liên hệ ghi vào order_list (vd. FRONTEND_URL). */
  contact?: string | null;
}

/**
 * Gọi sau khi đã ghi xong order_customer + wallet_transaction.
 * Không throw — lỗi order_list / Telegram chỉ log, không ảnh hưởng response API.
 */
export function handlePaymentSuccess(params: HandlePaymentSuccessParams): void {
  const {
    orderIds,
    accountId,
    paymentMethod,
    totalAmount,
    itemsForOrderList,
    linesForTelegram,
    contact,
  } = params;

  if (orderIds.length === 0) {
    console.warn("[PaymentSuccess] orderIds empty, skip");
    return;
  }

  // 1) Ghi tạm order_list khi có đủ dữ liệu từng dòng (Mcoin)
  if (
    itemsForOrderList &&
    itemsForOrderList.length === orderIds.length
  ) {
    insertOrderListFromPayment({
      accountId,
      orderIds,
      items: itemsForOrderList,
      contact: contact ?? process.env.FRONTEND_URL ?? undefined,
    }).catch((err) => {
      console.error("[PaymentSuccess] order_list insert failed:", err);
    });
  }

  // 2) Gửi thông báo đơn hàng mới lên Telegram (topic 2733)
  if (paymentMethod === "Mcoin" && linesForTelegram && linesForTelegram.length > 0) {
    notifyNewOrder({
      paymentMethod: "Mcoin",
      orderIds,
      lines: linesForTelegram,
      totalAmount,
    }).catch((err) => {
      console.error("[PaymentSuccess] Telegram notification failed:", err);
    });
  } else {
    notifyNewOrder({
      paymentMethod: "QR",
      orderIds,
      totalAmount,
    }).catch((err) => {
      console.error("[PaymentSuccess] Telegram notification failed:", err);
    });
  }

  console.log("[PaymentSuccess]", paymentMethod, "orderIds:", orderIds.length);
}
