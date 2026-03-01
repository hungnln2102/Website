/**
 * Payment request handlers – logic extracted from payment.route
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { sepayService } from "../services/sepay.service";
import { confirmBalancePayment, createPaymentCodes, generateMavpTransactionId, generateUniqueIdOrder } from "../services/balance-payment.service";
import { handlePaymentSuccess } from "../services/payment-success.service";
import type { OrderListItemInput } from "../services/order-list.service";
import { logPaymentEvent, logSecurityEvent } from "../utils/logger";

interface ReqUser {
  userId?: string;
  email?: string;
}

/** Item từ frontend khi tạo đơn QR (cùng format Mcoin: mã đơn, tên SP, ngày đăng ký, số ngày, ngày hết hạn). */
interface QrOrderItem {
  id_product?: unknown;
  name?: unknown;
  variant_name?: unknown;
  duration?: unknown;
  price?: unknown;
  quantity?: unknown;
  extraInfo?: Record<string, string>;
}

/** Tạo đơn QR: wallet_transaction + N order_customer. Không ghi order_list — ghi khi thanh toán thành công (confirmTransfer có gửi kèm items). */
async function createQrOrder(
  accountId: number,
  amountVnd: number,
  items: QrOrderItem[],
  idOrderPrefix: "MAVL" | "MAVC" | "MAVK" = "MAVL",
  options?: { orderIds?: string[]; transactionId?: string }
): Promise<{ transactionId: string; paymentId: number; orderIds: string[] }> {
  const WALLET_TABLE = `${DB_SCHEMA.WALLET!.SCHEMA}.${DB_SCHEMA.WALLET!.TABLE}`;
  const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
  const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
  const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
  const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;

  const useCodes =
    options?.orderIds &&
    options.orderIds.length === items.length &&
    options.transactionId != null &&
    String(options.transactionId).trim() !== "";
  const transactionId = useCodes ? String(options!.transactionId!).trim() : generateMavpTransactionId();
  const orderIds: string[] = useCodes ? [...options!.orderIds!] : [];

  const txIdCol = COLS_WT.TRANSACTION_ID;
  const methodCol = COLS_WT.METHOD;
  const idOrderCol = COLS_OC.ID_ORDER;
  const paymentIdCol = COLS_OC.PAYMENT_ID;

  const balanceRes = await pool.query(
    `SELECT balance FROM ${WALLET_TABLE} WHERE account_id = $1`,
    [accountId]
  );
  const currentBalance = parseInt(balanceRes.rows[0]?.balance || "0", 10);

  const insertTx = await pool.query(
    `INSERT INTO ${WALLET_TX_TABLE}
     (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, ${methodCol}, created_at)
     VALUES ($1, $2, 'PURCHASE', 'DEBIT', $3, $4, $4, 'QR', NOW())
     RETURNING id`,
    [transactionId, accountId, amountVnd, currentBalance]
  );
  const paymentId = insertTx.rows[0]?.id as number;

  for (let i = 0; i < items.length; i++) {
    const idOrder = orderIds[i] ?? generateUniqueIdOrder(idOrderPrefix);
    if (i >= orderIds.length) orderIds.push(idOrder);
    await pool.query(
      `INSERT INTO ${ORDER_CUSTOMER_TABLE} (${idOrderCol}, account_id, status, ${paymentIdCol}, created_at, updated_at)
       VALUES ($1, $2, 'Đang Tạo Đơn', $3, NOW(), NOW())`,
      [idOrder, accountId, paymentId]
    );
  }

  return { transactionId, paymentId, orderIds };
}

export async function createPayment(req: Request, res: Response) {
  try {
    const { amount, description, items: bodyItems } = req.body;
    const orderIdLegacy = req.body.orderId;
    const user = (req as Request & { user?: ReqUser }).user;

    const amountVnd = Math.round(Number(amount));
    if (amountVnd < 0 || !user?.userId) {
      return res.status(400).json({ success: false, error: "Invalid amount or not authenticated" });
    }

    const accountId = parseInt(user.userId, 10);
    const idOrderPrefix = (req.body.idOrderPrefix as "MAVL" | "MAVC" | "MAVK" | undefined) || "MAVL";
    const orderIdsBody = req.body.orderIds;
    const transactionIdBody = req.body.transactionId;

    if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      const normalizedItems: QrOrderItem[] = bodyItems.map((it: Record<string, unknown>) => ({
        id_product: it.id_product,
        name: it.name,
        variant_name: it.variant_name,
        duration: it.duration,
        price: it.price,
        quantity: it.quantity,
        extraInfo: it.extraInfo && typeof it.extraInfo === "object" ? (it.extraInfo as Record<string, string>) : undefined,
      }));
      const options =
        Array.isArray(orderIdsBody) &&
        orderIdsBody.length === normalizedItems.length &&
        transactionIdBody != null &&
        String(transactionIdBody).trim() !== ""
          ? { orderIds: orderIdsBody as string[], transactionId: String(transactionIdBody).trim() }
          : undefined;
      const { transactionId } = await createQrOrder(accountId, amountVnd, normalizedItems, idOrderPrefix, options);

      if (!sepayService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Payment service not configured",
          message: "Please contact administrator",
        });
      }

      const payment = await sepayService.createPayment({
        orderId: transactionId,
        amount: amountVnd,
        description: description || `Thanh toán đơn hàng ${transactionId}`,
        customerEmail: user?.email,
      });

      return res.json({
        success: true,
        data: { ...payment, orderId: transactionId, transactionId },
      });
    }

    const orderId = orderIdLegacy;
    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ success: false, error: "orderId or items required" });
    }

    const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
    const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
    const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
    const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
    const txIdCol = COLS_WT.TRANSACTION_ID as string;
    const paymentIdCol = COLS_OC.PAYMENT_ID as string;
    const idOrder = String(orderId).trim();

    const updated = await pool.query(
      `UPDATE ${ORDER_CUSTOMER_TABLE} SET status = 'pending', updated_at = NOW() WHERE id_order = $1 AND account_id = $2 RETURNING ${paymentIdCol}`,
      [idOrder, accountId]
    );
    let useTxId: string;
    if (updated.rowCount === 0) {
      useTxId = `TX${accountId}${Date.now().toString(36).toUpperCase()}QR`;
      await pool.query(
        `INSERT INTO ${ORDER_CUSTOMER_TABLE} (id_order, account_id, status, ${paymentIdCol}, created_at, updated_at) VALUES ($1, $2, 'pending', $3, NOW(), NOW())`,
        [idOrder, accountId, useTxId]
      );
    } else {
      useTxId = (updated.rows[0]?.[paymentIdCol] ?? `TX${accountId}${Date.now().toString(36).toUpperCase()}QR`) as string;
      if (!useTxId) {
        useTxId = `TX${accountId}${Date.now().toString(36).toUpperCase()}QR`;
        await pool.query(
          `UPDATE ${ORDER_CUSTOMER_TABLE} SET ${paymentIdCol} = $1, updated_at = NOW() WHERE id_order = $2 AND account_id = $3`,
          [useTxId, idOrder, accountId]
        );
      }
    }

    const existing = await pool.query(
      `SELECT id FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1 AND account_id = $2 LIMIT 1`,
      [useTxId, accountId]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO ${WALLET_TX_TABLE}
         (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, method, created_at)
         VALUES ($1, $2, 'PURCHASE', 'DEBIT', $3, 0, 0, 'BANK_TRANSFER', NOW())`,
        [useTxId, accountId, amountVnd]
      );
    }

    if (!sepayService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Payment service not configured",
        message: "Please contact administrator",
      });
    }

    const payment = await sepayService.createPayment({
      orderId,
      amount,
      description: description || `Thanh toán đơn hàng ${orderId}`,
      customerEmail: user?.email,
    });

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function confirmBalance(req: Request, res: Response) {
  try {
    const { userId } = (req as Request & { user: { userId: string } }).user;
    const { amount, items, orderIds: bodyOrderIds, transactionId: bodyTransactionId } = req.body;
    const idOrderPrefix = (req.body.idOrderPrefix as "MAVL" | "MAVC" | "MAVK" | undefined) || "MAVL";

    const totalFromItems = (items as { price?: unknown; quantity?: unknown }[]).reduce(
      (sum: number, it) =>
        sum +
        Number(it.price || 0) * Math.max(1, parseInt(String(it.quantity), 10) || 1),
      0
    );
    if (Math.abs(totalFromItems - Number(amount)) > 0.01) {
      return res.status(400).json({
        success: false,
        error: "Amount does not match items total",
      });
    }

    const result = await confirmBalancePayment({
      accountId: parseInt(userId, 10),
      amount: Math.round(Number(amount)),
      items: (items as { id_product?: unknown; name?: unknown; variant_name?: unknown; duration?: unknown; note?: unknown; quantity?: unknown; price?: unknown; extraInfo?: Record<string, string> }[]).map(
        (it) => ({
          id_product: String(it.id_product).trim(),
          name: it.name != null ? String(it.name).trim() : undefined,
          variant_name: it.variant_name != null ? String(it.variant_name).trim() : undefined,
          duration: it.duration != null ? String(it.duration).trim() : undefined,
          note: it.note != null ? String(it.note).trim() : undefined,
          quantity: Math.max(1, parseInt(String(it.quantity), 10) || 1),
          price: Number(it.price) || 0,
          extraInfo: it.extraInfo && typeof it.extraInfo === "object" ? it.extraInfo : undefined,
        })
      ),
      idOrderPrefix,
      orderIds: Array.isArray(bodyOrderIds) && bodyOrderIds.length === (items as unknown[]).length ? (bodyOrderIds as string[]) : undefined,
      transactionId: bodyTransactionId != null && String(bodyTransactionId).trim() !== "" ? String(bodyTransactionId).trim() : undefined,
    });

    res.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        transactionId: result.transactionId,
        orderIds: result.orderIds,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Insufficient balance") {
      return res.status(400).json({
        success: false,
        error: "Số dư không đủ",
      });
    }
    console.error("Balance payment confirm error:", error);
    res.status(500).json({ success: false, error: message });
  }
}

export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const orderId = req.params.orderId ?? "";
    const status = await sepayService.getPaymentStatus(orderId);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error("Payment status check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check payment status",
    });
  }
}

/** Xác nhận đơn chuyển khoản / QR (VietQR) đã thanh toán → ghi wallet_transactions, (nếu có items) ghi order_list, gửi Telegram. */
export async function confirmTransfer(req: Request, res: Response) {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;
    const accountId = parseInt(userId, 10);
    const { orderId, amount, items: bodyItems } = req.body as {
      orderId?: string;
      amount?: number;
      items?: Array<{ id_product?: unknown; price?: unknown; duration?: unknown; quantity?: unknown; extraInfo?: Record<string, string> }>;
    };

    if (!orderId || amount == null || Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        error: "Thiếu orderId hoặc amount (số tiền VND)",
      });
    }

    const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
    const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
    const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
    const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
    const txIdCol = COLS_WT.TRANSACTION_ID as string;
    const paymentIdCol = COLS_OC.PAYMENT_ID as string;
    const idOrderCol = COLS_OC.ID_ORDER as string;
    const idOrderParam = String(orderId).trim();
    const amountVnd = Math.round(Number(amount));

    // 1) Tìm đơn: theo id_order (MAVL...) hoặc theo transaction_id (MAVP...) khi frontend gửi mã giao dịch
    let oc = await pool.query(
      `SELECT ${idOrderCol}, status, ${paymentIdCol} FROM ${ORDER_CUSTOMER_TABLE} WHERE id_order = $1 AND account_id = $2`,
      [idOrderParam, accountId]
    );
    let paymentId: string | number | null = null;
    let orderIds: string[] = [];

    if (oc.rows.length > 0) {
      // Tìm thấy theo id_order
      if (oc.rows[0].status === "paid") {
        return res.json({
          success: true,
          message: "Đơn hàng đã được xác nhận thanh toán trước đó",
        });
      }
      paymentId = oc.rows[0][paymentIdCol] as string | number | null;
      await pool.query(
        `UPDATE ${ORDER_CUSTOMER_TABLE} SET status = 'paid', updated_at = NOW() WHERE id_order = $1 AND account_id = $2`,
        [idOrderParam, accountId]
      );
      orderIds = [idOrderParam];
    } else {
      // Frontend gửi transaction_id (MAVP...) → tìm wallet_transaction rồi tất cả order_customer cùng payment_id
      const wt = await pool.query(
        `SELECT id FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1 AND account_id = $2 LIMIT 1`,
        [idOrderParam, accountId]
      );
      if (wt.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy đơn hàng chờ thanh toán của bạn",
        });
      }
      const paymentIdNum = wt.rows[0].id as number;
      paymentId = paymentIdNum;
      const ocAll = await pool.query(
        `SELECT ${idOrderCol}, status FROM ${ORDER_CUSTOMER_TABLE} WHERE ${paymentIdCol} = $1 AND account_id = $2`,
        [paymentIdNum, accountId]
      );
      if (ocAll.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy đơn hàng chờ thanh toán của bạn",
        });
      }
      const alreadyPaid = ocAll.rows.every((r) => r.status === "paid");
      if (alreadyPaid) {
        orderIds = ocAll.rows.map((r) => String(r[idOrderCol] ?? "")).filter(Boolean);
        return res.json({
          success: true,
          message: "Đơn hàng đã được xác nhận thanh toán trước đó",
        });
      }
      await pool.query(
        `UPDATE ${ORDER_CUSTOMER_TABLE} SET status = 'paid', updated_at = NOW() WHERE ${paymentIdCol} = $1 AND account_id = $2`,
        [paymentIdNum, accountId]
      );
      orderIds = ocAll.rows.map((r) => String(r[idOrderCol] ?? "")).filter(Boolean);
    }

    const useTxId = paymentId != null ? String(paymentId) : `TX${accountId}${Date.now().toString(36).toUpperCase()}QR`;
    const paymentIdNum = paymentId != null ? Number(paymentId) : NaN;
    const existingTx =
      !Number.isNaN(paymentIdNum)
        ? await pool.query(
            `SELECT id FROM ${WALLET_TX_TABLE} WHERE id = $1 AND account_id = $2 LIMIT 1`,
            [paymentIdNum, accountId]
          )
        : { rows: [] };
    if (existingTx.rows.length > 0) {
      await pool.query(
        `UPDATE ${WALLET_TX_TABLE} SET amount = $1 WHERE id = $2 AND account_id = $3`,
        [amountVnd, existingTx.rows[0].id, accountId]
      );
    } else {
      await pool.query(
        `INSERT INTO ${WALLET_TX_TABLE}
         (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, method, created_at)
         VALUES ($1, $2, 'PURCHASE', 'DEBIT', $3, 0, 0, 'BANK_TRANSFER', NOW())`,
        [useTxId, accountId, amountVnd]
      );
    }

    // Khi thanh toán thành công: ghi order_list + Telegram (nếu frontend gửi kèm items, thứ tự trùng orderIds)
    if (orderIds.length === 0) orderIds.push(idOrderParam);
    const itemsForOrderList: OrderListItemInput[] | undefined =
      Array.isArray(bodyItems) &&
      bodyItems.length === orderIds.length
        ? orderIds.map((id_order, i) => {
            const it = bodyItems[i]!;
            return {
              id_order,
              id_product: parseInt(String(it.id_product ?? ""), 10) || 0,
              price: (Number(it.price) || 0) * Math.max(1, parseInt(String(it.quantity), 10) || 1),
              information_order:
                it.extraInfo && Object.keys(it.extraInfo).length > 0 ? JSON.stringify(it.extraInfo) : null,
              duration: it.duration != null ? String(it.duration).trim() : null,
            };
          })
        : undefined;

    handlePaymentSuccess({
      orderIds,
      accountId,
      paymentMethod: "QR",
      totalAmount: amountVnd,
      itemsForOrderList,
      contact: process.env.FRONTEND_URL || undefined,
    });

    logPaymentEvent("TRANSFER_CONFIRMED", { orderId: idOrderParam, amount: amountVnd, accountId });
    res.json({ success: true, message: "Đã ghi nhận thanh toán vào lịch sử giao dịch" });
  } catch (error) {
    console.error("Confirm transfer error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Xác nhận thanh toán thất bại",
    });
  }
}

export async function successCallback(req: Request, res: Response) {
  try {
    const params = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4001";

    if (!params.signature) {
      logSecurityEvent("MISSING_PAYMENT_SIGNATURE", { params });
      return res.redirect(`${frontendUrl}/payment/error?error=missing_signature`);
    }

    const isValid = sepayService.verifyReturnUrl(params);
    if (!isValid) {
      logSecurityEvent("INVALID_PAYMENT_SIGNATURE", { params });
      return res.redirect(`${frontendUrl}/payment/error?error=invalid_signature`);
    }

    const { order_invoice_number } = params;
    const sanitizedOrderId = String(order_invoice_number || "").replace(
      /[^a-zA-Z0-9-_]/g,
      ""
    );

    logPaymentEvent("PAYMENT_SUCCESS_CALLBACK", {
      orderId: sanitizedOrderId,
      status: "success",
    });

    res.redirect(
      `${frontendUrl}/payment/success?orderId=${encodeURIComponent(sanitizedOrderId)}`
    );
  } catch (error) {
    console.error("Payment success callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4001";
    res.redirect(`${frontendUrl}/payment/error?error=callback_failed`);
  }
}

export async function errorCallback(req: Request, res: Response) {
  const { order_invoice_number, error_message } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4001";

  const sanitizedOrderId = String(order_invoice_number || "").replace(
    /[^a-zA-Z0-9-_]/g,
    ""
  );
  const allowedErrors = [
    "payment_failed",
    "cancelled",
    "timeout",
    "invalid_amount",
    "declined",
  ];
  const errorCode = allowedErrors.includes(String(error_message))
    ? String(error_message)
    : "payment_failed";

  logPaymentEvent("PAYMENT_ERROR_CALLBACK", {
    orderId: sanitizedOrderId,
    error: errorCode,
  });

  res.redirect(
    `${frontendUrl}/payment/error?orderId=${encodeURIComponent(sanitizedOrderId)}&error=${encodeURIComponent(errorCode)}`
  );
}

export async function cancelCallback(req: Request, res: Response) {
  const { order_invoice_number } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4001";

  logPaymentEvent("PAYMENT_CANCELLED", {
    orderId: order_invoice_number,
  });

  res.redirect(
    `${frontendUrl}/payment/cancel?orderId=${order_invoice_number}`
  );
}

export async function webhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-sepay-signature"] as string;
    const payload = req.body;

    if (!signature) {
      logSecurityEvent("MISSING_WEBHOOK_SIGNATURE", {
        ip: req.ip,
        payload: JSON.stringify(payload).substring(0, 500),
      });
      return res.status(401).json({ error: "Missing signature" });
    }

    if (!sepayService.verifyWebhookSignature(payload, signature)) {
      logSecurityEvent("INVALID_WEBHOOK_SIGNATURE", {
        ip: req.ip,
        signature: signature.substring(0, 20) + "...",
      });
      return res.status(401).json({ error: "Invalid signature" });
    }

    await sepayService.processWebhook(payload);
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      success: false,
      error: "Webhook processing failed",
    });
  }
}

/** API tạo mã đơn và transaction (gọi khi khách bấm Thanh toán Mcoin/QR, trước bước xác nhận). */
export async function createCodes(req: Request, res: Response) {
  try {
    const user = (req as Request & { user?: ReqUser }).user;
    if (!user?.userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const itemCount = Math.max(1, Math.min(100, parseInt(String(req.body.itemCount), 10) || 1));
    const idOrderPrefix = (req.body.idOrderPrefix as "MAVL" | "MAVC" | "MAVK") || "MAVL";
    const { orderIds, transactionId } = await createPaymentCodes(itemCount, idOrderPrefix);
    return res.json({ success: true, data: { orderIds, transactionId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(400).json({ success: false, error: message });
  }
}

export function health(_req: Request, res: Response) {
  res.json({
    success: true,
    configured: sepayService.isConfigured(),
  });
}
