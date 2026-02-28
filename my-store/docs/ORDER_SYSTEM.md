# Hệ thống đơn hàng & thanh toán

Tài liệu mô tả quy trình thanh toán từ giỏ hàng, luồng Mcoin & QR, và cấu trúc dữ liệu `order_customer` / `wallet_transaction`.

---

## 1. Giao diện giỏ hàng

- **Nút "Thanh Toán"** → đổi text thành **"Thanh Toán Mcoin"**.
- **Giữ nguyên** nút **"Mua Siêu Tốc Qua..."** (thanh toán QR).
- **Loại bỏ** 3 nút thanh toán còn lại.
- **Loại bỏ** 2 dòng text: "Số dư hiện tại" và "Số tiền cần nạp thêm".

Kết quả: giỏ hàng chỉ còn 2 lựa chọn thanh toán — **Thanh Toán Mcoin** và **Mua Siêu Tốc Qua...**.

---

## 2. Thanh toán Mcoin

### 2.1 Điều kiện

- So sánh: **Tổng giá trị thanh toán** với **Số dư Mcoin** (`wallet.balance`).
- **Số dư không đủ** → disable (không cho bấm) nút "Thanh Toán Mcoin".
- **Số dư đủ** → cho phép bấm, chuyển sang bước xác nhận.

### 2.2 Luồng

1. User bấm **Thanh Toán Mcoin** → sang **bước 2: trang xác nhận thanh toán**.
2. User bấm **Xác nhận thanh toán** → xử lý thanh toán → **thông báo thanh toán thành công**.
3. Backend:
   - Tạo đơn trong `order_customer`.
   - Tạo giao dịch trong `wallet_transaction` (method = Mcoin, cập nhật balance).

### 2.3 Dữ liệu ghi nhận

- **order_customer**: theo mục 4.1.
- **wallet_transaction**: theo mục 4.2, với:
  - `method` = **Mcoin**
  - `balance_before` / `balance_after`: balance thực tế trước và sau giao dịch (trừ tiền).

---

## 3. Thanh toán QR (Mua Siêu Tốc Qua...)

### 3.1 Luồng

1. User bấm **Mua Siêu Tốc Qua...** → sang **trang xác nhận thanh toán**.
2. User bấm **Xác nhận thanh toán** → sang **bước 3: thanh toán quét mã QR**.
3. **Nội dung chuyển khoản** hiển thị cho khách: **mã transaction** (định dạng `MAVPXXXXXX`).
4. User quét QR và chuyển khoản thành công → **Sepay** gửi **webhook** về backend (đã tích hợp sẵn).
5. Backend xử lý webhook → cập nhật trạng thái → **thông báo thanh toán thành công** cho user.

### 3.2 Dữ liệu ghi nhận

- **order_customer**: giống luồng Mcoin (mục 4.1).
- **wallet_transaction**: giống mục 4.2, với:
  - `method` = **QR**
  - `balance_before` = `balance_after` = balance hiện tại (không đổi, vì tiền chưa cộng khi tạo giao dịch; cập nhật khi webhook xác nhận nếu có quy định riêng).

---

## 4. Cấu trúc dữ liệu

### 4.1 Bảng `order_customer`

| Trường       | Mô tả |
|-------------|--------|
| `id_order`  | Mã đơn **duy nhất**, không trùng. **Mỗi sản phẩm = 1 dòng = 1 id_order riêng.** Sinh khi thanh toán thành công. Định dạng: **MAVL** (khách lẻ / đơn không khuyến mãi), **MAVC** (khách CTV), **MAVK** (đơn Deal Sốc). Khách: MAVL hoặc MAVK; CTV: chỉ MAVC. Nhiều sản phẩm thanh toán cùng lúc = 1 `wallet_transaction` (cùng `payment_id`) nhưng nhiều dòng `order_customer`, mỗi dòng có `id_order` khác nhau. |
| `account_id` | ID tài khoản. |
| `status`    | Khi tạo đơn thành công: luôn **"Đang Tạo Đơn"**. |
| `payment_id`| FK tham chiếu **`id`** (khóa tự tăng) của bảng `wallet_transaction`. |

### 4.2 Bảng `wallet_transaction`

| Trường            | Mô tả |
|-------------------|--------|
| `id`              | Khóa chính, tự tăng — dùng cho `order_customer.payment_id`. |
| `transaction_id`  | Mã giao dịch, định dạng **MAVPXXXXXX** (dùng làm nội dung chuyển khoản QR). |
| `account_id`      | ID tài khoản. |
| `type`            | **PURCHASE** cho thanh toán đơn hàng. Các type khác: TOP_UP, WITHDRAW, REFUND, TRANSFER_IN, TRANSFER_OUT. |
| `direction`       | **DEBIT** hoặc **CREDIT**. |
| `amount`          | Số tiền. |
| `balance_before`  | Số dư trước giao dịch. |
| `balance_after`   | Số dư sau giao dịch. |
| `method`          | **Mcoin** khi thanh toán Mcoin; **QR** khi thanh toán quét QR. |
| `promotion_id`    | FK đối chiếu bảng `promotion`. |

**Lưu ý:** Cột `promo_code` đã xóa hẳn khỏi database và config; chỉ dùng `promotion_id`.

---

## 5. Tóm tắt quy tắc

- **id_order:** **Không được trùng; mỗi sản phẩm = 1 id_order riêng** (mỗi dòng `order_customer` có mã duy nhất). Prefix: MAVL (lẻ / không khuyến mãi), MAVC (CTV), MAVK (Deal Sốc). Khách: MAVL hoặc MAVK; CTV: chỉ MAVC.
- **payment_id:** tham chiếu `wallet_transaction.id` (tự tăng).
- **direction:** DEBIT | CREDIT.
- **Nội dung chuyển khoản QR:** mã `transaction_id` (MAVPXXXXXX).
- **Cổng QR:** Sepay, webhook đã có trong hệ thống.
- **promo_code:** đã xóa, chỉ dùng `promotion_id`.

---

## 6. Thông báo Telegram khi thanh toán thành công

Khi hiển thị thông báo thanh toán thành công, backend **gửi thêm 1 tin nhắn** vào Telegram.

- **Đích:** topic có id = **2733**.

### 6.1 Định dạng nội dung tin nhắn

- **Mã Đơn Hàng**  
  Mã đơn (id_order: MAVL/MAVC/MAVK…).

- **Sản Phẩm:**  
  Chuỗi sản phẩm: `variant_id` + `--xm` hoặc `--xd` đã được chuyển đổi thành **tháng** hoặc **ngày**.  
  Trong dự án đã có sẵn component xử lý chuyển đổi `--xm` / `--xd`; dùng component đó để tạo nội dung dòng Sản Phẩm.

- **Thông tin bổ sung:**  
  Lấy từ dữ liệu thông tin bổ sung của từng sản phẩm. Nguồn: cột **`extra_info`** (JSON) của bảng **`cart_item`** — mỗi sản phẩm trong giỏ đã được gắn form thông tin bổ sung tương ứng, nội dung gửi Telegram phản ánh đúng các field trong `extra_info` đó.
