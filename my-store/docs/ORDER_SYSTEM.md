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
| `information_order` | TEXT (JSON)     | (1) Thông tin từ khách hoặc (2) Key/tài khoản do Shop nhập          |
| `customer`          | VARCHAR(255)    | `accounts.username`                                                 |
| `contact`           | VARCHAR(255)    | Cố định `"Website"`                                                 |
| `slot`              | **TEXT**        | Tên vị trí slot (text, không phải số)                               |
| `order_date`        | TIMESTAMP       | Ngày đăng ký (NOW)                                                  |
| `days`              | INTEGER         | Số ngày sử dụng (`--1m` → 30, `--3m` → 90…)                         |
| `order_expired`     | TIMESTAMP       | `order_date + days`                                                 |
| `price`             | DECIMAL(15,2)   | Giá website                                                         |
| `status`            | VARCHAR(50)     | Default: `"Đang Xử Lý"`                                             |

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
TELEGRAM_BOT_TOKEN=8487405918:AAGxHUHR2gH7T67HWJPGJlN9Y-fiJOxbGL0
TELEGRAM_CHAT_ID=-1002934465528
TELEGRAM_TOPIC_ID=2733
WEBHOOK_URL=https://botapi.mavrykpremium.store/webhook
WEBHOOK_SECRET=ef3ff711d58d498aa6147d60eb3923df
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

*Cập nhật lần cuối: 10/02/2026*
