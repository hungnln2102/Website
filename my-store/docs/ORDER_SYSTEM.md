# HỆ THỐNG LỊCH SỬ ĐƠN HÀNG (v2) — FINAL

> Tài liệu thiết kế hệ thống đơn hàng cho Mavryk Premium Store.  
> **Trạng thái**: ✅ Đã xác nhận — Sẵn sàng triển khai

---

## 1. TỔNG QUAN FLOW

```
Khách chọn SP → Điền form → Thanh toán (MCoin/SePay)
                    ↓
         Server INSERT order_list + order_customer
                    ↓
         Gửi thông báo → Telegram Topic
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
[✅ Hoàn thành đơn]      [📝 Điền thông tin SP]
    ↓                               ↓
status → "Đã Thanh Toán"    Nhập key/tài khoản
order_expired → NOW()+days          ↓
                           Gửi JSON về webhook
                                    ↓
                           Cập nhật information_order
                                    ↓
                           Khách xem trên web
```

---

## 2. DATABASE SCHEMA

### 2.1. Bảng `customer.order_customer` (MỚI)

```sql
CREATE TABLE customer.order_customer (
    id_order    TEXT        NOT NULL,
    customer    INT4        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'Đang Xử Lý',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_order_customer PRIMARY KEY (id_order, customer)
);
```

> **Lưu ý**: Chỉ cần lưu `id_order` và `customer`. Các thông tin khác lấy từ JOIN với `order_list`, `order_expired`, `order_canceled`.

### 2.2. Bảng `orders.order_list` (Cập nhật)

| Column              | Type            | Mô tả                                                               |
| ------------------- | --------------- | ------------------------------------------------------------------- |
| `id`                | SERIAL PK       | Auto increment                                                      |
| `id_order`          | VARCHAR(255) UQ | Prefix `MAVL-` (thường) / `MAVK-` (khuyến mãi) + 6 ký tự ngẫu nhiên |
| `id_product`        | VARCHAR(255)    | `variant.display_name` (vd: `ChatGPT Plus--1m`)                     |
| `account_id`        | INTEGER FK      | Ref → `customer.accounts(id)`                                       |
| `information_order` | TEXT (JSON)     | (1) **Thông tin từ khách**: form bổ sung (email, ghi chú…) + name/quantity/unitPrice; (2) **Key/tài khoản** do Shop nhập (Telegram webhook) |
| `customer`          | VARCHAR(255)    | `accounts.username`                                                 |
| `contact`           | VARCHAR(255)    | Cố định `"Website"`                                                 |
| `slot`              | **TEXT**        | Tên vị trí slot (text, không phải số)                               |
| `order_date`        | TIMESTAMP       | Ngày đăng ký (NOW)                                                  |
| `days`              | INTEGER         | Số ngày sử dụng (`--1m` → 30, `--3m` → 90…)                         |
| `order_expired`     | TIMESTAMP       | `order_date + days`                                                 |
| `price`             | DECIMAL(15,2)   | Giá website                                                         |
| `status`            | VARCHAR(50)     | Default: `"Đang Xử Lý"`                                             |

### 2.3. Bảng `orders.order_expired` (tham chiếu)

Bảng phụ (vd. mapping id_product → logic hết hạn). Trong code hiện tại có:

| Column     | Type   | Mô tả        |
| ---------- | ------ | ------------ |
| `id`       | (PK)   | —            |
| `id_product` | VARCHAR | Ref sản phẩm |

Chi tiết schema thực tế cần xem migration / DB. Dùng khi JOIN để lấy thông tin hết hạn theo sản phẩm nếu cần.

### 2.4. Bảng `order_canceled` (tùy chọn)

Doc nhắc JOIN với `order_canceled` nhưng **chưa định nghĩa schema** và chưa có trong db.config. Nếu dùng: cần thêm bảng (vd. `id_order`, `canceled_at`, lý do). Nếu không dùng, bỏ qua trong JOIN và chỉ dùng `order_list` + `order_expired`.

---

## 2.5. Luồng "Thông tin bổ sung" (form khách điền khi mua)

| Bước | Mô tả |
|------|--------|
| 1. Thu thập | Trang sản phẩm: khách chọn gói + thời gian → form động (theo `form_id` của variant) hiển thị các ô (vd. Email, Ghi chú). Khách điền và bấm "Mua ngay" / "Thêm vào giỏ". |
| 2. Lưu tạm | Frontend: khi thêm vào giỏ, mỗi item trong giỏ (state + localStorage) có `additionalInfo` và `additionalInfoLabels`. **API cart (addToCart/sync)** hiện **không** gửi/nhận thông tin bổ sung — chỉ có name, packageName, duration, price… |
| 3. Khi thanh toán | **Hiện tại**: Bước xác nhận thanh toán (MCoin) chỉ gửi lên server `id_product`, `name`, `quantity`, `price`. Server ghi `information_order` = `{ name, quantity, unitPrice }` — **không có** nội dung form bổ sung. |
| 4. Mong muốn (doc) | `information_order` phải chứa cả (1) thông tin từ khách (form bổ sung) và (2) sau này key/tài khoản do Shop nhập. Khi thanh toán, frontend gửi kèm thông tin bổ sung từng dòng; server merge vào JSON và lưu vào `information_order`. |

**Hành động cần làm**: (1) PaymentStep gửi thêm `additionalInfo` (và tùy chọn `additionalInfoLabels`) trong từng item khi gọi `confirmBalancePayment`. (2) API confirm balance nhận và ghi vào `information_order` dạng JSON: `{ name, quantity, unitPrice, ...additionalInfo }`. (3) Tùy chọn: mở rộng cart API để lưu thông tin bổ sung vào `cart_items.extra_info` khi add/sync, để đồng bộ giữa thiết bị và khi fetch lại giỏ.

---

## 3. LOGIC TRẠNG THÁI

```
remaining_days = order_expired - NOW()

Khi vừa tạo đơn (chưa xác nhận)   → "Đang Xử Lý"    🟡
Khi remaining_days > 4            → "Đã Thanh Toán"  🟢
Khi remaining_days <= 4 và > 0    → "Cần Gia Hạn"    🟠
Khi remaining_days <= 0           → "Hết Hạn"        🔴
```

> Status được tính **động** phía client dựa trên `order_expired`.

---

## 4. FORMAT MÃ ĐƠN HÀNG

| Loại đơn       | Prefix   | Ví dụ          |
| -------------- | -------- | -------------- |
| Đơn thường     | `MAVL-`  | `MAVL-A3F8K2`  |
| Đơn khuyến mãi | `MAVK-`  | `MAVK-B7D2X9`  |

- **Random**: 6 ký tự chữ+số viết hoa
- **Không trùng lặp**: Check DB trước khi insert

---

## 5. DURATION MAPPING

| Suffix    | Days | Hiển thị  |
| --------- | ---- | --------- |
| `--1d`    | 1    | 1 ngày    |
| `--1m`    | 30   | 1 tháng   |
| `--2m`    | 60   | 2 tháng   |
| `--3m`    | 90   | 3 tháng   |
| `--6m`    | 180  | 6 tháng   |
| `--12m`   | 365  | 1 năm     |

---

## 6. TELEGRAM CONFIG

```env
# Dùng biến môi trường, KHÔNG commit token/secret thật vào repo
TELEGRAM_BOT_TOKEN=<your_bot_token>
TELEGRAM_CHAT_ID=<chat_id>
TELEGRAM_TOPIC_ID=<topic_id>
WEBHOOK_URL=https://botapi.mavrykpremium.store/webhook
WEBHOOK_SECRET=<webhook_secret>
```

### Flow Telegram

1. **Tạo đơn** → Gửi thông báo đến Topic với 2 buttons:
   - `[✅ Hoàn thành đơn]` → Cập nhật status + order_expired
   - `[📝 Điền thông tin SP]` → Mở form nhập key/tài khoản

2. **Điền thông tin SP**:
   - Shop nhập key hoặc tài khoản/mật khẩu qua Telegram
   - Bot gửi JSON về webhook
   - Server cập nhật `information_order`
   - Khách xem thông tin trong trang lịch sử đơn hàng

---

## 7. CÁC FILE CẦN THAY ĐỔI

> Dữ liệu lưu vào `customer.order_customer`. Dùng `id_order` để JOIN với `order_list`, `order_expired`, `order_canceled`.

| #   | File                                                   | Thay đổi                                                                                           |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 1   | `apps/server/src/services/balance-payment.service.ts`  | INSERT vào `customer.order_customer` với `id_order` + `customer` (account_id)                      |
| 2   | `apps/server/src/controllers/user.controller.ts`       | `getOrders()` JOIN `order_customer` với `order_list`, `order_expired`, `order_canceled` + `variant` |
| 3   | `apps/web/src/lib/types/api.types.ts`                  | Cập nhật `UserOrder` type: thêm `slot`, `days`, `order_expired`, `variant_name`                    |
| 4   | `apps/web/src/features/profile/ProfilePage.tsx`        | Redesign bảng, tính status động                                                                    |
| 5   | **MỚI** `apps/server/src/services/telegram.service.ts` | Service gửi notification + inline keyboard                                                         |
| 6   | **MỚI** `apps/server/src/routes/telegram.route.ts`     | Webhook endpoint nhận callback                                                                     |

---

## 8. GIAO DIỆN FRONTEND

### Bảng lịch sử đơn hàng

| Cột                    | Data source                          |
| ---------------------- | ------------------------------------ |
| Mã Đơn Hàng            | `id_order`                           |
| Sản phẩm               | `variant_name` + duration            |
| Thông tin đơn hàng     | `information_order` (JSON parsed)    |
| Slot                   | `slot` hoặc `—`                      |
| Thời gian              | `order_date` → `order_expired`       |
| Trạng thái             | Tính động từ `order_expired`         |

### Bộ lọc
- Mã đơn hàng (text search)
- Số tiền từ / đến
- Từ ngày / Đến ngày

---

## 9. TIẾN ĐỘ TRIỂN KHAI

| Phase | Nội dung                                   | Trạng thái |
| ----- | ------------------------------------------ | ---------- |
| 1     | Cập nhật DB schema + INSERT logic          | ⬜ Chờ     |
| 2     | Cập nhật API `getOrders` trả đủ fields     | ⬜ Chờ     |
| 3     | Redesign Frontend bảng lịch sử             | ⬜ Chờ     |
| 4     | Telegram Bot service + webhook             | ⬜ Chờ     |
| 5     | Testing + fix bugs                         | ⬜ Chờ     |

---

## 10. ĐỐI CHIẾU VỚI CODE HIỆN TẠI — ĐIỂM CÒN THIẾU

> Phần này liệt kê những gì tài liệu yêu cầu nhưng chưa có trong code, hoặc khác với code.

### 10.1. Flow & nguồn đơn

| Yêu cầu doc | Hiện trạng code |
| ----------- | ----------------- |
| Thanh toán MCoin/SePay → INSERT `order_list` + `order_customer` | **MCoin**: Chỉ INSERT `order_list` (balance-payment.service), chưa INSERT `order_customer`. **SePay**: Webhook chỉ log, chưa insert/update order (TODO trong sepay.service). |
| Khi "Hoàn thành đơn" → cập nhật status + order_expired | Chưa có: không có Telegram bot, không có endpoint cập nhật. |

**Thiếu trong doc**:  
- **SePay**: Cần quyết định khi nào tạo bản ghi `order_list` — (A) Tạo đơn "pending" ngay khi user chọn thanh toán SePay (trước redirect), rồi webhook cập nhật status + order_expired; hoặc (B) Chỉ tạo đơn khi webhook PAID. Nên mô tả rõ trong Section 1.

### 10.2. Database

| Yêu cầu doc | Hiện trạng code |
| ----------- | ----------------- |
| Bảng `customer.order_customer` | Chưa có trong code (chưa INSERT, chưa dùng). |
| `order_list`: đủ cột customer, contact, slot, days, order_expired | db.config có đủ COLS. balance-payment INSERT chỉ dùng: id_order, id_product, account_id, price, order_date, status, information_order — **thiếu** customer, contact, slot, days, order_expired. |
| JOIN với `order_expired`, `order_canceled` | `order_expired` có trong db.config (bảng riêng). **order_canceled** không có trong db.config và không xuất hiện trong code — cần thêm schema trong doc hoặc ghi chú "tùy chọn / chưa triển khai". |

### 10.3. Format mã đơn hàng

| Doc | Code |
| --- | ----- |
| Prefix `MAVL-` / `MAVK-` + 6 ký tự | Frontend (payment.api.ts) dùng `ORD-YYYYMMDD-xxxxxx` (vd: ORD-20260221-ABC123). **Chưa thống nhất** với doc — cần đổi client hoặc cập nhật doc. |

### 10.4. API & types

| Yêu cầu doc | Hiện trạng code |
| ----------- | ----------------- |
| getOrders() JOIN order_customer, order_list, order_expired, order_canceled, variant | getOrders() chỉ đọc từ `order_list` theo account_id, không JOIN order_customer / order_expired / order_canceled / variant. |
| UserOrder: thêm slot, days, order_expired, variant_name | api.types.ts: UserOrder chỉ có id_order, order_date, status, items — **chưa có** slot, days, order_expired, variant_name. |

### 10.5. Frontend (ProfilePage)

| Yêu cầu doc | Hiện trạng code |
| ----------- | ----------------- |
| Cột: Mã đơn, Sản phẩm (variant_name + duration), Thông tin đơn, Slot, Thời gian (order_date → order_expired), Trạng thái (tính động) | Có Mã đơn, ngày, items (name/id_product), tổng tiền, status từ API — **chưa có** slot, order_expired, variant_name, duration; status chưa tính động từ order_expired. |
| Bộ lọc: Mã đơn, Số tiền từ/đến, Từ ngày/Đến ngày | Đã có đủ các bộ lọc này. |

### 10.6. Telegram & webhook

| Yêu cầu doc | Hiện trạng code |
| ----------- | ----------------- |
| telegram.service.ts, telegram.route.ts | **Chưa tồn tại** (chưa tạo file). |
| Webhook nhận callback từ bot (điền thông tin SP) → cập nhật information_order | Chưa có endpoint; doc chưa mô tả payload JSON và route (method, path) cho webhook này. |

### 10.7. Bảng order_expired (schema)

Doc nhắc JOIN với `order_expired` nhưng không mô tả schema. Trong db.config: `order_expired` có `id`, `id_product`. Nên thêm vào Section 2 một bảng mô tả ngắn: cột, ý nghĩa, quan hệ với order_list (nếu có).

### 10.8. Tóm tắt hành động đề xuất

1. **Doc**: Thêm schema/ghi chú cho `order_canceled`; thêm mô tả schema `order_expired`; mô tả rõ flow SePay (khi nào tạo/cập nhật đơn); thêm spec webhook Telegram (payload + route).
2. **Bảo mật**: Token/secret Telegram dùng env, không ghi giá trị thật trong doc (đã sửa Section 6).
3. **Code**: Làm theo Phase 1–5 trong Section 9; đồng bộ format mã đơn (MAVL/MAVK vs ORD) giữa frontend và doc.

---

*Cập nhật lần cuối: 21/02/2026*
