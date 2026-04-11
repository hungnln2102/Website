# Backlog: Tối ưu hệ thống, UX và bảo mật (My-Store)

Tài liệu gom **việc cần làm** theo ba trụ cột, có **mức ưu tiên** (P0 = làm trước khi mở rộng / go-live nghiêm túc; P1 = sớm sau go-live; P2 = cải tiến dài hạn). Đánh dấu `[ ]` → `[x]` khi hoàn thành.

Tham chiếu thêm: `docs/WEBSITE_PRODUCTION_READINESS_ASSESSMENT.md`, `docs/OVERVIEW.md`, `apps/server/docs/payment/`.

---

## 0. Quy ước ưu tiên

| Mức | Ý nghĩa |
|-----|---------|
| **P0** | Rủi ro vận hành, bảo mật, hoặc mất dữ liệu / tiền |
| **P1** | Hiệu năng, UX quan trọng, giám sát, kiểm thử tự động |
| **P2** | Tinh chỉnh, tài liệu, tối ưu sâu |

---

## 1. Tối ưu hệ thống (hiệu năng, độ tin cậy, hạ tầng)

### 1.1 Cơ sở dữ liệu & truy vấn

- [ ] **P0** Xác nhận production: `pricing_tier`, `variant_margin`, `supplier_cost`, MV bán hàng, job refresh MV sau deploy / theo lịch.
- [ ] **P0** Đo thời gian phản hồi `/products`, `/promotions` (p95/p99); ghi lại baseline.
- [ ] **P1** Rà EXPLAIN cho các SQL nặng; chỉ mục / điều kiện WHERE phù hợp nếu thiếu.
- [ ] **P1** Tránh N+1 ở layer service (nếu có); cache kết quả chỉ khi đã định nghĩa TTL và invalidation.
- [ ] **P2** Đánh giá connection pool Prisma/DB theo tải thực tế.

### 1.2 Redis & cache (nếu dùng)

- [ ] **P0** Tài liệu hành vi khi Redis down: graceful degrade hay 500 — và test một lần.
- [ ] **P1** Readiness (hoặc health) phản ánh phụ thuộc Redis nếu feature bắt buộc Redis.
- [ ] **P2** Chiến lược key naming, TTL thống nhất, tránh cache stampede.

### 1.3 API & server

- [ ] **P1** Chuẩn hóa **correlation id** (header + log) xuyên suốt request.
- [ ] **P1** Log level production; rà soát không log body chứa PII/token/OTP.
- [ ] **P2** Metrics cơ bản (RPS, latency, error rate theo route quan trọng).
- [ ] **P2** Timeout hợp lý upstream (admin proxy, SePay, email) — tách timeout ngắn cho đọc catalog vs thao tác dài.

### 1.4 Cron & scale ngang

- [ ] **P1** Xác nhận chỉ **một instance** chạy job định kỳ khi scale ngang (leader election hoặc tách worker).
- [ ] **P2** Queue cho tác vụ nền nặng (email, notify) nếu tải tăng.

### 1.5 Build & CI

- [ ] **P1** Gate CI: `tsc --noEmit` (web + server) bắt buộc pass.
- [ ] **P1** Smoke tự động: `/health/db`, `/products`, `/promotions` trên staging.
- [ ] **P2** Bundle analysis frontend; lazy route cho màn ít dùng.

---

## 2. Tối ưu người dùng (UX, frontend, nội dung lỗi)

### 2.1 Lỗi & trạng thái tải

- [ ] **P1** Thông báo lỗi thân thiện khi API 500 / timeout (đặc biệt giỏ hàng, thanh toán, Renew Adobe).
- [ ] **P1** Skeleton / loading rõ ràng cho catalog, chi tiết sản phẩm, thanh toán.
- [ ] **P2** Retry có backoff cho lỗi mạng tạm thời (idempotent GET).

### 2.2 Luồng mua hàng & thanh toán

- [ ] **P0** Kiểm thử end-to-end: Mcoin + QR (staging), số tiền nhỏ, webhook trùng (theo tài liệu payment).
- [ ] **P1** Đồng bộ hiển thị giá giỏ với trang chi tiết (cùng nguồn margin).
- [ ] **P2** Rút gon bước không cần thiết trên mobile.

### 2.3 Bảo trì & định tuyến

- [ ] **P1** Test 503 maintenance: không khóa nhầm “Trung tâm gói” / route công khai cần thiết.

### 2.4 Khả năng tiếp cận & chất lượng UI

- [ ] **P2** Focus trap, label form, contrast cơ bản (WCAG mục tiêu nội bộ).
- [ ] **P2** Kiểm tra keyboard cho flow chính (đăng nhập, giỏ, thanh toán).

---

## 3. Bảo mật hệ thống

### 3.1 Cấu hình & bí mật

- [ ] **P0** Hoàn thiện `/.well-known/security.txt` (contact, policy thật, không placeholder).
- [ ] **P0** Rà soát `.env` / secret manager: không commit; rotate JWT, SePay, Telegram, API notify định kỳ.
- [ ] **P0** Production: `NODE_ENV=production`, tắt debug router; `CORS_ORIGIN` đúng, không dựa fallback che lỗi cấu hình.

### 3.2 Ứng dụng & API

- [ ] **P0** Rà CSRF trên mọi POST/PUT/PATCH/DELETE quan trọng từ SPA (`/api/*`).
- [ ] **P1** Kiểm tra IDOR trên `/api/user` và endpoint có `userId`/order id.
- [ ] **P1** Rate limit đủ cho login / OTP / webhook (tránh abuse, vẫn không chặn user hợp lệ).
- [ ] **P2** Security headers (Helmet/CSP) rà lại sau mỗi lần thêm script/domain mới.

### 3.3 Thanh toán & webhook

- [ ] **P0** Tuân checklist trong `apps/server/docs/payment/` (chữ ký, idempotency, HTTPS).
- [ ] **P1** Log không chứa đầy đủ payload nhạy cảm từ gateway.

### 3.4 Dữ liệu & pháp lý

- [ ] **P1** Chính sách lưu trữ / xóa PII; backup và quyền truy cập nội bộ.
- [ ] **P2** Pentest nhẹ hoặc thuê bên thứ ba trước mở rộng lớn.

### 3.5 Hạ tầng

- [ ] **P1** HTTPS end-to-end; cookie `Secure` / `SameSite` phù hợp luồng SPA.
- [ ] **P1** Sao lưu PostgreSQL định kỳ + **thử restore** ít nhất mỗi quý.
- [ ] **P2** Cảnh báo 5xx, độ trễ `/payment`, `/health/db`.

---

## 4. Gợi ý thứ tự thực hiện (2–4 tuần)

1. **Tuần 1 — P0 bảo mật & dữ liệu:** `security.txt`, secrets, CORS/CSRF, payment checklist, schema/MV.
2. **Tuần 2 — P0/P1 vận hành:** health/readiness, Redis behavior, correlation id, smoke CI.
3. **Tuần 3 — UX & hiệu năng:** baseline SQL, message lỗi, loading, E2E thanh toán staging.
4. **Tuần 4 — P2 & nợ kỹ thuật:** metrics, a11y, docs `OVERVIEW.md` đồng bộ code.

Cập nhật file này khi hoàn thành hoặc khi ưu tiên thay đổi.
