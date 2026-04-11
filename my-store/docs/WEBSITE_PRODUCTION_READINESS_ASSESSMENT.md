# Đánh giá tổng quan hệ thống Website (My-Store) — Sẵn sàng mở cho khách mua hàng

Tài liệu mô tả **trạng thái thực tế** của monorepo `Website/my-store` tại thời điểm rà soát, nhằm hỗ trợ quyết định mở site cho người dùng cuối (xem catalog, đăng nhập, giỏ hàng, thanh toán). Đánh giá theo hướng **chặt chẽ**: nêu rõ điểm mạnh, rủi ro tiềm ẩn, phụ thuộc hạ tầng và việc cần làm trước go-live.

**Phạm vi:** `apps/web`, `apps/server`, `packages/*` (api, db, env), tích hợp với **admin_orderlist** và luồng thanh toán. Không thay thế tài liệu vận hành chi tiết trong `docs/OVERVIEW.md` hay `apps/server/docs/payment/` — nên đọc kèm.

---

## 1. Tóm tắt điều hành

| Khía cạnh | Mức độ sẵn sàng (ước lượng) | Ghi chú ngắn |
|-----------|------------------------------|--------------|
| Kiến trúc tổng thể | Tốt | Modular monolith, ranh giới module rõ; REST + tRPC song song. |
| Bảo mật mặt bằng | Khá | Helmet, CORS chặt ở production, rate limit, CSRF (double cookie), redirect HTTPS prod. |
| Luồng thương mại | Khá | Mcoin + QR (SePay), đồng bộ mã đơn với admin; phụ thuộc cấu hình và DB đúng schema. |
| Phụ thuộc ngoài | Rủi ro trung bình–cao | Proxy tới admin_orderlist (tin, Renew Adobe, ảnh); nhiều hostname và timeout. |
| Quan sát & vận hành | Trung bình | Có health/readiness; `security.txt` còn placeholder; logging/metrics chưa thấy chuẩn hóa đầy đủ trong repo. |
| Tài liệu nội bộ | Trung bình | `OVERVIEW.md` hữu ích; một số mô tả bảng (ví dụ `order_list.id_product`) có thể lệch schema thực tế — cần đồng bộ khi sửa DB. |

**Kết luận ngắn:** Hệ thống **có nền tảng để mở bán** nếu: (1) PostgreSQL và migration khớp schema thực tế (đặc biệt `product.variant_margin`, `pricing_tier`, `orders.order_list`); (2) biến môi trường production đầy đủ và đã kiểm thử end-to-end; (3) proxy tới admin và thanh toán được giám sát. Không nên coi là “bật server là xong”.

---

## 2. Kiến trúc kỹ thuật

### 2.1 Monorepo

- **`apps/web`:** React (Vite), gọi API qua same-origin proxy (dev) hoặc `VITE_API_URL` (prod).
- **`apps/server`:** Express, middleware xếp lớp (CORS → JSON → cookie → log → rate limit → bảo trì → CSRF → giới hạn body → router).
- **`packages/db`:** Prisma client + migrations SQL gộp (`packages/db/prisma/migrations/all_migrations.sql`).
- **`packages/api`:** tRPC router + context (dùng chung với web).

### 2.2 Luồng request điển hình

- **Đọc catalog:** `GET /products`, `GET /promotions` — SQL phức tạp (giá margin, CTE `supply_max`, materialized views bán hàng).
- **Thay đổi trạng thái:** `/api/*` — CSRF, trừ nhóm route được miễn (webhook, một phần fix-adobe, renew-adobe public proxy).
- **tRPC:** `/trpc` — giao tiếp typed với frontend cho một phần nghiệp vụ.

### 2.3 Điểm mạnh kiến trúc

- Tách module theo domain (`modules/product`, `payment`, `cart`, …), dễ định vị lỗi.
- CORS **fail fast** khi thiếu `CORS_ORIGIN` ở production.
- Nén phản hồi (`compression`), `trust proxy` phục vụ rate limit đúng IP sau load balancer.

### 2.4 Điểm cần lưu ý

- **Hai lớp API (REST + tRPC):** có thể lệch validation hoặc quy tắc auth giữa hai kênh nếu không rà soát định kỳ.
- **Dev so với prod:** proxy Vite chuyển một phần đường dẫn sang backend admin khác — lỗi “chỉ prod mới thấy” nếu không test trên môi trường gần production.

---

## 3. Miền nghiệp vụ (mua hàng)

### 3.1 Danh mục và giá

- Giá bán dựa trên **công thức margin** (đã port từ admin), `supplier_cost` (max theo variant), và **pivot** `variant_margin` + `pricing_tier` (khớp admin_orderlist).
- **Rủi ro:** Nếu DB thiếu bảng `pricing_tier` / `variant_margin` hoặc dữ liệu trống, giá có thể về 0 hoặc truy vấn lỗi — từng xảy ra lỗi 500 trên `/products` / `/promotions` khi code giả định cột `pct_*` trực tiếp trên `variant` (schema admin không có các cột đó).
- **Materialized views** (`variant_sold_count`, `product_sold_30d`, …): cần job refresh; join `order_list` phải khớp kiểu `id_product` (thường là varchar / `variant_name` theo admin).

### 3.2 Giỏ hàng và biến thể

- `cart_items` gắn `variant_id`, `price_type` (retail / promo / ctv).
- Giá enrich từ cùng nguồn margin + supply — **nên** đồng bộ logic với trang chi tiết sản phẩm để tránh “giá giỏ khác giá trang”.

### 3.3 Thanh toán

- **Mcoin:** trừ ví, ghi `order_customer`, sau đó `order_list` + Telegram + email (theo cấu hình).
- **QR / SePay:** webhook và luồng xác nhận — chi tiết và checklist bảo mật trong `apps/server/docs/payment/`.
- **Đồng bộ mã:** prefix MAVL/MAVC/… và sinh mã trùng khớp admin — quan trọng khi vận hành chung một DB `orders`.

### 3.4 Đơn hàng và `order_list`

- Website ghi `order_list.id_product` theo **`variant.variant_name`** khi đồng bộ schema admin_orderlist (không phải chỉ số int thuần trong mô hình đó).
- Schema `key_active` và trigger đồng bộ key kích hoạt thuộc phần mở rộng phía admin — Website chủ yếu **proxy** Renew Adobe trừ khi bổ sung truy vấn trực tiếp.

---

## 4. Tích hợp admin_orderlist và dịch vụ ngoài

### 4.1 Proxy sang admin backend

- Tiền tố ví dụ: `/api/public/content`, `/api/renew-adobe/public`, `/image/articles`, `/image_variant`.
- **Rủi ro vận hành:** `ADMIN_ORDERLIST_API_URL` sai, timeout ngắn, hoặc admin downtime → tin tức / Renew Adobe / ảnh lỗi trong khi phần “mua hàng” vẫn có thể chạy nếu DB chung ổn định.

### 4.2 Dịch vụ bên thứ ba

- **SePay / thanh toán:** phụ thuộc chữ ký webhook và URL công khai.
- **Email (Resend, …):** webhook mail mount sớm với raw body — đúng hướng để verify chữ ký.
- **Fix Adobe / OTP / upstream:** proxy ra domain ngoài — phụ thuộc SLA và thay đổi API phía đối tác; ảnh hưởng uy tín nếu lỗi hàng loạt dù không phải core catalog.

---

## 5. Bảo mật (đánh giá chặt chẽ)

### 5.1 Điểm tích cực

- **Helmet** + HSTS (production), CSP (production).
- **Rate limiting** toàn cục.
- **CSRF** cho POST/PUT/PATCH/DELETE trên `/api` với danh sách miễn có lý do (webhook, một số auth).
- **Giới hạn kích thước body** API.
- **Chế độ bảo trì** + IP whitelist (tách route quản trị trước guard).
- Client cảnh báo nếu production API không HTTPS (`apps/web/src/lib/api/client.ts`).

### 5.2 Rủi ro và việc cần làm

- **`/.well-known/security.txt`:** hiện placeholder (`security@example.com`) — **nên** thay contact và policy thật trước khi mở rộng quy mô người dùng.
- **Fallback CORS cứng** cho `mavrykpremium.store` / `www` — tiện nhưng cần đảm bảo không mâu thuẫn với chính sách origin chính thức và không che giấu lỗi cấu hình env.
- **Debug router** chỉ khi `NODE_ENV !== "production"` — cần xác nhận build/deploy luôn đặt `NODE_ENV=production`.
- **Bí mật:** đảm bảo `.env` không commit; rotate key định kỳ (JWT, SePay, Telegram, API notify đơn).
- **Kiểm thử:** đăng nhập, reset mật khẩu, giỏ hàng, thanh toán, IDOR trên `/api/user` — nên có checklist hoặc pentest nhẹ trước go-live lớn.

### 5.3 Dữ liệu khách hàng

- PII (email, profile) — cần chính sách lưu trữ, backup, và quyền xóa/sửa theo nhu cầu pháp lý (tùy quốc gia).

---

## 6. Độ tin cậy, hiệu năng, quan sát

- **Health:** `/health`, `/health/db`, `/health/ready` — đủ cho probe cơ bản; readiness mới kiểm DB, chưa kiểm Redis hoặc URL admin (có thể bổ sung theo mức chấp nhận rủi ro).
- **Redis:** tùy chọn — cần tài liệu rõ hành vi khi Redis down (graceful degrade hay lỗi 500).
- **Logging:** có request/response logger — nên chuẩn hóa correlation id và log level production; tránh log thân token/OTP.
- **Cron jobs:** import động sau khi listen — cần xác nhận một instance chạy job khi scale ngang (tránh trùng lặp).

---

## 7. Trải nghiệm người dùng và frontend

- **Timeout API mặc định** (ví dụ 12s) — thao tác dài (Renew Adobe) có proxy timeout riêng — cần message lỗi thân thiện khi server 500.
- **Maintenance:** client phát hiện 503 — cần test không khóa nhầm các đường dẫn “Trung tâm gói” nếu có ngoại lệ định tuyến.

---

## 8. Kiểm thử và chất lượng

- Có test trong repo — **trước go-live** nên có tối thiểu: smoke `/products`, `/promotions`, `/health/db`; một kịch bản Mcoin và một kịch bản QR trên staging.
- **Typecheck** trong CI nên là gate bắt buộc (`npm run check-types` / `tsc`).

---

## 9. Checklist trước khi mở cho khách mua hàng

1. **Database:** migrations đã chạy trên DB production; tồn tại `pricing_tier`, `variant_margin`, `supplier_cost`, MV bán hàng (và job refresh); `orders.order_list` khớp kiểu cột với admin.
2. **Env production:** `DATABASE_URL`, `CORS_ORIGIN`, secret auth, SePay, `ADMIN_ORDERLIST_API_URL`, `FRONTEND_URL`, email, Telegram (nếu dùng).
3. **HTTPS:** chứng chỉ, redirect, cookie `Secure` / `SameSite` hợp lý; `VITE_API_URL` dùng https.
4. **Bảo mật:** cập nhật `security.txt`, rà CSRF trên mọi flow POST quan trọng từ SPA; tắt debug routes.
5. **Thanh toán:** webhook URL công khai, test số tiền nhỏ, xử lý trùng webhook theo tài liệu payment.
6. **Giám sát:** log tập trung, cảnh báo 5xx và độ trễ `/payment`, `/health/db`.
7. **Sao lưu và DR:** backup PostgreSQL định kỳ, thử restore.
8. **Pháp lý:** điều khoản sử dụng, chính sách bảo mật, kênh hỗ trợ khách hàng.

---

## 10. Khuyến nghị ưu tiên

| Ưu tiên | Hành động |
|---------|-----------|
| P0 | Xác nhận schema DB production khớp admin + migrations Website; refresh MV sau deploy. |
| P0 | Hoàn thiện `security.txt` và rà soát env secrets. |
| P1 | Staging full-stack + kịch bản mua hàng smoke (tự động hoặc bán tự động). |
| P1 | Mở rộng readiness (Redis tùy chọn, kiểm tra URL admin nếu feature phụ thuộc). |
| P2 | Chuẩn hóa observability (request id, metrics). |
| P2 | Đồng bộ lại `docs/OVERVIEW.md` với code/schema hiện tại (`order_list`, margin) cho đội vận hành. |

---

## 11. Phạm vi trách nhiệm của tài liệu

Đánh giá này dựa trên **mã nguồn và cấu trúc repository**, không thay thế pentest chuyên nghiệp, kiểm toán compliance, hay load test. Khi mở rộng traffic hoặc lưu trữ dữ liệu nhạy cảm quy mô lớn, nên bổ sung rà soát pháp lý và kiểm thử bảo mật bên thứ ba phù hợp.

---

*Tài liệu hỗ trợ quyết định go-live; nên cập nhật khi kiến trúc hoặc luồng thanh toán thay đổi đáng kể.*
