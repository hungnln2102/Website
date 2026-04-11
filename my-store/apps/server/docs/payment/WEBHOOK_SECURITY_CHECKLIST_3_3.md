# Payment/Webhook Security Checklist (3.3)

Mục tiêu: checklist vận hành bắt buộc cho payment callback/webhook trước khi release production.

## 1) Chữ ký (Signature) - Bắt buộc

- [ ] Tất cả callback/webhook từ gateway đều yêu cầu chữ ký (`signature` hoặc `x-sepay-signature`).
- [ ] Khi thiếu chữ ký: trả `401` và **không** thực thi nghiệp vụ cập nhật đơn hàng.
- [ ] Khi chữ ký sai: trả `401` và **không** thực thi nghiệp vụ cập nhật đơn hàng.
- [ ] Dùng HMAC-SHA256 với secret production, không dùng key test cho production.
- [ ] Secret gateway lưu trong biến môi trường, không hardcode trong code/repo.
- [ ] Rotate secret ngay khi nghi ngờ lộ key hoặc sau mỗi chu kỳ bảo mật nội bộ.

## 2) Idempotency - Bắt buộc

- [ ] Webhook gửi lặp lại (gateway retry hoặc replay) không tạo trạng thái/đơn giao dịch trùng.
- [ ] Luồng cập nhật đơn hàng có điều kiện trạng thái rõ ràng (chỉ chuyển trạng thái hợp lệ).
- [ ] Có khóa định danh idempotent theo `order_invoice_number` hoặc `transaction_id`.
- [ ] Có test tay với kịch bản webhook duplicate và callback duplicate.
- [ ] Có log sự kiện duplicate (mức info/warn) để giám sát, không coi là lỗi hệ thống.

## 3) HTTPS & Network - Bắt buộc

- [ ] URL callback/webhook production luôn là `https://...`, không dùng `http://`.
- [ ] TLS chứng chỉ hợp lệ, không self-signed ở production.
- [ ] Reverse proxy giữ đúng `X-Forwarded-*` để log IP và điều tra chính xác.
- [ ] Không expose endpoint webhook trên domain staging/dev cho môi trường production.
- [ ] Giới hạn truy cập theo WAF/rate-limit phù hợp (đã áp dụng webhook limiter).

## 4) Logging & PII Hygiene - Bắt buộc

- [ ] Không log toàn bộ payload gateway thô trong `security`/`payment` logs.
- [ ] Không log full chữ ký, API key, token; chỉ log prefix ngắn để truy vết.
- [ ] Chỉ log metadata tối thiểu: `orderId`, `ip`, `payloadKeys`, trạng thái xử lý.
- [ ] Log lỗi phải loại bỏ dữ liệu nhạy cảm trước khi ghi.
- [ ] Có quy trình rà soát log định kỳ để phát hiện rò rỉ dữ liệu.

## 5) Go-live verification

- [ ] Chạy lại `apps/server/docs/payment/E2E_STORE_CHECKLIST_VI.md`.
- [ ] Kiểm tra callback `success/error/cancel` không bypass signature.
- [ ] Kiểm tra webhook trả mã đúng (`200`, `401`, `500`) theo từng case.
- [ ] Xác nhận alert/monitoring cho tỷ lệ webhook fail tăng bất thường.
- [ ] Lưu biên bản kiểm thử (ngày, người test, môi trường, commit hash).

## 6) Mapping code hiện tại

- Middleware/routing: `apps/server/src/modules/payment/payment.routes.ts`
- Controller callback/webhook: `apps/server/src/modules/payment/payment.controller.ts`
- Signature verify + xử lý webhook: `apps/server/src/modules/payment/sepay.service.ts`
- Rate limit webhook: `apps/server/src/shared/middleware/rate-limiter.ts`

