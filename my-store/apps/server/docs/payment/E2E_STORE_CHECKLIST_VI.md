# Checklist kiểm thử thanh toán (staging / go-live)

Tài liệu phục vụ backlog **2.2 P0** — chạy tay trên môi trường có DB + SePay test (hoặc mock webhook) và số tiền nhỏ.

## Chuẩn bị

- URL staging web + API (`SMOKE_BASE_URL` hoặc tương đương).
- Tài khoản khách có **số dư nhỏ** (Mcoin) và tài khoản test chuyển khoản/QR.
- Log server và (nếu có) dashboard SePay để đối chiếu `transaction_id` / `order_id`.

## Mcoin (số dư)

1. Thêm sản phẩm có giá nhỏ vào giỏ → bước xác nhận → chọn **Mcoin** → xác nhận.
2. Kiểm tra: đơn tạo thành công, số dư giảm đúng, giỏ được xóa (hoặc đơn khớp giỏ).
3. **Gửi lại** cùng request xác nhận (replay) hoặc bấm đúp nhanh: hệ thống không trừ tiền hai lần / trả lỗi idempotent rõ ràng (theo triển khai hiện tại).

## QR / chuyển khoản (SePay)

1. Chọn thanh toán **QR / chuyển khoản** → có mã đơn, nội dung CK, QR hiển thị.
2. Thanh toán **số tiền nhỏ** đúng nội dung (staging).
3. Chờ webhook **PAID** → trạng thái đơn cập nhật, email/Telegram (nếu bật) gửi đúng.
4. **Webhook trùng** (SePay gửi lại cùng payload): server không tạo đơn trùng / không cộng tiền sai (xử lý idempotent — xem `SECURITY_SETUP.md`, code webhook).

## Hồi quy nhanh

- Giá dòng đơn khớp giá hiển thị giỏ (đã đồng bộ margin + `promo_cost` từ API gói).
- Timeout thanh toán: hết hạn hiển thị đúng, có thể thử lại.

Tham chiếu thêm: `README.md`, `SEPAY_SETUP.md`, `SECURITY_SETUP.md`.
