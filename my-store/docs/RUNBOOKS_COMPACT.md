# Runbooks Compact

Tai lieu nay gom cac runbook/checklist truoc day de giam phan manh file `.md`.
Neu can mo rong chi tiet, cap nhat truc tiep tai day.

## Danh sach da gom

- `A11Y_KEYBOARD_CHECKLIST_2_4.md`
- `API_SERVER_1_3.md`
- `CRON_AND_SCALE_1_4.md`
- `DATA_GOVERNANCE_AND_PENTEST_3_4.md`
- `DB_CATALOG_1_1.md`
- `INFRA_3_5_RUNBOOK.md`
- `REDIS_CACHE_POLICY.md`
- `REDIS_RUNTIME.md`
- `SECRETS_RUNBOOK_3_1.md`
- `SECURITY_HEADERS_3_2.md`

## 2.4 Accessibility + Keyboard

- Login/Register: tab order dung, label focus dung, loi form co `aria-invalid` + `aria-describedby`, Enter submit duoc.
- Gio hang: the hien `aria-busy` khi sync/load, thao tac tang-giam-xoa bang keyboard.
- Thanh toan: buoc loading co `aria-busy`, cac nut retry/back thao tac keyboard duoc.
- Modal lien he: trap focus, dong bang Esc/overlay, tra focus ve nut mo.

## 1.3 API & Server

- Access log:
  - `HTTP_ACCESS_LOG=all|errors|off`, production khuyen nghi `errors`.
- Winston:
  - `LOG_LEVEL`, `ENABLE_CONSOLE_LOG`.
  - Khong log payload nhay cam day du o webhook/payment.
- Metrics:
  - `GET /health/metrics` can `METRICS_TOKEN` qua bearer hoac `x-metrics-token`.
- Timeout upstream:
  - `ADMIN_ORDERLIST_READ_TIMEOUT_MS`
  - `ADMIN_ORDERLIST_TIMEOUT_MS`
  - `ADMIN_ORDERLIST_RENEW_TIMEOUT_MS`

## 1.4 Cron & Scale ngang

- Chi mot leader dang ky cron khi production scale nhieu replica (Redis lock `SET NX + EX`).
- Redis hong trong production: mac dinh khong dang ky cron de tranh chay trung.
- Bien moi truong:
  - `DISABLE_CRON`
  - `CRON_WITHOUT_REDIS`
  - `CRON_LEADER_LOCK_KEY`
  - `CRON_LEADER_LOCK_TTL_SEC`
  - `CRON_LEADER_RENEW_MS`
- Huong mo rong P2: tach worker hoac dung queue (BullMQ/SQS/PubSub).

## 3.4 Data Governance & Pentest

- Phan loai du lieu: PII truc tiep/gian tiep, du lieu van hanh, payment metadata.
- Retention:
  - Giao dich theo chinh sach phap ly noi bo (vd 5 nam).
  - Log online toi da 90 ngay.
  - Du lieu tam dung TTL ngan.
- Xoa du lieu: uu tien anonymize voi ban ghi bat buoc giu.
- Least privilege + MFA + audit truy cap production.
- Backup/restore:
  - daily 7, weekly 4, monthly 6.
  - restore drill it nhat moi quy.
- Pentest:
  - noi bo theo quy, third-party truoc mo rong lon.
  - theo OWASP ASVS + API Top 10, co retest sau fix.

## 1.1 DB Catalog

- Xac nhan readiness qua `GET /health/catalog` + `npm run smoke:catalog`.
- Benchmark:
  - `SMOKE_BASE_URL=... BENCH_ITERATIONS=30 npm run bench:catalog`.
- EXPLAIN:
  - tap trung query `/products`, `/promotions`.
- Index:
  - `variant_margin(variant_id)`
  - `supplier_cost(variant_id)`
- Khong N+1 o list service hien tai; policy cache xem muc Redis ben duoi.

## 3.5 Infrastructure Runbook

- HTTPS end-to-end:
  - redirect HTTP -> HTTPS, trust proxy, guard URL payment/cors phai la https.
- Cookie SPA:
  - access token `httpOnly`, `sameSite=lax`, secure theo request.
  - csrf `sameSite=strict`.
- Backup:
  - Website ke thua backup tap trung tu `admin_orderlist`.
- Alert:
  - route trong yeu: `/api/payment`, `/health/db`.
  - bien nguong: `ALERT_PAYMENT_SLOW_MS`, `ALERT_HEALTH_DB_SLOW_MS`, `ALERT_COOLDOWN_MS`.
- Script monitor:
  - `npm run monitor:infra-routes`.

## Redis Runtime + Cache Policy

- Redis fail:
  - app fallback in-memory, van ready (`/health/ready` co the tra `checks.redis=fallback`).
- Kich ban cache 2 tang:
  - memory cache cho HTTP list.
  - RedisMap cho csrf/rate limit/blacklist.
- Key/TLL:
  - namespace `MEMORY_CACHE_KEY_PREFIX`, `REDIS_KEY_PREFIX`.
  - TTL thong nhat `CACHE_TTL_SEC`.
  - jitter `CACHE_TTL_JITTER_SEC` de tranh stampede.
- `cache.getOrSet` co singleflight.
- Luu y: `RedisMap.getAll` dang dung `KEYS`, production volume lon nen doi sang `SCAN`.

## 3.1 Secrets & Production Guard

- Khong commit secret:
  - `.env.*` bi khoa, chi cho mau.
  - check truoc release: `npm run security:check-secrets`.
- Guard production fail-fast:
  - `JWT_SECRET`, `JWT_REFRESH_SECRET` bat buoc (>= 32 ky tu), chan placeholder.
  - `CORS_ORIGIN` bat buoc.
- Rotation:
  - JWT/payment token/metrics token theo chu ky (90-180 ngay) hoac rotate ngay khi nghi lo.

## 3.2 Security Headers / CSP

- CSP dung whitelist cu the, tranh wildcard rong.
- Dev co the tat CSP de phuc vu HMR; production dung policy that.
- Them domain moi qua env:
  - `CSP_SCRIPT_SRC`, `CSP_STYLE_SRC`, `CSP_FONT_SRC`, `CSP_CONNECT_SRC`, `CSP_IMG_SRC`, `CSP_FRAME_SRC`.
- Checklist:
  - khong bat `unsafe-inline` cho script,
  - giu cac header co ban (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`),
  - smoke lai luong chinh sau khi thay doi.
