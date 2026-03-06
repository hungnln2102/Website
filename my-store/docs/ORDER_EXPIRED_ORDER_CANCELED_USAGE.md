# Tổng hợp sử dụng `order_expired` và `order_canceled`

Tài liệu này ghi chép mọi vị trí trong codebase sử dụng biến/cột/bảng `order_expired` và `order_canceled`.

---

## 1. `order_expired`

### 1.1 Frontend (apps/web)

| File | Dòng | Mô tả |
|------|------|-------|
| `src/features/profile/components/order-history/OrderDetailModal.tsx` | 122 | `item.order_expired` → parse thành `Date` để hiển thị |
| `src/features/profile/components/order-history/OrderHistoryTable.tsx` | 46 | `order.items[0]?.order_expired` lấy ngày hết hạn từ item |
| `src/features/profile/components/order-history/OrderHistoryCards.tsx` | 17 | `order.items[0]?.order_expired` → `new Date(...)` cho mobile |
| `src/features/profile/components/order-history/utils.ts` | 53 | `order.items[0]?.order_expired` hoặc fallback `calculateExpirationDate(...)` |
| `src/lib/types/api.types.ts` | 152 | Type: `order_expired?: string \| null` trong item type |

### 1.2 Backend (apps/server)

| File | Dòng | Mô tả |
|------|------|-------|
| `src/controllers/user.controller.ts` | 211 | Select `ol.order_expired as "${COLS_OL.ORDER_EXPIRED}"` trong query |
| `src/controllers/user.controller.ts` | 255 | Map `order_expired: row[COLS_OL.ORDER_EXPIRED] ?? null` |
| `src/config/db.config.ts` | 389 | Comment: order_list, order_expired, order_canceled dùng variant_id |
| `src/config/db.config.ts` | 404 | `ORDER_EXPIRED: "order_expired"` trong col mapping |
| `src/config/db.config.ts` | 417 | `TABLE: "order_expired"` |
| `src/config/db.config.ts` | 428 | `ORDER_EXPIRED: "order_expired"` |
| `src/config/db.config.ts` | 451 | `ORDER_EXPIRED: "order_expired"` |
| `src/config/status.constants.ts` | 35 | Comment: `order_expired` / `order_canceled` không còn dùng để chuyển đơn |
| `src/services/order-list.service.ts` | 33 | Comment: Parse duration để tính `order_expired` |
| `src/services/order-list.service.ts` | 53 | Comment: "12m" / "30d" để tính days và `order_expired` |

### 1.3 Database & migrations (packages/db)

| File | Dòng | Mô tả |
|------|------|-------|
| `prisma/migrations/add_orders_and_sold_count_view.sql` | 12, 20–21, 31 | Cột `order_expired TIMESTAMP`, bảng `orders.order_expired` |
| `prisma/migrations/add_orders_and_sold_count_view.sql` | 45–46, 62 | Index và SELECT từ `order_expired` |
| `prisma/migrations/add_supply_to_order_list.sql` | 1, 5 | Add `supply_id` vào bảng `order_expired` |
| `prisma/migrations/add_indexes.sql` | 25, 38 | Index `order_expired(variant_id)`, ANALYZE |
| `prisma/migrations/create_variant_sold_count_view.sql` | 12, 37, 41 | JOIN/Count từ `order_expired` |
| `scripts/run_materialized_views_beekeeper.sql` | 76 | `FROM orders.order_expired oe` |

### 1.4 Docs

| File | Dòng | Mô tả |
|------|------|-------|
| `docs/Notify_Succes_Order.md` | 67 | `order_expired` (order_date + days) trong flow tạo đơn |
| `docs/ORDER_LIST_ID_ORDER.md` | 87, 97, 165 | Upsert/kiểm tra id_order trong order_expired |

---

## 2. `order_canceled`

### 2.1 Backend (apps/server)

| File | Dòng | Mô tả |
|------|------|-------|
| `src/config/db.config.ts` | 389 | Comment: order_list, order_expired, order_canceled |
| `src/config/db.config.ts` | 440 | `TABLE: "order_canceled"` |
| `src/config/status.constants.ts` | 35 | Comment: order_expired / order_canceled không còn dùng để chuyển đơn |
| `src/services/order-list.service.ts` | 218 | Comment: Không còn chuyển sang bảng order_canceled |
| `src/services/balance-payment.service.ts` | 35 | Comment: id_order chỉ check order_list, order_customer (không dùng order_expired/order_canceled) |

### 2.2 Database & migrations (packages/db)

| File | Dòng | Mô tả |
|------|------|-------|
| `prisma/migrations/add_supply_to_order_list.sql` | 1, 6 | Add `supply_id` vào bảng `order_canceled` |

### 2.3 Docs

| File | Dòng | Mô tả |
|------|------|-------|
| `docs/ORDER_LIST_ID_ORDER.md` | 165 | id_order kiểm tra tồn tại trong order_list, order_expired, order_canceled, order_customer |

---

## 3. Tóm tắt

- **`order_expired`**: Dùng nhiều trong frontend (hiển thị ngày hết hạn), backend (select/map), DB (bảng, cột, view). Vẫn đang active để hiển thị và tính toán.
- **`order_canceled`**: Chủ yếu là bảng DB và config; các comment cho thấy **không còn chuyển đơn** vào bảng này nữa.
- **Lưu ý**: `status.constants.ts` và `order-list.service.ts` ghi rõ order_expired / order_canceled không còn dùng để chuyển đơn; `balance-payment.service.ts` cũng không check id_order trên hai bảng này.

------------------------------------------------------------------------------------------------
Order_list:
- đơn hết hạn: status == Hết Hạn ( đây là dữ liệu trước đây của bảng order_expired)
- đơn đã hoàn, chưa hoàn: status == Chưa Hoàn hoặc Đã Hoàn (đây là dữ liệu trước đây của bảng order_canceled)

Hiện tại toàn bộ dữ liệu đã được gom vào order_list hết. Nên tôi muốn refactor lại toàn bộ các biến của 2 bảng kia thành bảng order_list.

-------------------------------------------------------------------------------------------------
Giờ đơn hết hạn thì check status: Hết Hạn
đơn hủy thì check status: Chưa Hoàn, Đã Hoàn
còn lại là của đơn hàng như bình thường.

---

## 4. Kiểm tra & Ghi chú

### 4.1 Mapping status — Đúng

Trong `status.constants.ts`, `order_list.status` đã có đủ:

| Status trong order_list | Code | Ghi chú |
|-------------------------|------|---------|
| Hết Hạn | EXPIRED | Tương đương dữ liệu cũ của bảng order_expired |
| Chưa Hoàn | PENDING_REFUND | Đang chờ hoàn tiền |
| Đã Hoàn | REFUNDED | Đã hoàn tiền |

### 4.2 Luồng dữ liệu hiện tại

- **Đúng**: Không còn `INSERT` vào `order_expired` hay `order_canceled`.
- **Đúng**: API lịch sử đơn đã query từ `order_list` (`user.controller` line 211).
- **Đúng**: Bảng `order_list` có cột `order_expired` (date) và `status`.

### 4.3 Checklist refactor — Đã hoàn thành

| Loại | Trạng thái |
|------|------------|
| Frontend | ✅ Đã dùng order_list (API trả order_expired từ order_list) |
| Backend user.controller | ✅ Đã query từ order_list |
| DB views/scripts | ✅ Đã refactor: create_variant_sold_count_view.sql, run_materialized_views_beekeeper.sql |
| db.config.ts | ✅ Đã xóa config ORDER_EXPIRED, ORDER_CANCELED (bảng) |
| Migrations | Giữ lại (add_orders_and_sold_count, add_supply, add_indexes — không sửa vì đã chạy) |

**Đã refactor (6/2025)**: Đổi tên cột `order_list.order_expired` → `expired_at` để loại bỏ hoàn toàn tên `order_expired`. Chạy `npm run db:migrate:rename-order-expired` để áp dụng.

---

## 5. Lỗi "relation product.variant_sold_count does not exist"

Nếu server báo lỗi khi warm-up cache, chạy migration:

```bash
cd packages/db && npm run db:migrate:variant-sold-count
```

Cần có `DATABASE_URL` trong `apps/server/.env` và database đang chạy.