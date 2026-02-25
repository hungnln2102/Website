import { SePayPgClient } from 'sepay-pg-node';
import { logPaymentEvent, logSecurityEvent } from '../utils/logger';
import crypto from 'crypto';
import pool from '../config/database';
import { DB_SCHEMA } from '../config/db.config';

const SEPAY_ENV = (process.env.SEPAY_ENV || 'sandbox') as 'sandbox' | 'production';
const SEPAY_MERCHANT_ID = process.env.SEPAY_MERCHANT_ID || '';
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY || '';
const SEPAY_SUCCESS_URL = process.env.SEPAY_SUCCESS_URL || 'http://localhost:4001/payment/success';
const SEPAY_ERROR_URL = process.env.SEPAY_ERROR_URL || 'http://localhost:4001/payment/error';
const SEPAY_CANCEL_URL = process.env.SEPAY_CANCEL_URL || 'http://localhost:4001/payment/cancel';

// Initialize SePay client
let client: SePayPgClient | null = null;

try {
  if (SEPAY_MERCHANT_ID && SEPAY_SECRET_KEY) {
    client = new SePayPgClient({
      env: SEPAY_ENV,
      merchant_id: SEPAY_MERCHANT_ID,
      secret_key: SEPAY_SECRET_KEY,
    });
  } else {
    console.warn('SePay credentials not configured. Payment features will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize SePay client:', error);
}

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentResponse {
  checkoutUrl: string;
  orderId: string;
  amount: number;
  formFields?: any;
}

export interface WebhookPayload {
  order_invoice_number: string;
  order_amount: number;
  payment_status: string;
  transaction_id?: string;
  payment_time?: string;
}

export class SepayService {
  /**
   * Check if SePay is configured
   */
  isConfigured(): boolean {
    return client !== null;
  }

  /**
   * Create payment checkout URL
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    if (!client) {
      throw new Error('SePay client not configured. Please set SEPAY_MERCHANT_ID and SEPAY_SECRET_KEY in .env');
    }

    const { orderId, amount, description, customerEmail, customerPhone } = params;

    try {
      // Generate checkout URL
      const checkoutURL = client.checkout.initCheckoutUrl();

      // Prepare checkout form fields
      const checkoutFormFields = client.checkout.initOneTimePaymentFields({
        payment_method: 'BANK_TRANSFER',
        order_invoice_number: orderId,
        order_amount: amount,
        currency: 'VND',
        order_description: description,
        success_url: SEPAY_SUCCESS_URL,
        error_url: SEPAY_ERROR_URL,
        cancel_url: SEPAY_CANCEL_URL,
        // Optional customer info
        ...(customerEmail && { buyer_email: customerEmail }),
        ...(customerPhone && { buyer_phone: customerPhone }),
      });

      // Log payment creation
      logPaymentEvent('PAYMENT_CREATED', {
        orderId,
        amount,
        description,
        checkoutURL,
        env: SEPAY_ENV,
      });

      return {
        checkoutUrl: checkoutURL,
        orderId,
        amount,
        formFields: checkoutFormFields,
      };
    } catch (error) {
      console.error('SePay payment creation error:', error);
      logPaymentEvent('PAYMENT_CREATION_FAILED', {
        orderId,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to create payment');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      if (!SEPAY_SECRET_KEY) {
        console.error('SEPAY_SECRET_KEY not configured');
        return false;
      }

      // Create signature from payload
      const data = JSON.stringify(payload);
      const hash = crypto
        .createHmac('sha256', SEPAY_SECRET_KEY)
        .update(data)
        .digest('hex');

      const isValid = hash === signature;

      if (!isValid) {
        logSecurityEvent('INVALID_WEBHOOK_SIGNATURE', {
          expected: hash,
          received: signature,
          payload,
        });
      }

      return isValid;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    const {
      order_invoice_number,
      order_amount,
      payment_status,
      transaction_id,
      payment_time,
    } = payload;

    // Log webhook received
    logPaymentEvent('WEBHOOK_RECEIVED', {
      orderId: order_invoice_number,
      amount: order_amount,
      status: payment_status,
      transactionId: transaction_id,
      paymentTime: payment_time,
    });

    if (payment_status === 'SUCCESS' || payment_status === 'PAID') {
      const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
      const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
      const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
      const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
      const txIdCol = COLS_WT.TRANSACTION_ID;
      const paymentIdCol = COLS_OC.PAYMENT_ID;

      const ocResult = await pool.query(
        `SELECT account_id, ${paymentIdCol} FROM ${ORDER_CUSTOMER_TABLE} WHERE id_order = $1 LIMIT 1`,
        [order_invoice_number]
      );

      if (ocResult.rows.length > 0) {
        const accountId = parseInt(String(ocResult.rows[0].account_id), 10);
        const paymentId = ocResult.rows[0][paymentIdCol] as string | null;
        await pool.query(
          `UPDATE ${ORDER_CUSTOMER_TABLE} SET status = 'paid', updated_at = NOW() WHERE id_order = $1`,
          [order_invoice_number]
        );

        const useTxId = paymentId ?? `TX${accountId}${Date.now().toString(36).toUpperCase()}SEPAY`;
        const existingTx = await pool.query(
          `SELECT id FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1 AND account_id = $2 LIMIT 1`,
          [useTxId, accountId]
        );
        if (existingTx.rows.length > 0) {
          await pool.query(
            `UPDATE ${WALLET_TX_TABLE} SET amount = $1 WHERE ${txIdCol} = $2 AND account_id = $3`,
            [order_amount, useTxId, accountId]
          );
        } else {
          if (!paymentId) {
            await pool.query(
              `UPDATE ${ORDER_CUSTOMER_TABLE} SET ${paymentIdCol} = $1, updated_at = NOW() WHERE id_order = $2`,
              [useTxId, order_invoice_number]
            );
          }
          await pool.query(
            `INSERT INTO ${WALLET_TX_TABLE}
             (${txIdCol}, account_id, type, direction, amount, balance_before, balance_after, method, created_at)
             VALUES ($1, $2, 'PURCHASE', 'DEBIT', $3, 0, 0, 'BANK_TRANSFER', NOW())`,
            [useTxId, accountId, order_amount]
          );
        }
      }

      logPaymentEvent('PAYMENT_CONFIRMED', {
        orderId: order_invoice_number,
        amount: order_amount,
        transactionId: transaction_id,
      });

      console.log(`✅ Payment confirmed for order ${order_invoice_number}`);
    } else if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
      // TODO: Update order status in database
      // await prisma.order.update({
      //   where: { id: order_invoice_number },
      //   data: { status: 'FAILED' },
      // });

      logPaymentEvent('PAYMENT_FAILED', {
        orderId: order_invoice_number,
        status: payment_status,
      });

      console.log(`❌ Payment failed for order ${order_invoice_number}`);
    }
  }

  /**
   * Verify return URL parameters
   */
  verifyReturnUrl(params: any): boolean {
    const { signature, ...data } = params;
    
    if (!signature) {
      logSecurityEvent('MISSING_RETURN_URL_SIGNATURE', { params });
      return false;
    }

    return this.verifyWebhookSignature(data, signature);
  }

  /**
   * Get payment status from order ID (đọc từ DB: order_customer / wallet_transactions)
   */
  async getPaymentStatus(orderId: string): Promise<{
    status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
    transactionId?: string;
    paidAt?: Date;
  }> {
    const ORDER_CUSTOMER_TABLE = `${DB_SCHEMA.ORDER_CUSTOMER!.SCHEMA}.${DB_SCHEMA.ORDER_CUSTOMER!.TABLE}`;
    const WALLET_TX_TABLE = `${DB_SCHEMA.WALLET_TRANSACTION!.SCHEMA}.${DB_SCHEMA.WALLET_TRANSACTION!.TABLE}`;
    const COLS_WT = DB_SCHEMA.WALLET_TRANSACTION!.COLS as Record<string, string>;
    const COLS_OC = DB_SCHEMA.ORDER_CUSTOMER!.COLS as Record<string, string>;
    const txIdCol = COLS_WT.TRANSACTION_ID;
    const paymentIdCol = COLS_OC.PAYMENT_ID;

    const ocRow = await pool.query(
      `SELECT status, ${paymentIdCol} FROM ${ORDER_CUSTOMER_TABLE} WHERE id_order = $1 LIMIT 1`,
      [orderId]
    );
    if (ocRow.rows.length > 0 && ocRow.rows[0].status === 'paid') {
      const paymentId = ocRow.rows[0][paymentIdCol];
      if (paymentId) {
        const txRow = await pool.query(
          `SELECT ${txIdCol}, created_at FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1 ORDER BY created_at DESC LIMIT 1`,
          [paymentId]
        );
        return {
          status: 'PAID',
          transactionId: txRow.rows[0]?.[txIdCol],
          paidAt: txRow.rows[0]?.created_at ?? undefined,
        };
      }
      return { status: 'PAID', transactionId: paymentId };
    }

    if (ocRow.rows.length > 0 && ocRow.rows[0][paymentIdCol]) {
      const paymentId = ocRow.rows[0][paymentIdCol];
      const txRow = await pool.query(
        `SELECT ${txIdCol}, created_at FROM ${WALLET_TX_TABLE} WHERE ${txIdCol} = $1 LIMIT 1`,
        [paymentId]
      );
      if (txRow.rows.length > 0) {
        return {
          status: 'PAID',
          transactionId: txRow.rows[0][txIdCol],
          paidAt: txRow.rows[0].created_at ?? undefined,
        };
      }
    }

    return { status: 'PENDING' };
  }
}

// Export singleton
export const sepayService = new SepayService();
