import express from 'express';
import type { Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
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
  optionalAuth, // Allow guest checkout - user info is optional
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
 * SECURITY: Always verify signature to prevent forged callbacks
 */
router.get('/success', async (req: Request, res: Response) => {
  try {
    const params = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4001';

    // SECURITY: Always require and verify signature
    if (!params.signature) {
      logSecurityEvent('MISSING_PAYMENT_SIGNATURE', { params });
      return res.redirect(`${frontendUrl}/payment/error?error=missing_signature`);
    }

    const isValid = sepayService.verifyReturnUrl(params);
    if (!isValid) {
      logSecurityEvent('INVALID_PAYMENT_SIGNATURE', { params });
      return res.redirect(`${frontendUrl}/payment/error?error=invalid_signature`);
    }

    const { order_invoice_number } = params;

    // Sanitize orderId to prevent injection
    const sanitizedOrderId = String(order_invoice_number || '').replace(/[^a-zA-Z0-9-_]/g, '');

    // SECURITY: Only log safe fields, not full params (may contain sensitive payment data)
    logPaymentEvent('PAYMENT_SUCCESS_CALLBACK', {
      orderId: sanitizedOrderId,
      status: 'success',
      // Don't log: params - may contain sensitive payment gateway data
    });

    // Redirect to frontend success page
    res.redirect(
      `${frontendUrl}/payment/success?orderId=${encodeURIComponent(sanitizedOrderId)}`
    );
  } catch (error) {
    console.error('Payment success callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4001';
    res.redirect(`${frontendUrl}/payment/error?error=callback_failed`);
  }
});

/**
 * Payment error callback
 * GET /api/payment/error
 * SECURITY: Sanitize all parameters to prevent injection
 */
router.get('/error', async (req: Request, res: Response) => {
  const { order_invoice_number, error_message } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4001';

  // Sanitize parameters
  const sanitizedOrderId = String(order_invoice_number || '').replace(/[^a-zA-Z0-9-_]/g, '');
  
  // Whitelist allowed error codes to prevent XSS
  const allowedErrors = ['payment_failed', 'cancelled', 'timeout', 'invalid_amount', 'declined'];
  const errorCode = allowedErrors.includes(String(error_message)) 
    ? String(error_message) 
    : 'payment_failed';

  logPaymentEvent('PAYMENT_ERROR_CALLBACK', {
    orderId: sanitizedOrderId,
    error: errorCode,
  });

  res.redirect(
    `${frontendUrl}/payment/error?orderId=${encodeURIComponent(sanitizedOrderId)}&error=${encodeURIComponent(errorCode)}`
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
 * SECURITY: Always require and verify signature
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-sepay-signature'] as string;
    const payload = req.body;

    // SECURITY: Always require signature - reject if missing
    if (!signature) {
      logSecurityEvent('MISSING_WEBHOOK_SIGNATURE', {
        ip: req.ip,
        payload: JSON.stringify(payload).substring(0, 500), // Log truncated for security
      });
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Verify signature
    if (!sepayService.verifyWebhookSignature(payload, signature)) {
      logSecurityEvent('INVALID_WEBHOOK_SIGNATURE', {
        ip: req.ip,
        signature: signature.substring(0, 20) + '...', // Log partial for debugging
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
 * SECURITY: Don't expose environment details
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    configured: sepayService.isConfigured(),
    // SECURITY: Removed env exposure
  });
});

export default router;
