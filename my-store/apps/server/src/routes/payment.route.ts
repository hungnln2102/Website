import express from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validationRules, handleValidationErrors } from '../utils/validation';
import { sepayService } from '../services/sepay.service';
import { logPaymentEvent, logSecurityEvent } from '../utils/logger';

const router = express.Router();

/**
 * Create payment checkout
 * POST /api/payment/create
 */
router.post(
  '/create',
  authenticate,
  [
    validationRules.amount(),
    validationRules.orderId(),
    validationRules.optionalString('description', 255),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      // Check if SePay is configured
      if (!sepayService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'Payment service not configured',
          message: 'Please contact administrator',
        });
      }

      const { orderId, amount, description } = req.body;
      const user = (req as any).user;

      // Create payment
      const payment = await sepayService.createPayment({
        orderId,
        amount,
        description: description || `Thanh toán đơn hàng ${orderId}`,
        customerEmail: user?.email,
      });

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Get payment status
 * GET /api/payment/status/:orderId
 */
router.get(
  '/status/:orderId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const status = await sepayService.getPaymentStatus(orderId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check payment status',
      });
    }
  }
);

/**
 * Payment success callback
 * GET /api/payment/success
 */
router.get('/success', async (req: Request, res: Response) => {
  try {
    const params = req.query;

    // Verify signature if present
    if (params.signature) {
      const isValid = sepayService.verifyReturnUrl(params);

      if (!isValid) {
        logSecurityEvent('INVALID_PAYMENT_SIGNATURE', { params });
        return res.redirect(`${process.env.FRONTEND_URL}/payment/error?error=invalid_signature`);
      }
    }

    const { order_invoice_number } = params;

    logPaymentEvent('PAYMENT_SUCCESS_CALLBACK', {
      orderId: order_invoice_number,
      params,
    });

    // Redirect to frontend success page
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?orderId=${order_invoice_number}`
    );
  } catch (error) {
    console.error('Payment success callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error?error=callback_failed`);
  }
});

/**
 * Payment error callback
 * GET /api/payment/error
 */
router.get('/error', async (req: Request, res: Response) => {
  const { order_invoice_number, error_message } = req.query;

  logPaymentEvent('PAYMENT_ERROR_CALLBACK', {
    orderId: order_invoice_number,
    error: error_message,
  });

  res.redirect(
    `${process.env.FRONTEND_URL}/payment/error?orderId=${order_invoice_number}&error=${error_message || 'payment_failed'}`
  );
});

/**
 * Payment cancel callback
 * GET /api/payment/cancel
 */
router.get('/cancel', async (req: Request, res: Response) => {
  const { order_invoice_number } = req.query;

  logPaymentEvent('PAYMENT_CANCELLED', {
    orderId: order_invoice_number,
  });

  res.redirect(
    `${process.env.FRONTEND_URL}/payment/cancel?orderId=${order_invoice_number}`
  );
});

/**
 * SePay webhook endpoint
 * POST /api/payment/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-sepay-signature'] as string;
    const payload = req.body;

    // Verify signature
    if (signature && !sepayService.verifyWebhookSignature(payload, signature)) {
      logSecurityEvent('INVALID_WEBHOOK_SIGNATURE', {
        signature,
        payload,
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    await sepayService.processWebhook(payload);

    // Respond to SePay
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Webhook processing failed' 
    });
  }
});

/**
 * Health check endpoint
 * GET /api/payment/health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    configured: sepayService.isConfigured(),
    env: process.env.SEPAY_ENV || 'not_set',
  });
});

export default router;
