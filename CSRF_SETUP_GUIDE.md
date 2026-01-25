# 🔐 CSRF Protection Setup Guide

## 📋 Tổng quan

CSRF (Cross-Site Request Forgery) protection đã được chuẩn bị sẵn trong frontend, nhưng cần backend support để hoạt động đầy đủ.

**Lưu ý:** Hiện tại ứng dụng chỉ sử dụng GET requests, nên CSRF protection chưa cần thiết ngay. Utility đã được tạo sẵn cho tương lai.

---

## 🚀 Setup Backend (Khi cần)

### 1. Cài đặt package

```bash
cd my-store/apps/server
npm install csurf
# hoặc
npm install csrf
```

### 2. Generate CSRF Token Endpoint

Thêm endpoint để frontend lấy CSRF token:

```typescript
// Backend: routes/csrf.route.ts
import express from 'express';
import csrf from 'csurf';

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

// Endpoint để lấy CSRF token
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ 
    csrfToken: req.csrfToken() 
  });
});

export default router;
```

### 3. Protect State-Changing Routes

```typescript
// Backend: Protect POST/PUT/DELETE routes
app.post('/api/products', csrfProtection, (req, res) => {
  // Your handler
});

app.put('/api/products/:id', csrfProtection, (req, res) => {
  // Your handler
});

app.delete('/api/products/:id', csrfProtection, (req, res) => {
  // Your handler
});
```

### 4. Set CSRF Token Cookie

```typescript
// Backend: Set cookie for CSRF token
app.use(csrf({ cookie: true }));

// Middleware to set CSRF token in response
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // Frontend needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  next();
});
```

---

## 🎨 Setup Frontend (Đã sẵn sàng)

### 1. Utility đã được tạo

File: `src/lib/utils/csrf.ts`

### 2. Sử dụng khi có POST/PUT/DELETE

```typescript
import { fetchWithCsrf } from '@/lib/utils/csrf';

// Thay vì fetch thông thường
const response = await fetchWithCsrf('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(productData),
});
```

### 3. Hoặc thêm header thủ công

```typescript
import { addCsrfHeader } from '@/lib/utils/csrf';

const headers = addCsrfHeader({
  'Content-Type': 'application/json',
});

const response = await fetch('/api/products', {
  method: 'POST',
  headers,
  body: JSON.stringify(productData),
});
```

---

## 📝 Checklist

### Backend (Khi cần):
- [ ] Install CSRF package (`csurf` hoặc `csrf`)
- [ ] Create `/csrf-token` endpoint
- [ ] Add CSRF middleware to state-changing routes
- [ ] Set CSRF token cookie
- [ ] Test CSRF protection

### Frontend (Đã sẵn sàng):
- [x] CSRF utility functions created
- [x] `getCsrfToken()` function
- [x] `addCsrfHeader()` function
- [x] `fetchWithCsrf()` wrapper
- [ ] Update API calls to use `fetchWithCsrf()` when POST/PUT/DELETE are added

---

## 🔒 Security Notes

1. **CSRF tokens** should be:
   - Unique per session
   - Regenerated on each request (double-submit cookie pattern)
   - Validated on server-side

2. **Cookie settings**:
   - `httpOnly: false` - Frontend needs to read token
   - `secure: true` - Only send over HTTPS in production
   - `sameSite: 'strict'` - Prevent CSRF attacks

3. **When to use**:
   - ✅ POST, PUT, PATCH, DELETE requests
   - ❌ GET, HEAD requests (no CSRF needed)

---

## 🧪 Testing

Khi backend đã setup:

1. **Get CSRF token:**
   ```bash
   curl http://localhost:4000/csrf-token
   ```

2. **Test protected endpoint:**
   ```bash
   curl -X POST http://localhost:4000/api/products \
     -H "X-CSRF-Token: <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Product"}'
   ```

---

**Status:** ✅ Frontend ready, ⏳ Backend pending  
**Priority:** 🟡 Medium (only needed when POST/PUT/DELETE are added)
