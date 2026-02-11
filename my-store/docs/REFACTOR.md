# Gợi ý refactor – File ôm đồm

Tài liệu này liệt kê các file đang gánh quá nhiều trách nhiệm (dài, nhiều domain) và gợi ý tách để dễ bảo trì.

---

## 1. Frontend – `apps/web/src/lib/api.ts` (~752 dòng)

**Vấn đề:** Một file chứa: auth helpers, DTO types, xử lý lỗi, và toàn bộ API (products, promotions, categories, cart, payment, form, user orders).

**Gợi ý:**

- **Auth:** Tách `getAuthToken`, `AUTH_EXPIRED_EVENT`, `handleUnauthorized`, `authFetch` → `lib/auth-client.ts` hoặc `lib/api/auth.ts`.
- **Types:** Chuyển DTO (ProductDto, PromotionDto, CartItemDto, UserOrder, FormFieldDto, …) → `lib/types/api.types.ts` (hoặc tách theo domain: `lib/api/types/products.ts`, `cart.ts`, …).
- **API theo domain:** Giữ/chuẩn hóa các file trong `lib/api/` (đã có `products`, `categories`, `promotions`, `product-packages`), thêm:
  - `lib/api/auth.ts` – auth helpers
  - `lib/api/cart.api.ts` – fetchCart, addToCart, updateCartItem, removeFromCart, clearCartApi, syncCart, getCartCount
  - `lib/api/payment.api.ts` – checkPaymentHealth, createPayment, checkPaymentStatus, confirmBalancePayment, generateOrderId
  - `lib/api/user.api.ts` – fetchUserOrders
  - `lib/api/forms.api.ts` – fetchFormFields
  - `lib/api/variant.api.ts` – fetchVariantDetail, fetchProductInfo
- **Barrel:** `lib/api/index.ts` re-export tất cả để import `@/lib/api` vẫn dùng được.

---

## 2. Backend – `apps/server/src/routes/auth.route.ts` (~670 dòng)

**Vấn đề:** Một router vừa login, register, refresh token, lockout, device info, đổi mật khẩu, v.v.

**Gợi ý:**

- Tách **handlers** ra: `controllers/auth.controller.ts` (hoặc `routes/handlers/auth.handlers.ts`) – mỗi handler là một hàm nhận `(req, res)`.
- Giữ `auth.route.ts` chỉ đăng ký route và gọi handler.
- Hoặc tách route theo nhóm: `auth-session.route.ts` (login, logout, refresh), `auth-register.route.ts`, `auth-password.route.ts` rồi mount trong `index.ts`.

---

## 3. Backend – `apps/server/src/routes/user.route.ts` (~417 dòng)

**Vấn đề:** Nhiều endpoint user (profile, orders, đổi mật khẩu, …) trong một file.

**Gợi ý:**

- Tách handlers → `controllers/user.controller.ts` (hoặc `routes/handlers/user.handlers.ts`).
- Hoặc tách route: `user-profile.route.ts`, `user-orders.route.ts` và mount dưới `/api/user`.

---

## 4. Backend – `apps/server/src/middleware/apiSecurity.ts` (~407 dòng)

**Vấn đề:** Một file middleware xử lý nhiều mảng bảo mật (IP, payload, headers, …).

**Gợi ý:** Có thể tách theo chức năng: `middleware/security/banned-ip.ts`, `limit-payload.ts`, `security-headers.ts` rồi gộp trong `apiSecurity.ts` hoặc trong `index.ts`. Ưu tiên thấp hơn nếu logic gắn chặt với nhau.

---

## 5. Backend – `apps/server/src/routes/products.route.ts` (~375 dòng)

**Vấn đề:** Đã tách từ `index.ts`, nhưng vẫn gồm 4 endpoint lớn (products, promotions, categories, product-packages) và nhiều SQL.

**Gợi ý (khi cần):**

- Tách từng endpoint thành route riêng: `products-list.route.ts`, `promotions.route.ts`, `categories.route.ts`, `product-packages.route.ts`, mount trong `index.ts`.
- Hoặc tách **query + map** sang service: `services/products-list.service.ts`, `promotions.service.ts`, `categories.service.ts`; route chỉ gọi service và trả JSON.

---

## 6. Các file khác (chấp nhận được hoặc ưu tiên thấp)

- **db.config.ts (~342 dòng):** Cấu hình schema/table, một nhiệm vụ rõ ràng – có thể tách từng schema ra file nếu sau này mở rộng.
- **payment.route.ts (~309), cart.route.ts (~284):** Có thể tách handlers sang controller/service tương tự auth/user.
- **apiSecurity, redis, audit.service, wallet.service:** Dài nhưng đơn nhiệm – refactor khi sửa tính năng liên quan.

---

## Thứ tự ưu tiên refactor

1. **api.ts** (frontend) – tách auth, types, và từng nhóm API để giảm conflict và dễ test.
2. **auth.route.ts** (backend) – tách handlers hoặc tách route theo nhóm chức năng.
3. **user.route.ts** – tách handlers hoặc route con.
4. Các route/service còn lại khi có thời gian hoặc khi sửa đổi nhiều.
