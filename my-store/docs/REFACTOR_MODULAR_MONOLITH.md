# Refactor: Modular Monolith theo Business Domain

> Kế hoạch refactor dự án từ kiến trúc **Technical Layer** sang **Modular Monolith** theo business domain.

---

## 1. Phân tích hiện trạng

### Server (`apps/server`) — Technical Layer
```
src/
├── controllers/    ← 12 controllers gộp chung
├── services/       ← 27 services gộp chung
├── routes/         ← 15 route files gộp chung
├── middleware/     ← 6+ middleware chung
├── jobs/           ← 4 cron jobs chung
├── utils/          ← 8 utility files chung
└── config/         ← 5 config files chung
```

### Web (`apps/web`) — Đã feature-first (cần refine)
```
src/
├── features/      ← 11 feature folders (auth, product, cart, payment, ...)
├── components/    ← shared UI components
├── hooks/         ← shared hooks
├── lib/api/       ← 12 API client files gộp chung
└── pages/         ← chỉ 3 page files
```

### Database (`packages/db`) — Monolithic schema
```
prisma/schema/schema.prisma   ← toàn bộ tables trong 1 file
```

---

## 2. Business Domains xác định

| # | Domain | Mô tả | Server files liên quan |
|---|--------|--------|------------------------|
| 1 | **auth** | Đăng ký, đăng nhập, token, session, CSRF | auth.controller, auth.service, token.service, refresh-token.service, session.service, password-history.service, csrf.service, captcha.service |
| 2 | **product** | Sản phẩm, danh mục, variant, gói sản phẩm | product.controller, variant.controller, products-list.service, variant-detail.service, product-packages.service, categories.service |
| 3 | **cart** | Giỏ hàng | cart.controller, cart.service |
| 4 | **order** | Đơn hàng, tracking | order.controller, order-list.service, payment-success.service |
| 5 | **payment** | Thanh toán Mcoin, QR, SePay, webhook | payment.controller, balance-payment.service, sepay.service |
| 6 | **wallet** | Ví, nạp tiền, giao dịch | topup.controller, topup.service, wallet.service |
| 7 | **user** | Profile, hoạt động, mật khẩu | user.controller, audit.service |
| 8 | **analytics** | Thống kê bán hàng, sold count | product-stats.controller, product-sold-count.controller, product-stats.service, product-sold-count.service |
| 9 | **notification** | Email, webhook Resend | mail.webhook.controller, resend.service |
| 10 | **promotion** | Khuyến mãi, mã giảm giá | (embedded trong payment/product) |
| **shared** | Infrastructure | Cache, encryption, logging, security, rate limit, error handling | cache.service, encryption.service, logger, middleware/* |

---

## 3. Cấu trúc mục tiêu

### 3.1 Server — Modular Monolith

```
apps/server/src/
├── app.ts                          # Express app setup, global middleware
├── index.ts                        # Entry point
│
├── modules/                        # ★ Business domains
│   ├── auth/
│   │   ├── auth.module.ts          # Module registration (router mount)
│   │   ├── auth.routes.ts          # Route definitions
│   │   ├── auth.controller.ts      # Request/response handling
│   │   ├── auth.service.ts         # Business logic
│   │   ├── token.service.ts        # Token management
│   │   ├── session.service.ts      # Session management
│   │   ├── csrf.service.ts         # CSRF logic
│   │   ├── captcha.service.ts      # Captcha verification
│   │   ├── auth.middleware.ts      # Auth-specific middleware
│   │   ├── auth.validation.ts      # Input validation rules
│   │   ├── auth.types.ts           # Types/interfaces
│   │   └── __tests__/              # Unit tests
│   │
│   ├── product/
│   │   ├── product.module.ts
│   │   ├── product.routes.ts
│   │   ├── product.controller.ts
│   │   ├── product-list.service.ts
│   │   ├── variant-detail.service.ts
│   │   ├── product-packages.service.ts
│   │   ├── categories.service.ts
│   │   ├── product.helpers.ts       # product-sql.shared, product-helpers
│   │   ├── product-seo.ts
│   │   └── __tests__/
│   │
│   ├── cart/
│   │   ├── cart.module.ts
│   │   ├── cart.routes.ts
│   │   ├── cart.controller.ts
│   │   ├── cart.service.ts
│   │   └── __tests__/
│   │
│   ├── order/
│   │   ├── order.module.ts
│   │   ├── order.routes.ts
│   │   ├── order.controller.ts
│   │   ├── order.service.ts
│   │   └── __tests__/
│   │
│   ├── payment/
│   │   ├── payment.module.ts
│   │   ├── payment.routes.ts
│   │   ├── payment.controller.ts
│   │   ├── balance-payment.service.ts
│   │   ├── sepay.service.ts
│   │   ├── payment-success.service.ts   # hoặc move sang order/
│   │   └── __tests__/
│   │
│   ├── wallet/
│   │   ├── wallet.module.ts
│   │   ├── wallet.routes.ts
│   │   ├── wallet.controller.ts          # topup controller merged
│   │   ├── wallet.service.ts
│   │   ├── topup.service.ts
│   │   └── __tests__/
│   │
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user.routes.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── audit.service.ts
│   │   ├── password-history.service.ts
│   │   └── __tests__/
│   │
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.routes.ts
│   │   ├── analytics.controller.ts
│   │   ├── product-stats.service.ts
│   │   ├── product-sold-count.service.ts
│   │   └── __tests__/
│   │
│   ├── notification/
│   │   ├── notification.module.ts
│   │   ├── notification.routes.ts
│   │   ├── mail.webhook.controller.ts
│   │   ├── resend.service.ts
│   │   └── __tests__/
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.routes.ts
│
├── shared/                          # ★ Cross-cutting concerns
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   ├── rate-limiter.ts
│   │   └── api-security.ts
│   ├── services/
│   │   ├── cache.service.ts
│   │   └── encryption.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── sitemap.ts
│   └── types/
│       └── index.ts
│
├── jobs/                            # ★ Background jobs (theo domain)
│   ├── analytics/
│   │   ├── refresh-variant-sold-count.job.ts
│   │   ├── refresh-product-sold-30d.job.ts
│   │   └── refresh-sold-count.job.ts
│   └── user/
│       └── reset-customer-tier-cycle.job.ts
│
└── config/                          # ★ App configuration (giữ nguyên)
    ├── database.ts
    ├── db.config.ts
    ├── redis.ts
    ├── status.constants.ts
    └── tier-cycle.config.ts
```

### 3.2 Web — Refine feature-first

```
apps/web/src/
├── app/                             # App shell
│   ├── App.tsx
│   ├── providers/                   # Global providers
│   └── routes/                      # Route config
│
├── features/                        # ★ Business domains (đã có, refine)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/                     # ← move từ lib/api/auth.ts
│   │   ├── lib/
│   │   └── pages/                   # ← move LoginPage vào đây
│   │
│   ├── product/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/                     # ← move từ lib/api/products.api.ts
│   │   ├── utils/
│   │   └── pages/                   # ← ProductDetailPage
│   │
│   ├── cart/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/                     # ← move từ lib/api/cart.api.ts
│   │   └── pages/                   # ← CartPage
│   │
│   ├── payment/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/                     # ← move từ lib/api/payment.api.ts
│   │
│   ├── wallet/                      # ★ rename từ topup/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/                     # ← move từ lib/api/topup.api.ts
│   │   └── pages/                   # ← TopupPage
│   │
│   ├── profile/
│   │   ├── components/
│   │   ├── api/                     # ← move từ lib/api/user.api.ts
│   │   └── config/
│   │
│   ├── catalog/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/                     # ← move từ lib/api/categories.api.ts
│   │
│   └── promotion/
│       ├── components/
│       └── api/                     # ← move từ lib/api/promotions.api.ts
│
├── shared/                          # ★ rename từ components/ + lib/
│   ├── components/                  # Reusable UI (Button, Input, Footer, etc.)
│   │   ├── ui/
│   │   ├── layout/                  # Header, Footer, SEO
│   │   └── feedback/                # ErrorBoundary, Loading
│   ├── hooks/                       # ← move từ src/hooks/ (shared only)
│   ├── lib/
│   │   ├── api-client.ts            # tRPC / axios base client
│   │   ├── cn.ts
│   │   └── sanitize.ts
│   ├── utils/
│   │   ├── pricing.ts
│   │   ├── slugify.ts
│   │   ├── formatDuration.ts
│   │   └── csrf.ts
│   └── types/
│       ├── api.types.ts
│       └── database.types.ts
│
├── styles/                          # Global styles
│   └── index.css
└── main.tsx                         # Entry
```

### 3.3 Database — Multi-file Prisma schema (tùy chọn)

```
packages/db/prisma/schema/
├── base.prisma            # datasource, generator
├── auth.prisma            # user, session, refresh_token, password_history
├── product.prisma         # product, variant, category, product_package
├── order.prisma           # order_list, order_customer
├── payment.prisma         # wallet_transaction, payment_code
├── wallet.prisma          # wallet, topup
├── promotion.prisma       # promotion, promotion_usage
└── analytics.prisma       # materialized views (SQL-managed)
```

---

## 4. Nguyên tắc Modular Monolith

### 4.1 Module Boundaries
- Mỗi module **tự chứa**: routes, controller, services, types, tests
- Module giao tiếp qua **public API** (exported service methods), KHÔNG import internal files
- Mỗi module export 1 `*.module.ts` — nơi duy nhất đăng ký routes

### 4.2 Dependency Rules
```
Module A ──→ shared/     ✅ OK
Module A ──→ Module B    ⚠️  Chỉ qua public API (service interface)
Module A  ←→ Module B    ❌ Circular dependency — dùng event/shared service
```

### 4.3 Module Registration Pattern
```typescript
// modules/auth/auth.module.ts
import { Router } from 'express';
import { authRoutes } from './auth.routes';

export function registerAuthModule(app: Router) {
  app.use('/api/auth', authRoutes);
}

// index.ts
import { registerAuthModule } from './modules/auth/auth.module';
import { registerProductModule } from './modules/product/product.module';
// ...
registerAuthModule(app);
registerProductModule(app);
```

### 4.4 Cross-module Communication
Khi module A cần gọi module B:
```typescript
// ✅ GOOD — import public service
import { walletService } from '../wallet/wallet.service';

// ❌ BAD — import internal implementation
import { calculateBalance } from '../wallet/internal/balance-calc';
```

---

## 5. Execution Plan — Các phase thực hiện

### Phase 0: Chuẩn bị (Pre-refactor)
- [x] **T0.1** Đảm bảo test suite chạy pass (baseline)
- [x] **T0.2** Tạo branch `refactor/modular-monolith`
- [x] **T0.3** Cập nhật path aliases trong `tsconfig.json` (thêm `@modules/*`, `@shared/*`)

### Phase 1: Server — Tạo cấu trúc modules + shared
- [x] **T1.1** Tạo thư mục `src/modules/` và `src/shared/`
- [x] **T1.2** Move middleware → `shared/middleware/`
- [x] **T1.3** Move shared utils → `shared/utils/`
- [x] **T1.4** Move shared services (cache, encryption) → `shared/services/`

### Phase 2: Server — Migrate từng domain module
- [x] **T2.1** `auth` module — move auth.controller + auth.service + token/session/csrf/captcha services + auth routes
- [x] **T2.2** `product` module — move product controller + list/variant/packages/categories services + product routes
- [x] **T2.3** `cart` module — move cart controller + service + routes
- [x] **T2.4** `order` module — move order controller + order-list service + routes
- [x] **T2.5** `payment` module — move payment controller + balance/sepay/success services + routes
- [x] **T2.6** `wallet` module — move topup controller + wallet/topup services + routes
- [x] **T2.7** `user` module — move user controller + audit/password services + routes
- [x] **T2.8** `analytics` module — move stats controllers + services + routes
- [x] **T2.9** `notification` module — move mail webhook + resend service + routes
- [x] **T2.10** `health` module — move health route

### Phase 3: Server — Migrate jobs theo domain
- [x] **T3.1** Tạo `jobs/analytics/` — move sold-count & stats jobs
- [x] **T3.2** Tạo `jobs/user/` — move tier-cycle job
- [x] **T3.3** Cập nhật job registration trong index.ts

### Phase 4: Server — Cleanup & wiring
- [x] **T4.1** Tạo module registration pattern (*.module.ts cho mỗi domain)
- [x] **T4.2** Cập nhật `index.ts` — import modules thay vì import routes trực tiếp
- [x] **T4.3** Backward-compat barrel files giữ lại (controllers/, services/, middleware/)
- [x] **T4.4** Update tất cả import paths
- [x] **T4.5** Verify `tsc --noEmit` — 0 errors

### Phase 5: Web — Refine feature structure
- [x] **T5.1** Move API clients vào từng feature (`lib/api/*.ts` → `features/*/api/`)
- [x] **T5.2** Move domain hooks vào features (`useProducts` → product, `useCart` → cart, etc.)
- [x] **T5.3** Rename `topup/` → `wallet/` cho consistent với server
- [x] **T5.4** Cập nhật barrel files (`lib/api/index.ts`, `hooks/index.ts`) — re-export từ feature locations
- [x] **T5.5** Cập nhật tất cả import paths
- [x] **T5.6** Verify tsc + Vite build — 0 new errors

### Phase 6: Database — Split Prisma schema (optional)
- [x] **SKIPPED** — DB đã dùng PostgreSQL schemas theo domain (`product`, `orders`, `partner`, `admin`, `finance`). Prisma schema chỉ có generator + datasource, không có models (dùng raw SQL migrations).

### Phase 7: Finalize
- [x] **T7.1** Cập nhật documentation (README, OVERVIEW, STRUCTURE)
- [x] **T7.2** Xóa old barrel files (`controllers/index.ts`, `services/index.ts`, `middleware/index.ts`, `pages/`)
- [x] **T7.3** Verify full build (server tsc + tsdown, web vite build) — all pass
- [ ] **T7.4** Code review & merge

---

## 6. File mapping chi tiết (Server)

### Module: auth
| Nguồn (hiện tại) | Đích (mới) |
|---|---|
| `controllers/auth.controller.ts` | `modules/auth/auth.controller.ts` |
| `services/auth.service.ts` | `modules/auth/auth.service.ts` |
| `services/token.service.ts` | `modules/auth/token.service.ts` |
| `services/refresh-token.service.ts` | `modules/auth/refresh-token.service.ts` |
| `services/session.service.ts` | `modules/auth/session.service.ts` |
| `services/csrf.service.ts` | `modules/auth/csrf.service.ts` |
| `services/captcha.service.ts` | `modules/auth/captcha.service.ts` |
| `routes/auth.route.ts` | `modules/auth/auth.routes.ts` |
| `middleware/csrf.ts` | `modules/auth/auth.middleware.ts` (merge) |
| `middleware/auth.ts` | `shared/middleware/auth.ts` (dùng chung) |

### Module: product
| Nguồn | Đích |
|---|---|
| `controllers/product.controller.ts` (nếu có) | `modules/product/product.controller.ts` |
| `controllers/variant-detail.controller.ts` | `modules/product/variant.controller.ts` |
| `services/products-list.service.ts` | `modules/product/product-list.service.ts` |
| `services/variant-detail.service.ts` | `modules/product/variant-detail.service.ts` |
| `services/product-packages.service.ts` | `modules/product/product-packages.service.ts` |
| `services/categories.service.ts` | `modules/product/categories.service.ts` |
| `routes/products.route.ts` | `modules/product/product.routes.ts` |
| `routes/variant-detail.route.ts` | `modules/product/variant.routes.ts` |
| `utils/product-sql.shared.ts` | `modules/product/product.helpers.ts` |
| `utils/product-helpers.ts` | `modules/product/product.helpers.ts` (merge) |
| `utils/product-seo.ts` | `modules/product/product-seo.ts` |
| `utils/product-seo-audit.ts` | `modules/product/product-seo-audit.ts` |

### Module: cart
| Nguồn | Đích |
|---|---|
| `controllers/cart.controller.ts` | `modules/cart/cart.controller.ts` |
| `services/cart.service.ts` | `modules/cart/cart.service.ts` |
| `routes/cart.route.ts` | `modules/cart/cart.routes.ts` |

### Module: order
| Nguồn | Đích |
|---|---|
| `controllers/order.controller.ts` | `modules/order/order.controller.ts` |
| `services/order-list.service.ts` | `modules/order/order.service.ts` |
| `routes/order.route.ts` | `modules/order/order.routes.ts` |

### Module: payment
| Nguồn | Đích |
|---|---|
| `controllers/payment.controller.ts` | `modules/payment/payment.controller.ts` |
| `services/balance-payment.service.ts` | `modules/payment/balance-payment.service.ts` |
| `services/sepay.service.ts` | `modules/payment/sepay.service.ts` |
| `services/payment-success.service.ts` | `modules/payment/payment-success.service.ts` |
| `routes/payment.route.ts` | `modules/payment/payment.routes.ts` |

### Module: wallet
| Nguồn | Đích |
|---|---|
| `controllers/topup.controller.ts` | `modules/wallet/wallet.controller.ts` |
| `services/wallet.service.ts` | `modules/wallet/wallet.service.ts` |
| `services/topup.service.ts` | `modules/wallet/topup.service.ts` |
| `routes/topup.route.ts` | `modules/wallet/wallet.routes.ts` |

### Module: user
| Nguồn | Đích |
|---|---|
| `controllers/user.controller.ts` | `modules/user/user.controller.ts` |
| `services/audit.service.ts` | `modules/user/audit.service.ts` |
| `services/password-history.service.ts` | `modules/user/password-history.service.ts` |
| `routes/user.route.ts` | `modules/user/user.routes.ts` |

### Module: analytics
| Nguồn | Đích |
|---|---|
| `controllers/product-stats.controller.ts` | `modules/analytics/analytics.controller.ts` |
| `controllers/product-sold-count.controller.ts` | `modules/analytics/sold-count.controller.ts` |
| `services/product-stats.service.ts` | `modules/analytics/product-stats.service.ts` |
| `services/product-sold-count.service.ts` | `modules/analytics/product-sold-count.service.ts` |
| `routes/product-stats.route.ts` | `modules/analytics/analytics.routes.ts` |
| `routes/product-sold-count.route.ts` | `modules/analytics/sold-count.routes.ts` |

### Module: notification
| Nguồn | Đích |
|---|---|
| `controllers/mail.webhook.controller.ts` | `modules/notification/mail-webhook.controller.ts` |
| `services/resend.service.ts` | `modules/notification/resend.service.ts` |
| `routes/mail.route.ts` | `modules/notification/notification.routes.ts` |

### Shared
| Nguồn | Đích |
|---|---|
| `middleware/errorHandler.ts` | `shared/middleware/error-handler.ts` |
| `middleware/logger.ts` | `shared/middleware/logger.ts` |
| `middleware/rateLimiter.ts` | `shared/middleware/rate-limiter.ts` |
| `middleware/api-security.ts` | `shared/middleware/api-security.ts` |
| `middleware/auth.ts` | `shared/middleware/auth.ts` |
| `services/cache.service.ts` | `shared/services/cache.service.ts` |
| `services/encryption.service.ts` | `shared/services/encryption.service.ts` |
| `services/token-blacklist.service.ts` | `shared/services/token-blacklist.service.ts` |
| `utils/cache.ts` | `shared/utils/cache.ts` |
| `utils/logger.ts` | `shared/utils/logger.ts` |
| `utils/validation.ts` | `shared/utils/validation.ts` |
| `utils/sitemap.ts` | `shared/utils/sitemap.ts` |

---

## 7. Lưu ý quan trọng

1. **Không thay đổi API contract** — tất cả endpoint URLs giữ nguyên
2. **Migrate từng module** — không refactor tất cả cùng lúc
3. **Test sau mỗi module** — đảm bảo không regression
4. **Git history** — dùng `git mv` để giữ file history
5. **tsconfig paths** — cập nhật aliases để import gọn
6. **Circular deps** — dùng dependency-cruiser hoặc madge để kiểm tra
7. **Web refactor nhẹ hơn** — vì đã feature-first, chỉ cần move API + pages

---

## 8. Thứ tự ưu tiên gợi ý

1. ⭐ **Phase 1-2**: Server modules (impact lớn nhất)
2. ⭐ **Phase 3-4**: Jobs + cleanup
3. **Phase 5**: Web refinement
4. **Phase 6**: DB schema split (optional, low priority)
5. **Phase 7**: Documentation
