# 🏦 SePay Payment Gateway - Tài liệu tích hợp

> Tài liệu hướng dẫn tích hợp cổng thanh toán SePay cho Mavryk Technology

---

## 📋 Mục lục

1. [Tổng quan](#-tổng-quan)
2. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
3. [Cài đặt & Cấu hình](#-cài-đặt--cấu-hình)
4. [API Reference](#-api-reference)
5. [IPN Webhook](#-ipn-webhook)
6. [Frontend Integration](#-frontend-integration)
7. [Testing](#-testing)
8. [Production Deployment](#-production-deployment)
9. [Troubleshooting](#-troubleshooting)

---

## 📖 Tổng quan

### SePay là gì?

SePay là cổng thanh toán trung gian kết nối website/ứng dụng với các ngân hàng và tổ chức thanh toán. SePay xử lý các giao dịch thanh toán trực tuyến một cách an toàn.

### Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| **QR Banking** | Thanh toán qua quét mã QR chuyển khoản ngân hàng |
| **NAPAS QR** | Thanh toán qua mã QR NAPAS (liên ngân hàng) |
| **Card Payment** | Thanh toán qua thẻ tín dụng/ghi nợ (VISA, Mastercard) |
| **IPN Webhook** | Nhận thông báo realtime khi giao dịch thay đổi trạng thái |
| **Sandbox** | Môi trường test không mất tiền thật |

### Phương thức thanh toán hỗ trợ

```
┌─────────────────────────────────────────────────────────┐
│                    SePay Gateway                         │
├─────────────────┬─────────────────┬─────────────────────┤
│   QR Banking    │    NAPAS QR     │    Card Payment     │
│  (Chuyển khoản) │  (Liên ngân hàng)│  (VISA/Mastercard) │
└─────────────────┴─────────────────┴─────────────────────┘
```

---

## 🏗 Kiến trúc hệ thống

### Luồng thanh toán

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Server  │────▶│  SePay  │────▶│   Bank   │
│ (React)  │     │ (Express)│     │ Gateway  │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ 1. Click       │                │                │
     │    "Thanh toán"│                │                │
     │───────────────▶│                │                │
     │                │ 2. Create      │                │
     │                │    Payment     │                │
     │                │───────────────▶│                │
     │                │                │                │
     │                │◀───────────────│                │
     │ 3. Redirect    │  checkoutUrl   │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ 4. User scans QR / pays         │                │
     │─────────────────────────────────────────────────▶│
     │                │                │                │
     │                │ 5. IPN Webhook │                │
     │                │◀───────────────│                │
     │                │    (payment    │                │
     │                │     success)   │                │
     │                │                │                │
     │ 6. Redirect to │                │                │
     │    success_url │                │                │
     │◀───────────────────────────────│                │
     │                │                │                │
```

### Files trong project

```
apps/server/
├── src/
│   ├── services/
│   │   └── sepay.service.ts      # SePay SDK wrapper
│   ├── routes/
│   │   └── payment.route.ts      # Payment API endpoints
│   └── utils/
│       └── logger.ts             # Payment event logging
├── docs/payment/
│   └── SEPAY_SETUP.md            # This file
└── .env                          # Environment variables
```

---

## ⚙ Cài đặt & Cấu hình

### Bước 1: Đăng ký tài khoản SePay

#### Sandbox (Test)
1. Truy cập: https://my.dev.sepay.vn/register
2. Điền thông tin đăng ký
3. Xác thực email
4. Đăng nhập Dashboard

#### Production (Live)
1. Truy cập: https://my.sepay.vn/register
2. Đăng ký với thông tin doanh nghiệp
3. Xác minh danh tính (KYC)
4. Liên kết tài khoản ngân hàng

### Bước 2: Kích hoạt Payment Gateway

1. Đăng nhập SePay Dashboard
2. Vào mục **"Payment Gateway"** → **"Đăng ký"**
3. Chọn **"Thanh toán QR chuyển khoản"** → **"Bắt đầu"**
4. Chọn SDK: **NodeJS**
5. Copy **MERCHANT ID** và **SECRET KEY**

![Integration Info](https://developer.sepay.vn/_next/image?url=%2Fimages%2Fquick_start%2Fstep_1_10.png&w=1080&q=75)

### Bước 3: Cấu hình Environment Variables

```bash
# apps/server/.env

# SePay Configuration
SEPAY_ENV=sandbox                           # sandbox | production
SEPAY_MERCHANT_ID=SP-TEST-MS275B87          # Your Merchant ID
SEPAY_SECRET_KEY=spsk_test_xxxxxxxxxxxxx    # Your Secret Key

# Callback URLs
SEPAY_SUCCESS_URL=https://mavrykpremium.com/payment/success
SEPAY_ERROR_URL=https://mavrykpremium.com/payment/error
SEPAY_CANCEL_URL=https://mavrykpremium.com/payment/cancel
```

### Bước 4: Cài đặt SDK

```bash
# SDK đã được cài sẵn trong project
npm install sepay-pg-node
```

### Bước 5: Verify Installation

```bash
# Restart server
npm run dev

# Check health endpoint
curl http://localhost:4000/api/payment/health

# Expected response:
{
  "success": true,
  "configured": true,
  "env": "sandbox"
}
```

---

## 📡 API Reference

### Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:4000/api/payment` |
| Production | `https://api.mavrykpremium.com/api/payment` |

### Endpoints

#### 1. Health Check

Kiểm tra trạng thái cấu hình SePay.

```http
GET /api/payment/health
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "env": "sandbox"
}
```

---

#### 2. Create Payment

Tạo giao dịch thanh toán mới.

```http
POST /api/payment/create
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "ORD-20250131-001",
  "amount": 150000,
  "description": "Thanh toán đơn hàng ChatGPT Plus",
  "customerEmail": "user@example.com",
  "customerPhone": "0901234567"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://pay.dev.sepay.vn/checkout/...",
    "orderId": "ORD-20250131-001",
    "amount": 150000,
    "formFields": { ... }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Payment service not configured"
}
```

---

#### 3. Get Payment Status

Kiểm tra trạng thái thanh toán của đơn hàng.

```http
GET /api/payment/status/:orderId
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "PAID",
    "transactionId": "TXN123456",
    "paidAt": "2025-01-31T10:30:00Z"
  }
}
```

**Payment Status Values:**

| Status | Mô tả |
|--------|-------|
| `PENDING` | Đang chờ thanh toán |
| `PAID` | Đã thanh toán thành công |
| `FAILED` | Thanh toán thất bại |
| `CANCELLED` | Đã hủy |

---

#### 4. Payment Return (Callback)

SePay redirect về các URL này sau khi thanh toán.

```http
GET /api/payment/return?orderId=xxx&status=success&signature=xxx
```

---

#### 5. Webhook (IPN)

SePay gửi thông báo khi giao dịch thay đổi trạng thái.

```http
POST /api/payment/webhook
X-SePay-Signature: <signature>
Content-Type: application/json
```

---

## 🔔 IPN Webhook

### IPN là gì?

IPN (Instant Payment Notification) là endpoint trên server nhận thông báo realtime từ SePay khi giao dịch thay đổi trạng thái.

### Cấu hình IPN

1. Vào SePay Dashboard → **Payment Gateway** → **Cài đặt**
2. Nhập IPN URL: `https://api.mavrykpremium.com/api/payment/webhook`
3. Lưu cấu hình

![IPN Config](https://developer.sepay.vn/_next/image?url=%2Fimages%2Fquick_start%2Fstep_1_4.png&w=1080&q=75)

### IPN Payload

Khi giao dịch thành công, SePay gửi JSON:

```json
{
  "timestamp": 1759134682,
  "notification_type": "ORDER_PAID",
  "order": {
    "id": "e2c195be-c721-47eb-b323-99ab24e52d85",
    "order_id": "NQD-68DA43D73C1A5",
    "order_status": "CAPTURED",
    "order_currency": "VND",
    "order_amount": "100000.00",
    "order_invoice_number": "ORD-20250131-001",
    "order_description": "Thanh toán đơn hàng"
  },
  "transaction": {
    "id": "384c66dd-41e6-4316-a544-b4141682595c",
    "payment_method": "BANK_TRANSFER",
    "transaction_id": "68da43da2d9de",
    "transaction_type": "PAYMENT",
    "transaction_date": "2025-01-31 15:31:22",
    "transaction_status": "APPROVED",
    "transaction_amount": "100000",
    "transaction_currency": "VND"
  }
}
```

### Notification Types

| Type | Mô tả |
|------|-------|
| `ORDER_PAID` | Đơn hàng đã thanh toán thành công |
| `ORDER_FAILED` | Thanh toán thất bại |
| `ORDER_CANCELLED` | Đơn hàng đã hủy |

### Verify Signature

```typescript
// Server-side verification
import crypto from 'crypto';

function verifyWebhookSignature(payload: any, signature: string): boolean {
  const data = JSON.stringify(payload);
  const hash = crypto
    .createHmac('sha256', process.env.SEPAY_SECRET_KEY!)
    .update(data)
    .digest('hex');
  
  return hash === signature;
}
```

### IPN Response

Server phải trả về status 200 để xác nhận đã nhận:

```json
{
  "success": true
}
```

---

## 🖥 Frontend Integration

### Tạo thanh toán từ Cart

```typescript
// CartPage.tsx - handleConfirmPayment

const handleConfirmPayment = async () => {
  try {
    // 1. Call API to create payment
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        orderId: `ORD-${Date.now()}`,
        amount: total,
        description: `Thanh toán đơn hàng - ${cartItems.map(i => i.name).join(', ')}`,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // 2. Redirect to SePay checkout
      window.location.href = data.data.checkoutUrl;
    } else {
      toast.error(data.error || 'Không thể tạo thanh toán');
    }
  } catch (error) {
    toast.error('Lỗi kết nối server');
  }
};
```

### Trang Payment Success

```typescript
// pages/payment/success.tsx

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="text-center py-16">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h1 className="text-2xl font-bold mt-4">Thanh toán thành công!</h1>
      <p className="text-gray-500 mt-2">Mã đơn hàng: {orderId}</p>
      <Link href="/" className="btn-primary mt-6">
        Về trang chủ
      </Link>
    </div>
  );
}
```

### Trang Payment Error

```typescript
// pages/payment/error.tsx

export default function PaymentError() {
  return (
    <div className="text-center py-16">
      <XCircle className="w-16 h-16 text-red-500 mx-auto" />
      <h1 className="text-2xl font-bold mt-4">Thanh toán thất bại</h1>
      <p className="text-gray-500 mt-2">Vui lòng thử lại hoặc chọn phương thức khác</p>
      <Link href="/cart" className="btn-primary mt-6">
        Quay lại giỏ hàng
      </Link>
    </div>
  );
}
```

---

## 🧪 Testing

### Test trên Sandbox

1. **Tạo thanh toán test:**
```bash
curl -X POST http://localhost:4000/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "orderId": "TEST-001",
    "amount": 10000,
    "description": "Test payment"
  }'
```

2. **Mở checkoutUrl trong browser**

3. **Quét mã QR với app ngân hàng (Sandbox)**

4. **Kiểm tra IPN callback** trong server logs

### Test Webhook với ngrok

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Expose local server
ngrok http 4000

# 3. Copy HTTPS URL (e.g., https://abc123.ngrok.io)

# 4. Update IPN URL in SePay Dashboard:
#    https://abc123.ngrok.io/api/payment/webhook

# 5. Test payment and check webhook logs
```

### Giả lập giao dịch (Sandbox)

SePay cung cấp tool giả lập giao dịch:
- Truy cập: https://my.dev.sepay.vn/tools/simulate
- Nhập orderId và amount
- Click "Giả lập thanh toán"
- Webhook sẽ được gửi đến IPN URL

---

## 🚀 Production Deployment

### Checklist trước khi go-live

- [ ] Đăng ký tài khoản SePay Production
- [ ] Xác minh danh tính (KYC)
- [ ] Liên kết tài khoản ngân hàng thật
- [ ] Lấy Production credentials
- [ ] Cập nhật .env với key production
- [ ] Cập nhật callback URLs (HTTPS)
- [ ] Cấu hình IPN URL production
- [ ] Test end-to-end trên production
- [ ] Enable HTTPS cho tất cả endpoints

### Cập nhật Environment

```bash
# apps/server/.env (Production)

SEPAY_ENV=production
SEPAY_MERCHANT_ID=<production-merchant-id>
SEPAY_SECRET_KEY=<production-secret-key>

SEPAY_SUCCESS_URL=https://mavrykpremium.com/payment/success
SEPAY_ERROR_URL=https://mavrykpremium.com/payment/error
SEPAY_CANCEL_URL=https://mavrykpremium.com/payment/cancel
```

### Endpoints Production

| Môi trường | Checkout URL |
|------------|--------------|
| Sandbox | `https://pay.dev.sepay.vn/v1/checkout/init` |
| Production | `https://pay.sepay.vn/v1/checkout/init` |

---

## 🐛 Troubleshooting

### Error: "Payment service not configured"

**Nguyên nhân:** Thiếu SEPAY_MERCHANT_ID hoặc SEPAY_SECRET_KEY

**Giải pháp:**
```bash
# Check .env
cat apps/server/.env | grep SEPAY

# Verify health
curl http://localhost:4000/api/payment/health
```

### Error: "Invalid signature"

**Nguyên nhân:** SECRET_KEY không khớp hoặc payload bị thay đổi

**Giải pháp:**
1. Kiểm tra SECRET_KEY trong .env
2. So sánh với key trong SePay Dashboard
3. Kiểm tra logs: `logs/security-*.log`

### Webhook không nhận được

**Nguyên nhân:** IPN URL không accessible từ internet

**Giải pháp:**
1. Dùng ngrok cho local testing
2. Kiểm tra firewall/security group
3. Verify IPN URL trong SePay Dashboard
4. Check server logs cho incoming requests

### Checkout URL không hoạt động

**Nguyên nhân:** 
- SEPAY_ENV không đúng
- Tài khoản chưa được kích hoạt

**Giải pháp:**
1. Kiểm tra `SEPAY_ENV=sandbox` cho testing
2. Đăng nhập SePay Dashboard kiểm tra trạng thái
3. Liên hệ support@sepay.vn

---

## 📚 Tài liệu tham khảo

| Resource | URL |
|----------|-----|
| SePay Developer Docs | https://developer.sepay.vn/vi |
| SePay Dashboard (Sandbox) | https://my.dev.sepay.vn |
| SePay Dashboard (Production) | https://my.sepay.vn |
| NodeJS SDK | https://www.npmjs.com/package/sepay-pg-node |
| Support Email | support@sepay.vn |

---

## ✅ Status

| Component | Status |
|-----------|--------|
| SePay Service | ✅ Implemented |
| Payment Routes | ✅ Implemented |
| Webhook Handler | ✅ Implemented |
| Signature Verification | ✅ Implemented |
| Logging | ✅ Implemented |
| Frontend Integration | 🔄 In Progress |
| Production Deploy | ⏳ Pending |

---

## 💻 Implementation Details

### Source Code: sepay.service.ts

```typescript
// apps/server/src/services/sepay.service.ts

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
```

---

### Source Code: payment.route.ts

```typescript
// apps/server/src/routes/payment.route.ts

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

    // SECURITY: Only log safe fields, not full params
    logPaymentEvent('PAYMENT_SUCCESS_CALLBACK', {
      orderId: sanitizedOrderId,
      status: 'success',
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
        payload: JSON.stringify(payload).substring(0, 500),
      });
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Verify signature
    if (!sepayService.verifyWebhookSignature(payload, signature)) {
      logSecurityEvent('INVALID_WEBHOOK_SIGNATURE', {
        ip: req.ip,
        signature: signature.substring(0, 20) + '...',
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
  });
});

export default router;
```

---

## 🗄️ Database Schema

### Bảng Orders (Đơn hàng)

```sql
-- Prisma schema
model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique @map("order_number")
  userId          Int         @map("user_id")
  
  // Order details
  subtotal        Decimal     @db.Decimal(12, 2)
  discount        Decimal     @default(0) @db.Decimal(12, 2)
  total           Decimal     @db.Decimal(12, 2)
  currency        String      @default("VND") @db.VarChar(3)
  
  // Status
  status          OrderStatus @default(PENDING)
  
  // Payment info
  paymentMethod   String?     @map("payment_method")
  transactionId   String?     @map("transaction_id")
  paidAt          DateTime?   @map("paid_at")
  
  // Timestamps
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  
  // Relations
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
  payment         Payment?
  
  @@map("orders")
}

enum OrderStatus {
  PENDING       // Chờ thanh toán
  PROCESSING    // Đang xử lý
  PAID          // Đã thanh toán
  SHIPPED       // Đã giao
  COMPLETED     // Hoàn thành
  CANCELLED     // Đã hủy
  REFUNDED      // Đã hoàn tiền
}
```

### Bảng OrderItems (Chi tiết đơn hàng)

```sql
model OrderItem {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  productId   Int      @map("product_id")
  
  // Item details
  name        String
  price       Decimal  @db.Decimal(12, 2)
  quantity    Int
  total       Decimal  @db.Decimal(12, 2)
  
  // Snapshot (in case product changes)
  metadata    Json?
  
  // Relations
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])
  
  @@map("order_items")
}
```

### Bảng Payments (Thanh toán)

```sql
model Payment {
  id              String        @id @default(uuid())
  orderId         String        @unique @map("order_id")
  
  // SePay info
  sepayOrderId    String?       @unique @map("sepay_order_id")
  transactionId   String?       @map("transaction_id")
  
  // Amount
  amount          Decimal       @db.Decimal(12, 2)
  currency        String        @default("VND") @db.VarChar(3)
  
  // Status
  status          PaymentStatus @default(PENDING)
  paymentMethod   String?       @map("payment_method")
  
  // Timestamps
  createdAt       DateTime      @default(now()) @map("created_at")
  paidAt          DateTime?     @map("paid_at")
  
  // Webhook data
  webhookPayload  Json?         @map("webhook_payload")
  
  // Relations
  order           Order         @relation(fields: [orderId], references: [id])
  
  @@map("payments")
}

enum PaymentStatus {
  PENDING     // Chờ thanh toán
  PROCESSING  // Đang xử lý
  PAID        // Đã thanh toán
  FAILED      // Thất bại
  CANCELLED   // Đã hủy
  REFUNDED    // Đã hoàn tiền
}
```

### SQL Migration

```sql
-- Create tables (PostgreSQL)

-- Orders table
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  subtotal DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  
  status VARCHAR(20) DEFAULT 'PENDING',
  
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  
  metadata JSONB
);

-- Payments table
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(36) UNIQUE NOT NULL REFERENCES orders(id),
  
  sepay_order_id VARCHAR(100) UNIQUE,
  transaction_id VARCHAR(100),
  
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  
  status VARCHAR(20) DEFAULT 'PENDING',
  payment_method VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  
  webhook_payload JSONB
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_sepay_order_id ON payments(sepay_order_id);
```

---

## ⚠️ Error Codes

### SePay Error Codes

| Code | Mô tả | Xử lý |
|------|-------|-------|
| `INVALID_MERCHANT` | Merchant ID không hợp lệ | Kiểm tra SEPAY_MERCHANT_ID |
| `INVALID_SIGNATURE` | Chữ ký không hợp lệ | Kiểm tra SEPAY_SECRET_KEY |
| `INVALID_AMOUNT` | Số tiền không hợp lệ | Amount phải > 0 và là số nguyên |
| `INVALID_CURRENCY` | Loại tiền không hợp lệ | Chỉ hỗ trợ VND |
| `DUPLICATE_ORDER` | Order ID đã tồn tại | Sử dụng order ID khác |
| `MERCHANT_NOT_ACTIVE` | Tài khoản merchant chưa kích hoạt | Liên hệ SePay support |
| `PAYMENT_EXPIRED` | Giao dịch hết hạn | Tạo giao dịch mới |
| `PAYMENT_CANCELLED` | Người dùng hủy thanh toán | Thông báo và cho phép thử lại |
| `INSUFFICIENT_BALANCE` | Số dư không đủ | Yêu cầu nạp tiền |
| `BANK_ERROR` | Lỗi từ ngân hàng | Thử lại sau |

### HTTP Status Codes

| Status | Mô tả | Response |
|--------|-------|----------|
| `200` | Thành công | `{ success: true, data: {...} }` |
| `400` | Bad Request | `{ success: false, error: "Invalid input" }` |
| `401` | Unauthorized | `{ success: false, error: "Invalid signature" }` |
| `403` | Forbidden | `{ success: false, error: "Access denied" }` |
| `404` | Not Found | `{ success: false, error: "Order not found" }` |
| `500` | Server Error | `{ success: false, error: "Internal error" }` |
| `503` | Service Unavailable | `{ success: false, error: "Payment service not configured" }` |

### Webhook Response

| Status | Ý nghĩa |
|--------|---------|
| `200` | Đã nhận và xử lý thành công |
| `401` | Signature không hợp lệ - SePay sẽ retry |
| `500` | Server error - SePay sẽ retry |

> **Note:** SePay sẽ retry webhook tối đa 5 lần nếu không nhận được status 200.

---

## 🔐 Security Best Practices

### 1. Bảo vệ Secret Key

```bash
# ❌ KHÔNG làm
SEPAY_SECRET_KEY=spsk_live_abc123  # Hardcode trong code
console.log(SEPAY_SECRET_KEY);      # Log secret key

# ✅ NÊN làm
- Lưu trong .env (không commit)
- Sử dụng secrets manager (AWS, GCP, Azure)
- Rotate key định kỳ
```

### 2. Validate Webhook

```typescript
// ✅ LUÔN verify signature
if (!sepayService.verifyWebhookSignature(payload, signature)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// ✅ Validate payload structure
if (!payload.order_invoice_number || !payload.payment_status) {
  return res.status(400).json({ error: 'Invalid payload' });
}
```

### 3. Idempotency

```typescript
// ✅ Check if already processed
const existingPayment = await prisma.payment.findUnique({
  where: { transactionId: payload.transaction_id }
});

if (existingPayment) {
  return res.json({ success: true, message: 'Already processed' });
}
```

### 4. Logging

```typescript
// ✅ Log important events (without sensitive data)
logPaymentEvent('PAYMENT_CONFIRMED', {
  orderId: order.id,
  amount: order.amount,
  // ❌ KHÔNG log: card number, CVV, secrets
});
```

---

*Last updated: 2025-01-31*
*Version: 1.1.0*
