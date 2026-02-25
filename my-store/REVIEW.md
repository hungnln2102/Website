# Đánh giá tổng thể dự án My Store

Tài liệu đánh giá 5 khía cạnh: **UX/UI**, **Security**, **Network**, **Cấu trúc dự án**, **SEO**.

---

## 1. UX/UI

### Điểm mạnh
- **Cấu trúc rõ ràng**: Features tách biệt (auth, cart, profile, topup, product, catalog…), component UI dùng chung (shadcn/ui, layout, menu).
- **Phản hồi lỗi**: `ErrorMessage` với nút retry, toast (sonner) cho thông báo, loading skeleton cho product/detail.
- **Responsive**: Order history có table + cards mobile, menu có mega menu, form và bảng đã xử lý màn hình nhỏ.
- **Accessibility**: Skip links (Bỏ qua đến nội dung chính / menu), `sr-only` + focus visible, `aria-label` trên nhiều nút, H1 ẩn cho crawler trong `index.html`.
- **Dark/Light**: Mode toggle, theme nhất quán.
- **Countdown đơn hàng**: Hiển thị "Còn X ngày Y giờ" / "Đã hết hạn" hỗ trợ người dùng theo dõi đơn.

### Cần cải thiện
- **Nguồn token không thống nhất**: Auth token được lưu ở `sessionStorage` (LoginPage, useAuth, `lib/api/auth`) nhưng `useCart` lấy token từ `hooks/cartStorage.ts` (đọc `localStorage`). Hậu quả: sau khi đăng nhập, các gọi API giỏ hàng từ `useCart` có thể **không gửi token** (localStorage trống). Cần dùng một nguồn token duy nhất (khuyến nghị: `getAuthToken` từ `@/lib/api` cho mọi chỗ cần auth).
- **Loading toàn trang**: Một số trang có thể thiếu trạng thái loading/empty rõ ràng (cần rà soát từng màn).
- **Form validation**: Đã có `registerValidation`, nên áp dụng pattern tương tự cho form đăng nhập và form khác để thông báo lỗi đồng nhất.
- **Focus trap trong modal**: Modal chi tiết đơn hàng nên bẫy focus (focus trap) và đóng bằng Esc để dùng bàn phím tốt hơn.

---

## 2. Security

### Điểm mạnh
- **Server**
  - Helmet: CSP (production), HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
  - CORS: Bắt buộc `CORS_ORIGIN` trong production, fail fast nếu thiếu.
  - Rate limit: general (1000/15ph), strict (10/15ph), veryStrict (5/15ph), auth (5/15ph, skip khi thành công), checkUser (10/5ph).
  - API security: banned IP, honeypot, limit payload, security headers, validate Content-Type, validate request (SQL/XSS pattern trong body), CAPTCHA (Turnstile) cho login/register và thao tác nhạy cảm.
  - JWT: verify token, blacklist token, audit log (CAPTCHA_FAILED, INVALID_TOKEN, SUSPICIOUS_ACTIVITY).
  - HTTPS redirect trong production (theo `x-forwarded-proto`).
- **Client**
  - Token trong `sessionStorage` (useAuth, lib/api/auth) giảm rủi ro XSS lộ token lâu dài.
  - Cảnh báo khi dùng HTTP trong production (client.ts, auth.service.ts).
  - Sanitize HTML: DOMPurify (`lib/utils/sanitize.ts`) cho nội dung user-generated.
  - handleApiError: không lộ chi tiết lỗi server (5xx/404/403/401) ra UI.

### Cần cải thiện
- **Token storage nhất quán**: Như đã nêu, `cartStorage.getAuthToken()` đọc `localStorage` trong khi token thực tế nằm ở `sessionStorage`. Sửa: `useCart` (và mọi chỗ cần token cho API) dùng `getAuthToken` từ `@/lib/api`; hoặc bỏ `getAuthToken` khỏi cartStorage và chỉ dùng lib/api.
- **HttpOnly cookie**: Token trong sessionStorage vẫn đọc được bởi script (XSS). Nếu có thể, chuyển access/refresh token sang httpOnly cookie do server set và dùng `credentials: 'include'` để giảm rủi ro.
- **CSRF**: Đã có `getCsrfToken()` (meta/cookie) và middleware CSRF trên server; cần đảm bảo mọi request state-changing từ web đều gửi CSRF token nếu server yêu cầu.
- **CSP**: `index.html` có meta CSP; server cũng set CSP qua Helmet. Tránh trùng lặp hoặc xung đột (ưu tiên header từ server nếu có).

---

## 3. Network

### Điểm mạnh
- **Base URL tập trung**: `lib/api/client.ts` dùng `getApiBase()` (VITE_SERVER_URL); một số module dùng VITE_API_URL – nên thống nhất một biến env (ví dụ `VITE_API_URL`) cho toàn bộ client.
- **Auth gửi kèm**: `authFetch` thêm Bearer token và `credentials: 'include'`, xử lý 401 (logout event).
- **Error handling**: handleApiError chuẩn hóa thông báo, tránh lộ stack/chi tiết.

### Cần cải thiện
- **Thống nhất env**: Hiện có cả `VITE_SERVER_URL` (client.ts) và `VITE_API_URL` (auth.service, useAuth, fetchProfile, useSyncUserBalance, TopupPage). Nên chọn một (ví dụ `VITE_API_URL`) và dùng `getApiBase()` từ `@/lib/api` ở mọi nơi gọi API.
- **Retry / timeout**: fetch không có retry hay timeout. Với mạng kém, nên có timeout (AbortController) và retry có backoff cho request quan trọng (login, payment, sync cart).
- **Request dedup**: Các trang gọi nhiều API (product detail, cart) có thể trùng request; cân nhắc dedup hoặc cache (React Query/SWR) để giảm tải và trải nghiệm mượt hơn.

---

## 4. Cấu trúc dự án

### Điểm mạnh
- **Monorepo**: Workspaces (apps/web, apps/server, packages/api, packages/db, packages/env, packages/config), build/lint/test chạy theo workspace.
- **Web (STRUCTURE.md)**:
  - `components/`: UI chung, layout, menu, SEO, providers, accessibility.
  - `features/`: từng feature có components, hooks, api, config, constants, utils, page + index.
  - `hooks/`: useCart, useProducts, useCategories, usePromotions, useScroll; cartStorage tách riêng.
  - `lib/`: api, types, utils, config, constants, seo, error-tracking, performance.
  - Pages thường re-export từ features.
- **Nguyên tắc**: Một file một trách nhiệm, tách constants/utils/hooks, page chỉ orchestrate.
- **Server**: Routes tách file (auth, user, cart, topup, payment, form, products, …), middleware tập trung (auth, csrf, rate limit, api-security, error handler), services riêng (auth, captcha, token-blacklist, audit, …).

### Cần cải thiện
- **Trùng API_BASE**: Nhiều file tự định nghĩa `const API_BASE = import.meta.env.VITE_* || "http://localhost:4000"`. Nên import `getApiBase()` từ `@/lib/api` và dùng nhất quán.
- **Cart & auth**: `hooks/cartStorage.ts` chứa cả key token và cart; token nên chỉ do `lib/api/auth` quản lý. CartStorage chỉ nên: CartItem type, CART_STORAGE_KEY, loadCart, saveCart, getCartItemCount; không export getAuthToken (useCart lấy token từ lib/api).

---

## 5. SEO

### Điểm mạnh
- **Meta động**: Component `MetaTags` cập nhật title, description, keywords, Open Graph, Twitter Card, canonical.
- **Structured data**: generateOrganizationSchema, generateWebSiteSchema, generateFAQSchema (HomePage); ProductDetailPage có schema sản phẩm.
- **index.html**: meta description, keywords, author, robots index/follow, og/twitter cơ bản, lang="vi", H1 ẩn, noscript với nội dung giới thiệu cho crawler.
- **Sitemap & robots**: `public/robots.txt` trỏ Sitemap, `public/sitemap.xml` (static); có `lib/seo/sitemap.ts` và sitemap-generator (client) để generate theo products/categories.
- **Preconnect/preload**: Fonts (Google Fonts) có preconnect và preload.
- **URL sạch**: Routing theo slug (category, product) phù hợp SEO.

### Cần cải thiện
- **Sitemap production**: Sitemap hiện có thể là file tĩnh trong public. Nên generate sitemap từ server (hoặc build step) dùng dữ liệu thật (products, categories) và cập nhật khi có thay đổi.
- **Canonical**: MetaTags set canonical khi có `metadata.url`; cần đảm bảo mọi trang có URL canonical đúng (trang chi tiết, danh mục, tìm kiếm).
- **robots theo môi trường**: robots.txt có thể khác nhau giữa staging và production (ví dụ disallow cho staging).
- **Image alt**: Đã có alt cho ProductCard/ProductImageGallery; nên rà soát toàn site để ảnh đều có alt mô tả.

---

## Tóm tắt ưu tiên

| Ưu tiên | Hạng mục        | Hành động đề xuất | Trạng thái |
|--------|------------------|-------------------|------------|
| Cao    | Security/UX      | Sửa useCart dùng getAuthToken từ `@/lib/api` (bỏ phụ thuộc token từ cartStorage) để API cart có token sau khi đăng nhập. | ✅ Đã xử lý |
| Cao    | Network/Cấu trúc | Thống nhất base URL: một biến env (VITE_API_URL), dùng getApiBase() từ `@/lib/api` ở mọi nơi. | ✅ Đã xử lý |
| Trung bình | Cấu trúc    | cartStorage: bỏ getAuthToken/AUTH_TOKEN_KEY; chỉ export cart-related. | ✅ Đã xử lý (đã bỏ trong bước Security/UX) |
| Trung bình | Network     | Thêm timeout (AbortController) và retry có backoff cho fetch quan trọng. | ✅ Đã xử lý |
| Trung bình | SEO        | Sitemap generate từ server hoặc build, cập nhật theo products/categories. | ✅ Đã xử lý |
| Thấp   | UX             | Focus trap + đóng bằng Esc cho modal; form validation đồng nhất. | ✅ Đã xử lý |
| Thấp   | Security       | Cân nhắc chuyển token sang httpOnly cookie. | ✅ Đã xử lý |

**Đã thực hiện (ưu tiên trung bình):**
- **Network:** `lib/utils/fetchWithRetry.ts` – fetch với timeout (mặc định 15s) và retry với exponential backoff (2 lần retry). Dùng trong `authFetch`, auth.service (login/register/check-user/captcha), cart.api, payment.api (health/create/status).
- **SEO:** Server phục vụ `GET /sitemap.xml` – sinh XML từ products + categories (services có sẵn), cache 1 giờ. Base URL lấy từ `SITEMAP_BASE_URL` hoặc `CORS_ORIGIN[0]`. Nếu frontend và API khác host, cấu hình `robots.txt` trỏ Sitemap tới URL API (vd. `https://api.domain.com/sitemap.xml`).

**Đã thực hiện (ưu tiên thấp):**
- **UX:** OrderDetailModal dùng `FocusTrap` (focus trap + đóng bằng Esc), thêm `role="dialog"`, `aria-modal`, `aria-labelledby`; form đăng nhập dùng `auth/lib/loginValidation.ts` (validateLoginForm) và hiển thị lỗi theo từng trường giống RegisterForm.
- **Security:** Token access có thể gửi bằng httpOnly cookie: server set cookie `mavryk_at` khi login (httpOnly, secure trong production, SameSite=lax), middleware auth đọc token từ `req.cookies.mavryk_at` hoặc Authorization Bearer; logout xóa cookie và blacklist token. Client khi nhận `useHttpOnlyCookie: true` từ login thì không lưu token vào sessionStorage (chỉ dùng cookie với `credentials: 'include'`).

---

*Tài liệu được tạo từ đánh giá codebase (web + server) tại thời điểm hiện tại.*
