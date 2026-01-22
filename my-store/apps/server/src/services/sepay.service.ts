import { SePayPgClient } from 'sepay-pg-node';
import { logPaymentEvent, logSecurityEvent } from '../utils/logger';
import crypto from 'crypto';

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
      // TODO: Update order status in database
      // await prisma.order.update({
      //   where: { id: order_invoice_number },
      //   data: {
      //     status: 'PAID',
      //     paidAt: new Date(payment_time || Date.now()),
      //     transactionId: transaction_id,
      //   },
      // });

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
   * Get payment status from order ID
   * This is a placeholder - implement based on your database
   */
  async getPaymentStatus(orderId: string): Promise<{
    status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
    transactionId?: string;
    paidAt?: Date;
  }> {
    // TODO: Query from database
    // const payment = await prisma.payment.findUnique({
    //   where: { orderId },
    // });
    
    // For now, return pending
    return {
      status: 'PENDING',
    };
  }
}

// Export singleton
export const sepayService = new SepayService();
