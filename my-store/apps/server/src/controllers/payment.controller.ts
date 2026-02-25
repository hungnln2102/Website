/**
 * Payment request handlers – logic extracted from payment.route
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { sepayService } from "../services/sepay.service";
import { confirmBalancePayment } from "../services/balance-payment.service";
import { logPaymentEvent, logSecurityEvent } from "../utils/logger";

interface ReqUser {
  userId?: string;
  email?: string;
}

export async function createPayment(req: Request, res: Response) {
  try {
    const { orderId, amount, description } = req.body;
    const user = (req as Request & { user?: ReqUser }).user;

    // order_customer làm chuẩn; đơn không Mcoin → note thẳng vào wallet_transactions (pending)
    // Làm trước khi check SePay để đơn QR vẫn được ghi dù SePay chưa cấu hình
    if (user?.userId && orderId && amount != null && Number(amount) >= 0) {
      const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
      const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
      const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
      const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
      const txIdCol = COLS_WT.TRANSACTION_ID;
      const paymentIdCol = COLS_OC.PAYMENT_ID;
      const accountId = parseInt(user.userId, 10);
      const idOrder = String(orderId).trim();
      const amountVnd = Math.round(Number(amount));

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
    const { orderId, amount, items } = req.body;

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
      orderId: String(orderId).trim(),
      amount: Math.round(Number(amount)),
      items: (items as { id_product?: unknown; name?: unknown; variant_name?: unknown; duration?: unknown; note?: unknown; quantity?: unknown; price?: unknown }[]).map(
        (it) => ({
          id_product: String(it.id_product).trim(),
          name: it.name != null ? String(it.name).trim() : undefined,
          variant_name: it.variant_name != null ? String(it.variant_name).trim() : undefined,
          duration: it.duration != null ? String(it.duration).trim() : undefined,
          note: it.note != null ? String(it.note).trim() : undefined,
          quantity: Math.max(1, parseInt(String(it.quantity), 10) || 1),
          price: Number(it.price) || 0,
        })
      ),
    });

    res.json({ success: true, data: { newBalance: result.newBalance } });
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

/** Xác nhận đơn chuyển khoản / QR (VietQR) đã thanh toán → ghi wallet_transactions, hiển thị trong lịch sử */
export async function confirmTransfer(req: Request, res: Response) {
  try {
    const userId = (req as Request & { user: { userId: string } }).user.userId;
    const accountId = parseInt(userId, 10);
    const { orderId, amount } = req.body as { orderId?: string; amount?: number };

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
    const txIdCol = COLS_WT.TRANSACTION_ID;
    const paymentIdCol = COLS_OC.PAYMENT_ID;
    const idOrder = String(orderId).trim();
    const amountVnd = Math.round(Number(amount));

    const oc = await pool.query(
      `SELECT status, ${paymentIdCol} FROM ${ORDER_CUSTOMER_TABLE} WHERE id_order = $1 AND account_id = $2`,
      [idOrder, accountId]
    );
    if (oc.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng chờ thanh toán của bạn",
      });
    }
    if (oc.rows[0].status === "paid") {
      return res.json({
        success: true,
        message: "Đơn hàng đã được xác nhận thanh toán trước đó",
      });
    }
    const paymentId = oc.rows[0][paymentIdCol] as string | null;

    await pool.query(
      `UPDATE ${ORDER_CUSTOMER_TABLE} SET status = 'paid', updated_at = NOW() WHERE id_order = $1 AND account_id = $2`,
      [idOrder, accountId]
    );
    const useTxId = paymentId ?? `TX${accountId}${Date.now().toString(36).toUpperCase()}QR`;
    const existingTx = await pool.query(
      `SELECT id FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1 AND account_id = $2 LIMIT 1`,
      [useTxId, accountId]
    );
    if (existingTx.rows.length > 0) {
      await pool.query(
        `UPDATE ${WALLET_TX_TABLE} SET amount = $1 WHERE ${txIdCol} = $2 AND account_id = $3`,
        [amountVnd, useTxId, accountId]
      );
    } else {
      if (!paymentId) {
        await pool.query(
          `UPDATE ${ORDER_CUSTOMER_TABLE} SET ${paymentIdCol} = $1, updated_at = NOW() WHERE id_order = $2 AND account_id = $3`,
          [useTxId, idOrder, accountId]
        );
      }
      await pool.query(
        `INSERT INTO ${WALLET_TX_TABLE}
         (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, method, created_at)
         VALUES ($1, $2, 'PURCHASE', 'DEBIT', $3, 0, 0, 'BANK_TRANSFER', NOW())`,
        [useTxId, accountId, amountVnd]
      );
    }

    logPaymentEvent("TRANSFER_CONFIRMED", { orderId: idOrder, amount: amountVnd, accountId });
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

export function health(_req: Request, res: Response) {
  res.json({
    success: true,
    configured: sepayService.isConfigured(),
  });
}
