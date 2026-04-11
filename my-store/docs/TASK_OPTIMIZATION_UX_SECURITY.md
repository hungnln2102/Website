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

- [x] **P0** Xác nhận production: `pricing_tier`, `variant_margin`, `supplier_cost`, MV bán hàng, job refresh MV — **`GET /health/catalog`**, **`npm run smoke:catalog`**, tài liệu `docs/RUNBOOKS_COMPACT.md`.
- [x] **P0** Đo thời gian phản hồi `/products`, `/promotions` (p95/p99) — **`npm run bench:catalog`** (ghi JSON baseline thủ công).
- [x] **P1** Rà EXPLAIN cho các SQL nặng; chỉ mục — hướng dẫn + index `variant_margin(variant_id)`, `supplier_cost(variant_id)` trong `all_migrations.sql` §10.
- [x] **P1** Tránh N+1 — list catalog đã một query; ghi chú cache trong `docs/RUNBOOKS_COMPACT.md`.
- [x] **P2** Đánh giá connection pool — mục 5 trong `docs/RUNBOOKS_COMPACT.md`.

### 1.2 Redis & cache (nếu dùng)

- [x] **P0** Tài liệu hành vi khi Redis down: graceful degrade hay 500 — và test một lần.
- [x] **P1** Readiness (hoặc health) phản ánh phụ thuộc Redis nếu feature bắt buộc Redis.
- [x] **P2** Chiến lược key naming, TTL thống nhất, tránh cache stampede — `cache-keys.ts`, `cache-ttl.ts`, `cache.getOrSet` + jitter, `REDIS_KEY_PREFIX`, `docs/RUNBOOKS_COMPACT.md`.

### 1.3 API & server

- [x] **P1** Chuẩn hóa **correlation id** (header + log) xuyên suốt request.
- [x] **P1** Log level production; rà soát không log body chứa PII/token/OTP — `HTTP_ACCESS_LOG`, Winston `LOG_LEVEL` / `ENABLE_CONSOLE_LOG`, bỏ log body bot, SePay webhook chỉ log keys.
- [x] **P2** Metrics cơ bản — **`GET /health/metrics`** + `METRICS_TOKEN` (xem `docs/RUNBOOKS_COMPACT.md`).
- [x] **P2** Timeout upstream admin — **`ADMIN_ORDERLIST_READ_TIMEOUT_MS`** (tin/ảnh) vs **`ADMIN_ORDERLIST_RENEW_TIMEOUT_MS`** (Renew Adobe); `docs/RUNBOOKS_COMPACT.md`.

### 1.4 Cron & scale ngang

- [x] **P1** Chỉ **một instance** chạy cron khi scale — **Redis `SET NX` + renew** (`apps/server/src/jobs/cron-leader.ts`), đăng ký job sau `initRedis()`; tài liệu `docs/RUNBOOKS_COMPACT.md`, biến `DISABLE_CRON`, `CRON_WITHOUT_REDIS`.
- [x] **P2** Hướng queue (BullMQ / worker) — ghi trong `docs/RUNBOOKS_COMPACT.md` §P2 (chưa code queue).

### 1.5 Build & CI

- [x] **P1** Gate CI: `tsc --noEmit` (web + server) bắt buộc pass.
- [x] **P1** Smoke tự động: script `npm run smoke:health` (gọi `/health`, `/health/db`, `/health/ready` qua `SMOKE_BASE_URL`); gắn vào staging/CI khi có URL + DB.
- [x] **P2** Bundle analysis (`apps/web`: `npm run analyze` → `dist/stats.html`, `rollup-plugin-visualizer`); lazy `MaintenancePage`; `manualChunks` tách `checkprofile-hub`, `payment-flow`, `news`, `adobe-guide`.

---

## 2. Tối ưu người dùng (UX, frontend, nội dung lỗi)

### 2.1 Lỗi & trạng thái tải

- [x] **P1** Thông báo lỗi thân thiện khi API 500 / timeout (đặc biệt giỏ hàng, thanh toán, Renew Adobe) — bổ sung 502/504; timeout đã có sẵn.
- [x] **P1** Skeleton / loading: catalog (`CategoryPage`, `AllProductsPage` + `ProductGrid`), chi tiết SP (`ProductPurchasePanelSkeleton` khi tải gói), giỏ (`!isLoaded` + overlay `isSyncing`), thanh toán bước 3 (`PaymentOutcome` loading).
- [x] **P2** Retry GET idempotent — `main.tsx` + `lib/api/query-retry.ts` (tối đa 4 lần, exponential + jitter).

### 2.2 Luồng mua hàng & thanh toán

- [x] **P0** Checklist kiểm thử tay staging — `apps/server/docs/payment/E2E_STORE_CHECKLIST_VI.md` (Mcoin, QR, webhook trùng).
- [x] **P1** Giá khớp giỏ server — API `product-packages` thêm `promo_cost` (cùng SQL `sqlPromoPrice` như giỏ); `DurationSelector` / `BuyButton` / schema JSON-LD dùng `promoPrice`.
- [x] **P2** Gọn hơn trên mobile — `CartProgressSteps` (nhãn ngắn, khoảng nối hẹp), bước giỏ gọn.

### 2.3 Bảo trì & định tuyến

- [x] **P1** Test 503 maintenance: thêm unit test `maintenance.guard.test.ts` cho bypass Trung tâm gói (`/api/renew-adobe/public/*`), route công khai (`/categories`, `/products`, `/health/*`), localhost/whitelist và assert 503 cho route không bypass.

### 2.4 Khả năng tiếp cận & chất lượng UI

- [x] **P2** Focus trap, label form, contrast cơ bản: popup liên hệ `BuyButton` dùng `FocusTrap` + `aria-modal` + Esc để đóng; `LoginForm`/`RegisterForm` thêm `htmlFor/id`, `aria-invalid`/`aria-describedby`, nút hiện/ẩn mật khẩu có `aria-label`; tăng contrast nhãn step ở `CartProgressSteps`.
- [x] **P2** Keyboard flow chính (đăng nhập, giỏ, thanh toán): bổ sung checklist `docs/RUNBOOKS_COMPACT.md`; giỏ/thanh toán giữ trạng thái `aria-busy`, popup liên hệ trap focus và hoàn tác focus.

---

## 3. Bảo mật hệ thống

### 3.1 Cấu hình & bí mật

- [x] **P0** Hoàn thiện `/.well-known/security.txt` (contact, policy thật, không placeholder) — dùng `FRONTEND_URL` + `SECURITY_TXT_*` trong env.
- [x] **P0** Rà soát `.env` / secret manager: thêm `security:check-secrets` (`scripts/security-check-secrets.mjs`), khóa `.env.*` trong `.gitignore` (trừ mẫu), runbook rotation `docs/RUNBOOKS_COMPACT.md`.
- [x] **P0** Production: guard fail-fast `apps/server/src/config/security-env.ts` (JWT secret bắt buộc + chống placeholder + double-check `CORS_ORIGIN`), debug router chỉ mount ngoài production trong `index.ts`.

### 3.2 Ứng dụng & API

- [x] **P0** Rà CSRF trên POST/PUT/PATCH/DELETE quan trọng từ SPA: bỏ exempt `/payment/create` ở `csrf.ts`; web thêm `x-csrf-token` khi gọi `createPayment` (`features/payment/api/payment.api.ts`).
- [x] **P1** IDOR: `GET /api/payment/status/:orderId` kiểm tra ownership theo `order_customer.account_id` / transaction liên kết trước khi trả trạng thái; `/api/user/*` tiếp tục dựa `req.user.userId` + query theo account hiện tại.
- [x] **P1** Rate limit cho login/OTP/webhook: thêm `otpLimiter` (`/auth/verify-reset-otp`) và `webhookLimiter` cho `/api/payment/webhook`, `/api/mail/webhook` (cả alias `/webhook/mail`), `/api/orders/notify-done|cancel`.
- [x] **P2** Security headers (Helmet/CSP): tách cấu hình `helmet-csp.ts`, bỏ wildcard rộng, whitelist host đang dùng + cho phép mở rộng qua env `CSP_*_SRC`; checklist vận hành trong `docs/RUNBOOKS_COMPACT.md`.

### 3.3 Thanh toán & webhook

- [x] **P0** Tuân checklist trong `apps/server/docs/payment/` (chữ ký, idempotency, HTTPS).
  - Đã bổ sung checklist vận hành bắt buộc: `apps/server/docs/payment/WEBHOOK_SECURITY_CHECKLIST_3_3.md`.
- [x] **P1** Log không chứa đầy đủ payload nhạy cảm từ gateway.
  - Đã giảm mức log ở callback/webhook: không log full payload/chữ ký; chỉ giữ metadata tối thiểu (`orderId`, `payloadKeys`, `signaturePrefix`, `ip`).

### 3.4 Dữ liệu & pháp lý

- [x] **P1** Chính sách lưu trữ / xóa PII; backup và quyền truy cập nội bộ.
- [x] **P2** Pentest nhẹ hoặc thuê bên thứ ba trước mở rộng lớn.
  - Đã tạo tài liệu thực thi: `docs/RUNBOOKS_COMPACT.md`.

### 3.5 Hạ tầng

- [x] **P1** HTTPS end-to-end; cookie `Secure` / `SameSite` phù hợp luồng SPA.
  - Guard production chặn URL `http://` cho `CORS_ORIGIN` / callback payment; SePay callback mặc định theo `FRONTEND_URL` an toàn; runbook: `docs/RUNBOOKS_COMPACT.md`.
- [x] **P1** Sao lưu PostgreSQL định kỳ + **thử restore** ít nhất mỗi quý.
  - Website kế thừa backup tập trung từ `admin_orderlist` (không tạo backup job riêng tại Website); vẫn yêu cầu restore drill theo quý.
- [x] **P2** Cảnh báo 5xx, độ trễ `/payment`, `/health/db`.
  - Thêm alert runtime qua middleware `request-alerts.ts` + script giám sát chủ động `npm run monitor:infra-routes`.

---

## 4. Gợi ý thứ tự thực hiện (2–4 tuần)

1. **Tuần 1 — P0 bảo mật & dữ liệu:** `security.txt`, secrets, CORS/CSRF, payment checklist, schema/MV.
2. **Tuần 2 — P0/P1 vận hành:** health/readiness, Redis behavior, correlation id, smoke CI.
3. **Tuần 3 — UX & hiệu năng:** baseline SQL, message lỗi, loading, E2E thanh toán staging.
4. **Tuần 4 — P2 & nợ kỹ thuật:** metrics, a11y, docs `OVERVIEW.md` đồng bộ code.

## 5. Verify sau tối ưu (2026-04-12)

Mục tiêu của to-do `verify-and-doc`: đo lại sau tối ưu, so sánh KPI và cập nhật tài liệu vận hành.

### Lệnh đã chạy

```bash
SMOKE_BASE_URL=http://127.0.0.1:4000 npm run smoke:health
SMOKE_BASE_URL=http://127.0.0.1:4000 npm run smoke:catalog
SMOKE_BASE_URL=http://127.0.0.1:4000 BENCH_ITERATIONS=30 npm run bench:catalog
MONITOR_BASE_URL=http://127.0.0.1:4000 npm run monitor:infra-routes
```

### Kết quả KPI sau tối ưu (local)

- `smoke:health`: pass (`/health`, `/health/db`, `/health/ready` đều HTTP 200).
- `smoke:catalog`: pass (`/health/catalog` trả `catalogReady=true`).
- `monitor:infra-routes`: pass (có cảnh báo thiếu `METRICS_TOKEN`, nên đã skip `/health/metrics`).

| Endpoint | p50 | p95 | p99 | max | Trạng thái KPI |
|---|---:|---:|---:|---:|---|
| `/products` | 2ms | 4ms | 77ms | 77ms | Đạt (thấp hơn ngưỡng cảnh báo runtime) |
| `/promotions` | 1ms | 2ms | 16ms | 16ms | Đạt (thấp hơn ngưỡng cảnh báo runtime) |

### So sánh trước/sau

- Repo chưa lưu snapshot JSON "trước tối ưu" cho cùng môi trường chạy, nên chưa thể tính delta số học trước/sau trong tài liệu này.
- Bộ số ngày `2026-04-12` ở trên được chốt làm **mốc baseline hiện tại** để so sánh cho lần tối ưu tiếp theo (cùng `BENCH_ITERATIONS=30` và cùng `SMOKE_BASE_URL`).

### Ghi chú staging

- Thử chạy với `SMOKE_BASE_URL=https://api.mavrykpremium.store` đang trả `503 SERVICE_UNAVAILABLE` (maintenance), nên chưa thể hoàn tất vòng đo staging ở thời điểm này.
- Khi staging mở lại: re-run đúng 4 lệnh ở trên với base URL staging và cập nhật lại bảng KPI + delta.

## 6. Frontend KPI (Lighthouse) trước/sau tối ưu (2026-04-12)

### Scope tối ưu frontend đã áp dụng

- Giảm prefetch route nặng trong `App.tsx` theo network/device và bỏ warmup `CartPage` khỏi đường vào Home.
- Defer init Sentry/error tracking trong `main.tsx` (idle/timeout), bỏ auto-init khi import module.
- Tách phụ thuộc Home khỏi API barrel `@/lib/api` để không kéo sớm module payment/cart/profile.
- Lazy load `lottie-react` + `Success.json` trong `SuccessAnimation` để không đưa animation vào bundle thanh toán ngay từ đầu.
- Điều chỉnh chunk strategy trong `vite.config.ts` (bỏ manual chunk theo feature gây eager load ngoài ý muốn).

### Lệnh benchmark

```bash
# Baseline (production preview)
npm run build --workspace web
npm run preview --workspace web -- --host 127.0.0.1 --port 4173
npx lighthouse http://127.0.0.1:4173/ --only-categories=performance --output=json --output-path=lh-before-home-prod.json
npx lighthouse http://127.0.0.1:4173/adobe --only-categories=performance --output=json --output-path=lh-before-product-prod.json
npx lighthouse http://127.0.0.1:4173/cart --only-categories=performance --output=json --output-path=lh-before-cart-prod.json

# Re-run sau tối ưu (3 lần mỗi page, lấy median)
npx lighthouse http://127.0.0.1:4173/ --only-categories=performance --output=json --output-path=lh-after-home-prod-run1.json
npx lighthouse http://127.0.0.1:4173/ --only-categories=performance --output=json --output-path=lh-after-home-prod-run2.json
npx lighthouse http://127.0.0.1:4173/ --only-categories=performance --output=json --output-path=lh-after-home-prod-run3.json
npx lighthouse http://127.0.0.1:4173/adobe --only-categories=performance --output=json --output-path=lh-after-product-prod-run1.json
npx lighthouse http://127.0.0.1:4173/adobe --only-categories=performance --output=json --output-path=lh-after-product-prod-run2.json
npx lighthouse http://127.0.0.1:4173/adobe --only-categories=performance --output=json --output-path=lh-after-product-prod-run3.json
npx lighthouse http://127.0.0.1:4173/cart --only-categories=performance --output=json --output-path=lh-after-cart-prod-run1.json
npx lighthouse http://127.0.0.1:4173/cart --only-categories=performance --output=json --output-path=lh-after-cart-prod-run2.json
npx lighthouse http://127.0.0.1:4173/cart --only-categories=performance --output=json --output-path=lh-after-cart-prod-run3.json
```

### Bảng KPI trước/sau (Home/Product/Cart)

| Page | Perf score | LCP (ms) | INP | CLS |
|---|---:|---:|---:|---:|
| Home (before -> after median) | 68 -> 83 | 2532 -> 2467 | N/A -> N/A | 0.000 -> 0.048 |
| Product `/adobe` (before -> after median) | 85 -> 92 | 2925 -> 2639 | N/A -> N/A | 0.000 -> 0.000 |
| Cart (before -> after median) | 83 -> 92 | 3075 -> 2935 | N/A -> N/A | 0.000 -> 0.000 |

### Ghi chú đọc kết quả

- INP hiển thị `N/A` trong Lighthouse navigation run (không mô phỏng đủ tương tác người dùng để chốt INP).
- Có thể gặp warning `EPERM` khi Lighthouse dọn thư mục temp trên Windows; nếu file JSON đã sinh đầy đủ thì vẫn dùng được để tổng hợp median.
- Sau khi đo 3 lần/page và lấy median, Product và Cart đều cải thiện rõ điểm performance + LCP.
- Kiểm tra network Home sau tối ưu cho thấy không còn tải sớm chunk payment/cart trên first load; flow thanh toán chỉ tải khi điều hướng sang route tương ứng.

### Re-run xác nhận ổn định (sau vá CLS banner)

- Home: score median `81`, LCP median `2471ms`, CLS median `0.048` (gần như giữ nguyên so với lần đo median trước).
- Product: score median `92`, LCP median `2631ms`, CLS `0.000`.
- Cart: score median `91`, LCP median `2941ms`, CLS `0.000`.
- Kết luận: patch giữ ổn định Product/Cart; Home còn CLS nhẹ quanh `0.048` và cần đo INP/CLS bằng user-flow tương tác thực để chốt cuối.

### 7. User-flow đo thực tế (Web Vitals debug)

Đã thêm collector Web Vitals qua `web-vitals` và chỉ bật log khi truy cập URL có `?perf=1` để đo session tương tác thật bằng browser automation.

```bash
npm install web-vitals --workspace web
npm run dev --workspace web
# mở từng route với ?perf=1 và thao tác click/type:
#   /?perf=1
#   /adobe?perf=1
#   /cart?perf=1
```

Kết quả log thực tế (dev, sau tương tác):

| Page | FCP (ms) | LCP (ms) | CLS | INP |
|---|---:|---:|---:|---:|
| Home `/` | 1184 | 1184 -> 16664 (banner auto-rotate đổi LCP candidate) | 0.000 | Chưa thu được giá trị |
| Product `/adobe` | 1872 | 1872 | 0.000 | Chưa thu được giá trị |
| Cart `/cart` | 256 | 256 -> 588 | 0.000 | Chưa thu được giá trị |

Ghi chú:
- INP vẫn chưa được emit trong browser automation hiện tại dù đã có thao tác click/type; Lighthouse navigation cũng tiếp tục trả `N/A`.
- Đã bổ sung fallback INP bằng Event Timing API trong `web-vitals.ts` (theo `click/keydown/pointer*`) nhưng browser automation hiện tại vẫn không trả event phù hợp để chốt INP.
- Để chốt KPI INP cuối cùng, cần chạy phiên tay trên browser người dùng thật (không automation), giữ session đủ lâu và đọc từ overlay `?perf=1` hoặc DevTools Performance/Web Vitals extension.

Cập nhật file này khi hoàn thành hoặc khi ưu tiên thay đổi.
