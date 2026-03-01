# Đánh giá hệ thống Website (my-store)

Tài liệu tổng hợp kết quả quét và đánh giá **chỉ hệ thống Website** (my-store): kiến trúc, luồng nghiệp vụ, điểm mạnh và khuyến nghị.

---

## 1. Tổng quan kiến trúc Website

### 1.1 Cấu trúc

- **Monorepo:** `apps/server` (API), `apps/web` (SPA), `packages/` (api, config, db, env).
- **Server:** Express 5, TypeScript, Prisma + PostgreSQL, Redis (optional), Helmet, CORS, CSRF, rate limit, JWT, bcrypt, Resend, **sepay-pg-node**, winston, node-cron.
- **Web:** React 19, Vite 6, Tailwind 4, TanStack Query, Sentry, next-themes; proxy `/api`, `/products`, … ra backend.

### 1.2 Luồng dữ liệu chính (trong Website)

- **Khách:** Web (cart) → Thanh toán (Mcoin hoặc QR) → Server ghi `order_customer` + `wallet_transaction` + `order_list` (qua `handlePaymentSuccess`) → Telegram topic 2733.
- **Mcoin:** confirmBalancePayment → order_customer + wallet (trừ dư) → handlePaymentSuccess (order_list + Telegram).
- **QR:** createPayment (items) → order_customer + MAVP; user quét QR → Webhook SePay → processWebhook → cập nhật paid + đọc `cart_items` (phương án B) → handlePaymentSuccess (order_list + Telegram). confirmTransfer (items) vẫn hỗ trợ khi frontend gửi items.

---

## 2. Điểm mạnh

### 2.1 Kiến trúc & tách lớp

- **Component chung thanh toán:** `handlePaymentSuccess` (payment-success.service) dùng thống nhất cho Mcoin, QR (confirmTransfer), và webhook QR → ghi order_list + Telegram; không trùng logic.
- **Tách rõ:** Controllers → Services; config DB/schema tập trung (`db.config.ts`); routes mount rõ trong `index.ts`.

### 2.2 Bảo mật

- CORS bắt buộc origin trong production; Helmet, X-Content-Type-Options, X-Frame-Options, CSRF cho `/api`, rate limiting, payload size limit, HTTPS redirect (production).
- Auth: JWT, refresh token, password history, token blacklist, captcha (Cloudflare).

### 2.3 Thanh toán & đơn hàng

- Hai kênh: Mcoin (trừ ví ngay) và QR (Sepay, webhook); id_order unique (MAVL/MAVC/MAVK); payment_id FK wallet_transaction.
- **order_list** ghi khi thanh toán thành công (Mcoin từ request; QR từ confirmTransfer hoặc **webhook + cart_items** (phương án B đã triển khai)).
- Materialized views (variant_sold_count, product_sold_30d) + cron refresh; `id_product` trong order_list là int (variant_id).

### 2.4 Docs

- ORDER_SYSTEM.md, ORDER_SYSTEM_TASKS.md, Notify_Succes_Order.md, SCHEMA_ID_REFACTOR.md mô tả rõ luồng, task và phương án triển khai.

---

## 3. Điểm cần cải thiện / rủi ro

### 3.1 Chưa triển khai / TODO

| Mục | Mô tả | Ưu tiên |
|-----|--------|---------|
| **POST /api/orders/notify-done** | API nhận slot, note, supply (vd. từ client bên ngoài); Server cập nhật order_list, cost từ supplier_cost, tuỳ chọn gửi "Đơn đã hoàn thành" lên Telegram. Doc Notify_Succes_Order.md đã mô tả. | Cao |
| **Webhook FAILED/CANCELLED** | `sepay.service`: TODO cập nhật trạng thái đơn khi payment_status = FAILED/CANCELLED. | Trung bình |
| **Favorites / MyComments (Web)** | FavoriteProducts.tsx, MyComments.tsx: TODO fetch from API; hiện mock empty. | Thấp |
| **Rate limiter production** | rateLimiter.ts: TODO dùng Redis store cho multi-instance. | Trung bình khi scale |

### 3.2 Routes không mount

- `product-stats.route.ts` và `product-sold-count.route.ts` **không** được mount trong `index.ts` → API HTTP cho stats/sold-count không tồn tại (service vẫn dùng nội bộ/job).

### 3.3 Kỹ thuật

- **Lint:** Một số file (payment.controller, sepay.service) còn lỗi kiểu `Type 'undefined' cannot be used as an index type` (COLS_OC, COLS_WT) — nên sửa để type-safe.
- **Schema:** SCHEMA_ID_REFACTOR.md ghi hướng `supply` → `id_supply` (FK); chưa áp dụng toàn bộ.

### 3.4 E2E / kiểm thử

- ORDER_SYSTEM_TASKS: F1, F2 (E2E Mcoin/QR), F3–F5 (kiểm tra id_order, payment_id, promo_code) vẫn [ ] chưa đánh dấu hoàn thành.

---

## 4. Khuyến nghị ưu tiên

1. **Cao:** Triển khai **POST /api/orders/notify-done** (validate body, auth API key/secret), cập nhật order_list (slot, note, supply, cost), tuỳ chọn notifyOrderDone Telegram.
2. **Cao:** Bổ sung xử lý webhook **FAILED/CANCELLED** (cập nhật trạng thái order_customer hoặc tương đương).
3. **Trung bình:** Sửa lỗi TypeScript index type (COLS_OC/COLS_WT) để build/lint sạch.
4. **Trung bình:** Chạy và ghi nhận E2E F1–F5 (hoặc đánh dấu đã kiểm tra thủ công).
5. **Thấp:** Favorites/MyComments API + tích hợp frontend; Redis store cho rate limiter khi chạy nhiều instance.

---

## 5. Trạng thái từng domain (Website)

| Domain | Trạng thái | Ghi chú |
|--------|------------|---------|
| Auth | Ổn định | Login, register, refresh, sessions, CSRF, captcha. |
| Cart | Ổn định | CRUD, sync, enriched (price/duration từ variant + price_config); buildOrderListItemsFromCart cho webhook QR. |
| Payment Mcoin | Ổn định | confirmBalancePayment → order_customer + wallet + handlePaymentSuccess (order_list + Telegram). |
| Payment QR | Ổn định | createPayment (items) → MAVP + order_customer; webhook + cart_items → handlePaymentSuccess; confirmTransfer (items) vẫn hỗ trợ. |
| Order list | Ổn định | Ghi từ Mcoin/QR; thiếu API notify-done (nhận slot, note, supply từ client ngoài). |
| Telegram | Ổn định | notifyNewOrder/sendOrderNotification, topic 2733; chưa có notifyOrderDone (sau khi có notify-done). |
| Wallet / Topup | Ổn định | Balance, history; transactions join order_customer. |
| Products / Variants | Ổn định | List, promotions, categories, packages, variant detail, product info; MV + cron. |

---

## 6. Tài liệu tham chiếu

- `docs/ORDER_SYSTEM.md` — Luồng thanh toán, cấu trúc order_customer / wallet_transaction.
- `docs/ORDER_SYSTEM_TASKS.md` — Checklist A–F, sửa lỗi đã xử lý.
- `docs/Notify_Succes_Order.md` — Notify success, notify-done, topic 2733, phương án B (webhook + cart_items).
- `docs/SCHEMA_ID_REFACTOR.md` — Hướng id_product (variant_id), id_supply.

*Tài liệu này chỉ đánh giá hệ thống Website (my-store); cập nhật khi có thay đổi lớn.*

---

## Các mục chưa triển khai (note để làm sau)

- **POST /api/orders/notify-done** — API nhận slot, note, supply; cập nhật order_list, cost; tuỳ chọn gửi "Đơn đã hoàn thành" lên Telegram (xem `Notify_Succes_Order.md`).
- **Webhook FAILED/CANCELLED** — Trong `sepay.service`: cập nhật trạng thái đơn khi payment_status = FAILED/CANCELLED.
- **Favorites / MyComments (Web)** — FavoriteProducts.tsx, MyComments.tsx: fetch từ API thật; hiện đang mock empty.
- **Rate limiter production** — Dùng Redis store cho rate limiter khi chạy multi-instance.
- **Routes stats/sold-count** — `product-stats.route.ts` và `product-sold-count.route.ts` chưa mount trong `index.ts` (nếu cần API HTTP công khai).
- **Schema id_supply** — SCHEMA_ID_REFACTOR.md: chuyển `supply` → `id_supply` (FK) chưa áp dụng toàn bộ.
- **E2E / kiểm thử** — ORDER_SYSTEM_TASKS: F1–F5 (E2E Mcoin/QR, id_order, payment_id, promo_code) chưa đánh dấu hoàn thành.
- **notifyOrderDone (Telegram)** — Gửi thông báo "Đơn đã hoàn thành" lên Telegram; triển khai sau khi có notify-done.