/**
 * Gửi thông báo đơn hàng mới lên Telegram (định dạng HTML, giao diện chuyên nghiệp).
 */
import logger from "../../shared/utils/logger";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const TELEGRAM_TOPIC_ID = parseInt(process.env.TELEGRAM_TOPIC_ID || "2733", 10);

/** Escape HTML để tránh vỡ nội dung và bảo mật */
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Chuỗi "--12m" / "--30d" trong id_product hoặc duration → "12 tháng" / "30 ngày" */
function formatDurationLabel(value: string | undefined | null): string {
  if (!value || typeof value !== "string") return "";
  const match = value.match(/--\s*(\d+)\s*([md])\b/i) || value.match(/(\d+)\s*([md])\b/i);
  if (!match) return value.trim();
  const numStr = match[1];
  const unitStr = match[2];
  if (!numStr || !unitStr) return value.trim();
  const num = parseInt(numStr, 10);
  const unit = unitStr.toLowerCase();
  return unit === "d" ? `${num} ngày` : `${num} tháng`;
}

export interface TelegramOrderLine {
  idOrder: string;
  variantIdOrProductId: string;
  variantName?: string;
  productName?: string;
  duration?: string;
  extraInfo?: Record<string, string>;
  /** Slot (nếu có) — hiển thị trong block THÔNG TIN SẢN PHẨM */
  slot?: string;
}

export interface SendOrderNotificationParams {
  orderIds: string[];
  lines: TelegramOrderLine[];
  /** Tổng tiền đơn hàng (Mcoin), tùy chọn — hiển thị trong thông báo */
  totalAmountMcoin?: number;
  /** "Mcoin" | "QR" — hiển thị trong thông báo */
  paymentMethod?: "Mcoin" | "QR";
}

/** Tạo caption thông báo đơn hàng mới — format giống thông báo đơn hết hạn (📦 tiêu đề, 🆔 mã đơn, — THÔNG TIN SẢN PHẨM —, 📝 Mô tả, 📌 Slot) */
function buildMessage(params: SendOrderNotificationParams): string {
  const { orderIds, lines, totalAmountMcoin } = params;
  const now = new Date();
  const timeStr = now.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  });

  const count = orderIds.length;
  const titleCount = count > 1 ? ` (1/${count})` : "";

  const productLines = lines.map((line) => {
    const label = formatDurationLabel(line.duration ?? line.variantIdOrProductId);
    const rawName =
      (line.variantName && line.variantName.trim()) ||
      (line.productName && line.productName.trim()) ||
      (line.variantIdOrProductId && line.variantIdOrProductId.trim()) ||
      "";
    const name = rawName ? escapeHtml(rawName) : "—";
    return label ? `${name} (${escapeHtml(label)})` : name;
  });
  const sanPhamText = productLines.length > 0 ? productLines.join(" • ") : "—";

  const maDonText = orderIds.length > 0 ? orderIds.map((id) => escapeHtml(id)).join(", ") : "—";

  const extraParts: string[] = [];
  for (const line of lines) {
    if (!line.extraInfo || Object.keys(line.extraInfo).length === 0) continue;
    const pairs = Object.entries(line.extraInfo)
      .filter(([, v]) => v != null && String(v).trim() !== "")
      .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(String(v))}`);
    if (pairs.length > 0) extraParts.push(pairs.join(" | "));
  }
  const moTaText = extraParts.length > 0 ? extraParts.join("\n") : "";

  const slotParts = lines.map((line) => (line.slot && line.slot.trim() ? escapeHtml(line.slot.trim()) : ""));
  const slotDisplay = slotParts.filter(Boolean).join(", ") || "";

  const hasProductInfo = moTaText !== "" || slotDisplay !== "";

  const parts: string[] = [
    `📦 <b>Đơn hàng mới${titleCount}</b>`,
    "",
    `Sản phẩm: <code>${sanPhamText}</code>`,
    `🆔 Mã đơn: <code>${maDonText}</code>`,
  ];

  if (typeof totalAmountMcoin === "number" && totalAmountMcoin >= 0) {
    parts.push(`💰 Tổng thanh toán: <code>${totalAmountMcoin.toLocaleString("vi-VN")} Mcoin</code>`);
  }
  if (params.paymentMethod) {
    parts.push(`💳 Thanh toán: <code>${escapeHtml(params.paymentMethod)}</code>`);
  }

  if (hasProductInfo) {
    parts.push(
      "",
      "— THÔNG TIN SẢN PHẨM —",
      `📝 Mô tả: <code>${moTaText}</code>`,
      `📌 Slot: <code>${slotDisplay}</code>`
    );
  }

  parts.push(
    "",
    `🕐 Thời gian: ${escapeHtml(timeStr)}`
  );

  return parts.join("\n");
}

/** Tham số cho component thông báo dùng chung (Mcoin + QR) */
export type NewOrderNotifyPayload =
  | {
      paymentMethod: "Mcoin";
      orderIds: string[];
      lines: TelegramOrderLine[];
      totalAmount: number;
    }
  | {
      paymentMethod: "QR";
      orderIds: string[];
      totalAmount: number;
    };

/**
 * Component thông báo đơn hàng mới dùng chung cho thanh toán Mcoin và QR.
 * Gọi từ balance-payment.service (Mcoin) và payment.controller confirmTransfer (QR).
 */
export async function notifyNewOrder(payload: NewOrderNotifyPayload): Promise<boolean> {
  const { orderIds, totalAmount, paymentMethod } = payload;
  const lines: TelegramOrderLine[] =
    payload.paymentMethod === "Mcoin"
      ? payload.lines
      : orderIds.map((id) => ({
          idOrder: id,
          variantIdOrProductId: id,
          productName: "Đơn thanh toán QR",
        }));
  const params: SendOrderNotificationParams = {
    orderIds,
    lines,
    totalAmountMcoin: totalAmount,
    paymentMethod,
  };
  return sendOrderNotification(params);
}

export async function sendOrderNotification(params: SendOrderNotificationParams): Promise<boolean> {
  console.log("[Telegram] sendOrderNotification called", {
    orderIds: params.orderIds,
    linesCount: params.lines?.length,
    hasToken: !!TELEGRAM_BOT_TOKEN,
    hasChatId: !!TELEGRAM_CHAT_ID,
    topicId: TELEGRAM_TOPIC_ID,
  });
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing.");
    return false;
  }

  const text = buildMessage(params);
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  // Inline keyboard: Hoàn thành | Hủy Đơn (callback_data có giới hạn 64 byte, dùng order id đầu)
  const firstOrderId = params.orderIds[0] ?? "";
  const reply_markup =
    firstOrderId.length > 0
      ? {
          inline_keyboard: [
            [
              { text: "✅ Hoàn thành", callback_data: `order_done:${firstOrderId}` },
              { text: "❌ Hủy Đơn", callback_data: `order_cancel:${firstOrderId}` },
            ],
          ],
        }
      : undefined;

  try {
    console.log("[Telegram] Sending request to", url.replace(TELEGRAM_BOT_TOKEN, "***"));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        message_thread_id: TELEGRAM_TOPIC_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(reply_markup && { reply_markup }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error("Telegram sendOrderNotification error", { statusCode: res.status, detail: err });
      return false;
    }
    console.log("[Telegram] Message sent successfully");
    return true;
  } catch (err) {
    logger.error("Telegram sendOrderNotification exception", { error: err });
    return false;
  }
}
