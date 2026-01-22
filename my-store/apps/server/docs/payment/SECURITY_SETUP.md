# Security Implementation - Setup Guide

## 🔐 Security Features Implemented

### ✅ Completed
1. **Helmet** - Security headers (CSP, HSTS, XSS protection)
2. **Rate Limiting** - 3-tier protection (general, strict, very strict)
3. **Compression** - Response size reduction
4. **Error Handling** - Comprehensive error middleware
5. **Authentication System** - JWT with refresh tokens
6. **Password Hashing** - bcrypt with cost factor 12
7. **Data Encryption** - AES-256 for sensitive data
8. **Input Validation** - express-validator with XSS protection
9. **Security Logging** - Winston with daily rotation

### 📋 Ready for Implementation
- Payment Gateway Integration (VNPay/MoMo/Stripe)
- CSRF Protection
- HTTPS/SSL Setup
- Session Management
- Role-Based Access Control

---

## 🚀 Quick Start

### 1. Generate Secrets

```bash
# Generate JWT Secret (64 bytes)
openssl rand -base64 64

# Generate Refresh Token Secret (64 bytes)
openssl rand -base64 64

# Generate Encryption Key (32 bytes)
openssl rand -base64 32

# Generate Session Secret (32 bytes)
openssl rand -base64 32
```

### 2. Update .env File

Copy `.env.example` to `.env` and update with generated secrets:

```bash
cd apps/server
cp .env.example .env
```

Then edit `.env` and replace all `your-*-change-this-in-production` values with generated secrets.

### 3. Test Authentication

```typescript
// Example: Login endpoint
import { authService } from './services/auth.service';
import { logAuthEvent } from './utils/logger';

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Get user from database
  const user = await getUserByEmail(email);
  
  if (!user) {
    logFailedLogin(email, req.ip, 'User not found');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verify password
  const isValid = await authService.verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    logFailedLogin(email, req.ip, 'Invalid password');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = authService.generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  logAuthEvent('LOGIN_SUCCESS', { userId: user.id, email: user.email });
  
  res.json({ accessToken, refreshToken, user });
});
```

### 4. Protect Routes

```typescript
import { authenticate, authorize } from './middleware/auth';

// Require authentication
app.get('/api/profile', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ user });
});

// Require admin role
app.get('/api/admin/users', authenticate, authorize('admin'), (req, res) => {
  // Only admins can access
});
```

### 5. Use Encryption for Sensitive Data

```typescript
import { encryptionService } from './services/encryption.service';

// Encrypt before saving
const user = {
  email: 'user@example.com',
  phone: encryptionService.encrypt('0123456789'),
  address: encryptionService.encrypt('123 Main St'),
};

// Decrypt when needed
const phone = encryptionService.decrypt(user.phone);
```

### 6. Validate Input

```typescript
import { validationRules, handleValidationErrors } from './utils/validation';

app.post('/api/payment/create',
  authenticate,
  [
    validationRules.amount(),
    validationRules.orderId(),
    handleValidationErrors,
  ],
  async (req, res) => {
    // Input is validated and sanitized
    const { amount, orderId } = req.body;
  }
);
```

---

## 📊 Security Checklist

### Before Production

- [ ] Generate strong secrets (use openssl)
- [ ] Update all `.env` values
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall
- [ ] Set up monitoring (Sentry)
- [ ] Enable database encryption
- [ ] Configure backup strategy
- [ ] Test all security features
- [ ] Run security audit
- [ ] Review logs directory permissions

### Production Environment Variables

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
ENCRYPTION_KEY=<generated-key>
SESSION_SECRET=<generated-secret>
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=<your-production-code>
VNPAY_HASH_SECRET=<your-production-secret>
VNPAY_RETURN_URL=https://yourdomain.com/api/payment/return
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=warn
```

---

## 🔍 Testing Security

### Test Rate Limiting

```bash
# Should block after 100 requests in 15 minutes
for i in {1..101}; do
  curl http://localhost:4000/products
done
```

### Test Authentication

```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.accessToken')

# Use token to access protected route
curl http://localhost:4000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Test Input Validation

```bash
# Should return 400 error
curl -X POST http://localhost:4000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"amount":-100,"orderId":"invalid@id"}'
```

---

## 📝 Logs

Logs are stored in `apps/server/logs/` directory:

- `security-YYYY-MM-DD.log` - Security events (warnings/errors)
- `payment-YYYY-MM-DD.log` - Payment transactions
- `error-YYYY-MM-DD.log` - Application errors
- `combined-YYYY-MM-DD.log` - All events

### View Logs

```bash
# View today's security logs
tail -f apps/server/logs/security-$(date +%Y-%m-%d).log

# View payment logs
tail -f apps/server/logs/payment-$(date +%Y-%m-%d).log
```

---

## 🚨 Security Incidents

If you detect suspicious activity:

1. Check security logs
2. Review failed login attempts
3. Check rate limit violations
4. Verify payment transactions
5. Update secrets if compromised
6. Block suspicious IPs

---

## 📚 Next Steps

1. **Implement Payment Gateway** - VNPay/MoMo integration
2. **Add HTTPS** - SSL certificate setup
3. **Enable CSRF Protection** - For form submissions
4. **Add Session Management** - Store refresh tokens in DB
5. **Implement RBAC** - Role-based access control
6. **Security Audit** - Professional security review

---

## 🆘 Support

For security issues, contact: security@yourdomain.com

**DO NOT** share secrets in:
- Git commits
- Public channels
- Unencrypted communications
