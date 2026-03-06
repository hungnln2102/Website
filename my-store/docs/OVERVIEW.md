# My-Store — Tài liệu tổng quan

Tài liệu gộp toàn bộ thông tin dự án: kiến trúc, luồng thanh toán, database, migrations, troubleshooting.

---

## 1. Tổng quan dự án

### 1.1 Cấu trúc monorepo

- **apps/server**: API Express 5, TypeScript, Prisma + PostgreSQL, Redis (optional)
- **apps/web**: SPA React 19, Vite 6, Tailwind 4, TanStack Query
- **packages/**: api, config, db, env (shared)

### 1.2 Luồng thanh toán chính

- **Mcoin**: confirmBalancePayment → trừ ví → order_customer + wallet_transaction + order_list → Telegram
- **QR**: createPayment → order_customer + MAVP → user quét QR → Webhook SePay → order_list → Telegram
- **id_order**: MAVL (lẻ), MAVC (CTV), MAVK (Deal Sốc) — mỗi sản phẩm 1 id_order unique
- **API create-codes**: POST `/api/payment/create-codes` sinh orderIds + transactionId, check trùng DB trước khi trả

### 1.3 Giỏ hàng (2 nút)

- Thanh Toán Mcoin (disable khi số dư < tổng)
- Mua Siêu Tốc Qua... (QR)

---

## 2. Database Schema

### 2.1 Bảng product

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | PK | |
| category_id | FK | |
| package_name | text | Tên gói (API trả `name`) |
| created_at, updated_at | timestamptz | |
| is_active | boolean | Default true |

### 2.2 Bảng variant

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | PK | |
| product_id | FK | |
| variant_name, display_name | text | |
| form_id | text | |
| is_active | boolean | |
| updated_at | timestamptz | |
| UNIQUE(product_id, display_name) | | |

### 2.3 Bảng order_list

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id_order | varchar, UNIQUE | Mã đơn |
| id_product | int | variant_id |
| order_date, days | | |
| expired_at | timestamptz | Ngày hết hạn (trước: order_expired) |
| status | | Hết Hạn, Chưa Hoàn, Đã Hoàn, Đang Xử Lý, … |
| supply_id | int | id supplier |

**order_expired, order_canceled**: Đã deprecated. Toàn bộ dữ liệu gom vào order_list.

### 2.4 Bảng order_customer

| Cột | Ghi chú |
|-----|---------|
| id_order | UNIQUE, mỗi sản phẩm 1 mã |
| account_id | |
| status | "Đang Tạo Đơn" khi tạo |
| payment_id | FK wallet_transaction.id |

### 2.5 Bảng wallet_transaction

| Cột | Ghi chú |
|-----|---------|
| method | Mcoin \| QR |
| promotion_id | (đã xóa promo_code) |
| transaction_id | MAVPXXXXXX (nội dung chuyển khoản QR) |

### 2.6 Materialized views

- **product.variant_sold_count**: Đếm variant đã bán từ order_list
- **product.product_sold_count**: Tổng đã bán theo product
- **product.product_sold_30d**: Thống kê 30 ngày
- Refresh: `SELECT product.refresh_variant_sold_count();`, `product.refresh_product_sold_30d();`

---

## 3. Migrations — Chạy tất cả

**File duy nhất**: `packages/db/prisma/migrations/all_migrations.sql`

Gom toàn bộ migrations: package_name, schema updates, expired_at, supply_id, index, materialized views, order system.

```bash
# Chạy tất cả migrations (khuyến nghị)
npm run db:migrate:all -w @my-store/db

# Hoặc chạy từng script riêng (nếu cần)
npm run db:migrate:package-name -w @my-store/db
npm run db:migrate:schema-updates -w @my-store/db
npm run db:migrate:rename-order-expired -w @my-store/db
npm run db:migrate:variant-sold-count -w @my-store/db
npm run db:migrate:variant-index -w @my-store/db
```

---

## 4. Config & Môi trường

### 4.1 Database

- `DATABASE_URL`: Connection string PostgreSQL
- Config: `apps/server/src/config/db.config.ts`, `database.ts`
- Pool: max 20, idleTimeout 30s, connectionTimeout 10s

### 4.2 Telegram

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| TELEGRAM_BOT_TOKEN | Có | Token từ @BotFather |
| TELEGRAM_CHAT_ID | Có | ID group |
| TELEGRAM_TOPIC_ID | Không | Topic forum (SEND_ORDER_TO_TOPIC=true) |

### 4.3 CORS

- `CORS_ORIGIN`: Cho phép origin (vd. https://mavrykpremium.store)
- Code tự thêm www / non-www variants

---

## 5. API chính

| Endpoint | Mô tả |
|----------|-------|
| POST /api/payment/create-codes | Sinh orderIds + transactionId |
| POST /api/payment/balance/confirm | Thanh toán Mcoin |
| POST /api/payment/create | Tạo đơn QR |
| GET /api/user/orders | Lịch sử đơn (order_customer + order_list) |
| GET /products, /promotions, /categories | Danh sách sản phẩm |

---

## 6. Lỗi thường gặp

### 6.1 column p.package_name does not exist

```bash
npm run db:migrate:package-name -w @my-store/db
```

### 6.2 relation "product.variant_sold_count" does not exist

```bash
npm run db:migrate:variant-sold-count -w @my-store/db
```

### 6.3 503 / CORS blocked

- Kiểm tra API chạy: `curl https://api.../health`
- Kiểm tra CORS_ORIGIN trong .env
- Xem `docs/TROUBLESHOOTING_NETWORK_CORS.md`

### 6.4 Redis connection timeout

- Ứng dụng fallback in-memory cache khi Redis không kết nối được

---

## 7. Order list / id_order

- **id_order**: Unique, mỗi dòng 1 mã; backend sinh qua create-codes
- **Note**: INSERT ON CONFLICT (id_order) DO UPDATE SET khi ghi order_list
- **Rủi ro**: Hai user trùng mã → ghi đè. Giải pháp: Backend sinh mã, check trùng trước khi trả

---

## 8. Notify Success Order / Bot

- **Topic 2733**: Nhận thông báo đơn mới khi thanh toán thành công
- **/done {mã đơn} TK|Note|Slot**: Bot gửi slot, note, NCC lên Server
- **API**: POST /api/orders/notify-done (id_order, slot, note, supply)

---

## 9. Tham chiếu tài liệu gốc

Các file chi tiết (có thể archive sau khi dùng OVERVIEW):

- ORDER_SYSTEM.md — Luồng thanh toán Mcoin & QR
- ORDER_SYSTEM_TASKS.md — Task triển khai
- ORDER_LIST_ID_ORDER.md — id_order, ON CONFLICT
- Notify_Succes_Order.md — Telegram, Bot /done
- ORDER_EXPIRED_ORDER_CANCELED_USAGE.md — Refactor order_expired → expired_at
- TROUBLESHOOTING_NETWORK_CORS.md — 503, CORS
- SYSTEM_EVALUATION.md — Đánh giá kiến trúc
- SCHEMA_ID_REFACTOR.md — Kế hoạch id_product → variant_id
