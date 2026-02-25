# Tổng quan thay đổi ID / Ref (kế hoạch)

> Tài liệu ghi nhận hướng thay đổi dùng **id cố định/string** sang **id tham chiếu chuẩn** (variant, supply).  
> Dùng khi refactor schema và code liên quan.

---

## 1. `id_product` → ID của variant

**Hiện trạng**

- Trong `orders.order_list` (và các chỗ liên quan), cột **`id_product`** đang lưu dạng giá trị **cố định / string** (ví dụ: `variant.display_name` kiểu `"ChatGPT Plus--1m"`).
- Join với bảng variant thường dựa trên `display_name` hoặc parse string, không phải khóa ngoại numeric/uuid.

**Hướng thay đổi**

- **Sau này** chuyển `id_product` sang lưu **id của variant** (khóa chính bảng variant, kiểu int/uuid tùy schema).
- Mục tiêu:
  - Tham chiếu rõ ràng, đúng chuẩn FK.
  - Bớt phụ thuộc vào format string (`display_name`, `--1m`…).
  - Dễ join, báo cáo và mở rộng (nhiều variant, đổi tên hiển thị không ảnh hưởng dữ liệu đơn hàng).

**Ảnh hưởng (khi làm)**

- Schema: đổi kiểu/ý nghĩa cột `id_product` (hoặc thêm cột mới rồi migrate).
- Backend: order creation, payment, balance-payment, user.controller getOrders, v.v. — truyền/đọc **variant id** thay vì `display_name`.
- Frontend: API trả về variant id; client dùng id để hiển thị (lấy tên/gói từ variant/catalog).
- Validation: đảm bảo variant id tồn tại trước khi tạo/cập nhật đơn.

---

## 2. Supply → `id_supply`

**Hiện trạng**

- Trường **supply** (trong order hoặc logic liên quan) đang có thể dùng dạng text/cố định hoặc không thống nhất.

**Hướng thay đổi**

- Supply cũng chuyển sang dùng **`id_supply`** (id tham chiếu đến bảng supply tương ứng).
- Mục tiêu:
  - Một nguồn cung ứng = một bản ghi có id; đơn hàng chỉ lưu `id_supply`.
  - Dễ đổi tên/merge supply mà không phá dữ liệu đơn.

**Ảnh hưởng (khi làm)**

- Schema: cột supply → `id_supply` (kiểu int/uuid, FK tới bảng supply).
- Backend: mọi chỗ ghi/đọc supply đều dùng `id_supply`.
- Frontend / báo cáo: hiển thị tên supply qua JOIN với bảng supply.

---

## 3. Tóm tắt

| Hiện tại / Cũ     | Sau này (kế hoạch) |
|-------------------|---------------------|
| `id_product` (string/display_name) | `id_product` hoặc cột mới = **id variant** (FK) |
| `supply` (text/cố định)            | **`id_supply`** (FK → bảng supply)            |

Khi triển khai từng bước: cập nhật schema → migration dữ liệu → cập nhật API và frontend theo từng module (order, payment, profile order history, v.v.).
