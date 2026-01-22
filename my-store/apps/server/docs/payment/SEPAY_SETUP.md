# SePay Integration - Quick Setup Guide

## ✅ Đã hoàn thành

### Files Created
1. ✅ `sepay.service.ts` - SePay service với SDK
2. ✅ `payment.route.ts` - Payment API routes
3. ✅ Routes registered in `index.ts`
4. ✅ `.env` updated với SePay config

---

## 🚀 Bước tiếp theo

### 1. Đăng ký SePay Sandbox

1. Truy cập: https://my.sepay.vn/
2. Click **"Bắt đầu với Sandbox"**
3. Đăng ký tài khoản
4. Xác thực email

### 2. Lấy Credentials

1. Đăng nhập SePay Dashboard
2. Vào **Settings** → **API Keys**
3. Copy:
   - `Merchant ID`
   - `Secret Key`

### 3. Cập nhật .env

```bash
# apps/server/.env

SEPAY_ENV=sandbox
SEPAY_MERCHANT_ID=<your-merchant-id>
SEPAY_SECRET_KEY=<your-secret-key>
```

### 4. Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 5. Test API

```bash
# Check health
curl http://localhost:4000/api/payment/health

# Expected response:
# {
#   "success": true,
#   "configured": true,
#   "env": "sandbox"
# }
```

---

## 📝 API Endpoints

### Create Payment
```bash
POST /api/payment/create
Authorization: Bearer <access-token>

{
  "orderId": "ORDER123",
  "amount": 100000,
  "description": "Thanh toán đơn hàng ORDER123"
}

Response:
{
  "success": true,
  "data": {
    "checkoutUrl": "https://sandbox.sepay.vn/checkout/...",
    "orderId": "ORDER123",
    "amount": 100000
  }
}
```

### Get Payment Status
```bash
GET /api/payment/status/:orderId
Authorization: Bearer <access-token>

Response:
{
  "success": true,
  "data": {
    "status": "PENDING" | "PAID" | "FAILED" | "CANCELLED"
  }
}
```

### Health Check
```bash
GET /api/payment/health

Response:
{
  "success": true,
  "configured": true,
  "env": "sandbox"
}
```

---

## 🔔 Webhook Setup (Optional - for Production)

### Development (using ngrok)

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 4000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
```

### Configure in SePay Dashboard

1. Vào **Settings** → **Webhooks**
2. Add URL: `https://your-domain.com/api/payment/webhook`
3. Select events: `payment.success`, `payment.failed`
4. Save

---

## 🧪 Testing Flow

### 1. Create Payment

```typescript
// Frontend code
const response = await fetch('http://localhost:4000/api/payment/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    orderId: 'TEST123',
    amount: 50000,
    description: 'Test payment',
  }),
});

const data = await response.json();
console.log(data.data.checkoutUrl); // Redirect user here
```

### 2. Redirect to Checkout

```typescript
// Redirect user to SePay checkout page
window.location.href = data.data.checkoutUrl;
```

### 3. User Completes Payment

- User scans QR code
- Transfers money
- SePay confirms payment

### 4. Callback

- Success: Redirects to `http://localhost:4001/payment/success?orderId=TEST123`
- Error: Redirects to `http://localhost:4001/payment/error?orderId=TEST123`

### 5. Webhook (if configured)

- SePay sends POST to `/api/payment/webhook`
- Your server updates order status

---

## ⚠️ Important Notes

### Security

- ✅ Never expose `SEPAY_SECRET_KEY` to frontend
- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Validate all inputs

### Error Handling

- ❌ If `SEPAY_MERCHANT_ID` or `SEPAY_SECRET_KEY` not set:
  - API returns 503 "Payment service not configured"
  - Check `/api/payment/health` to verify configuration

### Callback URLs

- Must be publicly accessible (not localhost) in production
- Use ngrok for local testing
- Update in SePay Dashboard when deploying

---

## 🐛 Troubleshooting

### "Payment service not configured"

```bash
# Check .env file
cat apps/server/.env | grep SEPAY

# Should show:
# SEPAY_MERCHANT_ID=xxx
# SEPAY_SECRET_KEY=xxx
```

### "Invalid signature"

- Check `SEPAY_SECRET_KEY` matches SePay Dashboard
- Verify webhook payload format
- Check logs in `logs/security-*.log`

### Checkout URL not working

- Verify `SEPAY_ENV=sandbox` for testing
- Check SePay Dashboard for account status
- Ensure merchant account is active

---

## 📚 Next Steps

1. **Get SePay Credentials** - Đăng ký sandbox
2. **Update .env** - Add merchant ID & secret key
3. **Test API** - Use curl or Postman
4. **Build Frontend** - Create payment UI
5. **Test End-to-End** - Complete payment flow
6. **Production** - Switch to production credentials

---

## 🆘 Support

- **SePay Docs**: https://docs.sepay.vn/
- **SePay Dashboard**: https://my.sepay.vn/
- **Support**: support@sepay.vn

---

## ✅ Checklist

- [ ] Đăng ký SePay Sandbox
- [ ] Lấy Merchant ID & Secret Key
- [ ] Update `.env` file
- [ ] Restart server
- [ ] Test `/api/payment/health`
- [ ] Test create payment
- [ ] Test payment flow
- [ ] Configure webhook (optional)
- [ ] Build frontend UI
- [ ] End-to-end testing
