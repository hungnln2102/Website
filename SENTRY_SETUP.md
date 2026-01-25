# 📘 HƯỚNG DẪN SETUP SENTRY

## 🔍 VITE_SENTRY_DSN là gì?

**VITE_SENTRY_DSN** (Data Source Name) là một chuỗi URL duy nhất được cung cấp bởi Sentry để kết nối ứng dụng của bạn với tài khoản Sentry của bạn.

### Sentry là gì?
- **Sentry** là một dịch vụ **error tracking và performance monitoring**
- Giúp bạn theo dõi, ghi lại và phân tích các lỗi trong ứng dụng production
- Cung cấp stack traces, context, user information khi có lỗi xảy ra
- Có cảnh báo real-time khi có lỗi mới

### DSN là gì?
- **DSN** = Data Source Name
- Là một URL duy nhất cho project của bạn trên Sentry
- Format: `https://[key]@[organization].ingest.sentry.io/[project-id]`
- Ví dụ: `https://abc123@o123456.ingest.sentry.io/789012`

---

## 🚀 CÁCH LẤY SENTRY DSN

### Bước 1: Tạo tài khoản Sentry

1. Truy cập: https://sentry.io/signup/
2. Đăng ký tài khoản miễn phí (Free tier có 5,000 events/tháng)
3. Xác nhận email

### Bước 2: Tạo Project mới

1. Sau khi đăng nhập, click **"Create Project"**
2. Chọn platform: **"React"** hoặc **"JavaScript"**
3. Đặt tên project: ví dụ `"Mavryk Premium Store"`
4. Click **"Create Project"**

### Bước 3: Lấy DSN

1. Sau khi tạo project, Sentry sẽ hiển thị **"Client Keys (DSN)"**
2. Copy DSN string (có dạng: `https://...@...ingest.sentry.io/...`)
3. Hoặc vào **Settings > Projects > [Your Project] > Client Keys (DSN)**

---

## ⚙️ CÁCH SETUP TRONG PROJECT

### Bước 1: Cài đặt package

```bash
cd my-store/apps/web
npm install @sentry/react
```

### Bước 2: Tạo file `.env` hoặc `.env.local`

Tạo file `.env.local` trong thư mục `my-store/apps/web/`:

```env
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
```

**Lưu ý:** 
- File `.env.local` sẽ không được commit vào git (đã có trong .gitignore)
- Không share DSN công khai vì nó có thể bị lạm dụng

### Bước 3: Uncomment code trong error-tracker.ts

Mở file `src/lib/error-tracking/error-tracker.ts` và uncomment phần Sentry code:

```typescript
if (sentryDsn && import.meta.env.PROD) {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: sentryDsn,
      // ... rest of config
    });
    // ...
  }
}
```

---

## 📋 VÍ DỤ DSN

DSN thường có format như sau:

```
https://abc123def456@o1234567.ingest.sentry.io/7890123456
```

Trong đó:
- `abc123def456` = Public Key
- `o1234567` = Organization ID
- `7890123456` = Project ID

---

## 🔒 BẢO MẬT

### ⚠️ QUAN TRỌNG:

1. **KHÔNG commit DSN vào git**
   - DSN là public key, nhưng vẫn nên giữ bí mật
   - Thêm vào `.env.local` (đã có trong .gitignore)

2. **Rate Limiting**
   - Sentry có rate limiting để tránh spam
   - Free tier: 5,000 events/tháng

3. **Filter sensitive data**
   - Sentry tự động filter passwords, credit cards
   - Có thể config thêm filters trong Sentry dashboard

---

## 🎯 CÁCH SỬ DỤNG

Sau khi setup, Sentry sẽ tự động:
- ✅ Capture unhandled errors
- ✅ Capture unhandled promise rejections
- ✅ Track errors từ ErrorBoundary
- ✅ Gửi thông tin về Sentry dashboard

Bạn có thể xem errors tại: https://sentry.io/organizations/[your-org]/issues/

---

## 💡 ALTERNATIVES (Nếu không muốn dùng Sentry)

Nếu không muốn dùng Sentry, bạn có thể:

1. **Console logging** (hiện tại đang dùng)
   - Đơn giản, không cần setup
   - Nhưng không có tracking trong production

2. **Custom error tracking**
   - Gửi errors đến backend API của bạn
   - Lưu vào database
   - Tự build dashboard

3. **Other services:**
   - LogRocket
   - Rollbar
   - Bugsnag
   - Datadog

---

## 📝 CHECKLIST SETUP

- [ ] Tạo tài khoản Sentry
- [ ] Tạo project mới
- [ ] Copy DSN
- [ ] Cài đặt `@sentry/react`: `npm install @sentry/react`
- [ ] Tạo file `.env.local` với `VITE_SENTRY_DSN=...`
- [ ] Uncomment code trong `error-tracker.ts`
- [ ] Test trong production mode
- [ ] Kiểm tra Sentry dashboard

---

**Lưu ý:** Hiện tại project đang dùng **console fallback**, hoạt động tốt cho development. Sentry chỉ cần thiết nếu bạn muốn error tracking trong production.
