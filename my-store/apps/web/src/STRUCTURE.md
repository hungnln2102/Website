# Cấu trúc thư mục – Web App (src)

Tài liệu mô tả quy ước thư mục và nơi đặt code để dễ bảo trì và mở rộng.

## Tổng quan

```
src/
├── components/     # Component dùng chung (UI, layout, menu)
├── features/       # Theo từng tính năng (auth, cart, catalog, product, profile, wallet, ...)
│   └── <feature>/
│       ├── api/        # API clients riêng feature (đã chuyển từ lib/api/)
│       ├── components/ # Component chỉ dùng trong feature
│       ├── hooks/      # Hook riêng feature
│       ├── ...
│       └── index.ts
├── hooks/          # Hook dùng chung (useScroll, useRouter, useKeyboardNavigation)
├── lib/            # Shared: API client base, types, utils, config, SEO
│   └── api/        # API barrel (re-export từ features) + client.ts + forms.api.ts
├── pages/          # Trang (thường re-export từ features)
├── App.tsx
└── main.tsx
```

## 1. `components/`

- **UI nguyên tử**: `components/ui/` (button, input, dropdown, …).
- **Layout / shared**: `SiteHeader`, `Footer`, `MenuBar`, `ProductCard`, `Pagination`, …
- **Nhóm theo domain**: `components/menu/` (menuConstants), `components/SEO/`, `components/providers/`, `components/accessibility/`.

**Quy ước**: Mỗi component phức tạp có thể có thư mục con (vd: `menu/`) chứa constants hoặc sub-components.

## 2. `features/`

API clients đã được chuyển vào từng feature. Cấu trúc chuẩn:

```
features/<feature-name>/
├── api/              # API clients (trước đây nằm trong lib/api/)
├── components/       # Component chỉ dùng trong feature
├── hooks/            # Hook riêng (bao gồm hooks chuyển từ src/hooks/)
├── config/           # Cấu hình (tabs, routes)
├── constants.ts      # Hằng số
├── utils.ts          # Hàm tiện ích
├── types.ts          # Types riêng feature
├── <Feature>Page.tsx # Trang chính
└── index.ts          # Re-export public
```

**Feature mapping (sau refactor)**:

| Feature | API files | Hooks |
|---------|-----------|-------|
| **auth** | `auth.ts` (authFetch, CSRF, token) | `useAuth` |
| **product** | `products.api.ts`, `variant.api.ts`, `product-packages.api.ts` | `useProducts`, `useProductData`, `useProductSelection` |
| **catalog** | `categories.api.ts`, `promotions.api.ts` | `useCategories`, `usePromotions`, `useCatalogData` |
| **cart** | `cart.api.ts` | `useCart`, `useCartPageData` |
| **payment** | `payment.api.ts` | — |
| **profile** | `user.api.ts`, `fetchProfile.ts` | — |
| **wallet** | `topup.api.ts` | — |

## 3. `hooks/`

Chỉ giữ hooks dùng chung ở nhiều features:
- `useScroll` — theo dõi scroll position
- `useRouter` — app-level routing / URL parsing
- `useKeyboardNavigation` — keyboard nav utilities
- `useAuth` — re-export backward-compat từ `features/auth/hooks`

Hooks gắn chặt với một feature đã chuyển vào `features/<name>/hooks/`.

## 4. `lib/`

- **api/**: API barrel + shared infrastructure
  - `client.ts` — base HTTP client (`getApiBase`, `apiFetch`, `handleApiError`)
  - `forms.api.ts` — form API (shared, không thuộc feature cụ thể)
  - `index.ts` — re-export tất cả API từ features (backward compatibility)
- **types/**: Type/interface dùng chung (api.types, …).
- **utils/**: Hàm thuần (cn, slugify, pricing, fetchWithRetry, …).
- **config/**, **constants/**, **seo/**, **error-tracking/**, **performance/**: Cấu hình và công cụ chung.

## 5. `pages/`

Thường chỉ re-export hoặc wrap component từ `features/` (vd: HomePage, ProductDetailPage) để routing gọn.

## Nguyên tắc tái cấu trúc đã dùng

1. **Tách constants/config** ra file riêng (`constants.ts`, `config/tabs.ts`, `menuConstants.ts`) để tránh file page quá dài.
2. **Tách utils** (format, filter, tính toán) ra `utils.ts` hoặc `lib/utils`.
3. **Component lớn** tách thành thư mục con với nhiều file (vd: `order-history/`: OrderHistory, Filters, Table, Modal, Cards, Pagination, utils, constants).
4. **API gọi riêng feature** đặt trong `features/<name>/api/` (vd: `fetchProfile.ts`).
5. **Một file một trách nhiệm**: page chỉ orchestrate (state + gọi sub-components và hooks), logic chi tiết nằm trong hooks/utils/components.

## File đã tối ưu (tham khảo)

| Trước | Sau |
|-------|-----|
| OrderHistory.tsx ~700 dòng | order-history/ (utils, constants, Filters, Table, Cards, Modal, Pagination, useOrderCountdown) |
| TopupPage.tsx ~436 dòng | constants.ts, utils.ts, TopupPage.tsx gọn (~280 dòng), dùng useScroll từ hooks |
| ProfilePage.tsx ~262 dòng | config/tabs.ts, api/fetchProfile.ts, ProfilePage dùng PROFILE_TABS và fetchUserProfile |
| MenuBar.tsx ~341 dòng | menu/menuConstants.ts (MENU_ITEMS), MenuBar dùng MENU_ITEMS |
| RegisterForm.tsx ~406 dòng | auth/lib/registerValidation.ts (validateRegisterForm, dateOfBirthToApi, formatDateOfBirthInput, types), form gọn hơn |
| CategoryButton.tsx ~339 dòng | catalog/hooks/useCategoryMegaMenu.ts, catalog/components/CategoryMegaMenu.tsx, CategoryButton chỉ trigger + portal |
| PaymentStep.tsx ~250 dòng | cart/constants.ts (CART_BANK_CONFIG, PAYMENT_TIMEOUT_SECONDS, formatPaymentCurrency, formatPaymentTime), PaymentStep dùng constants |
| CartPage.tsx ~253 dòng | cart/utils/cartItemMapper.ts (mapStorageItemsToCartItemData, computeCartTotals), cart/hooks/useCartPageData.ts, CartPage gọn |
| useCart.ts ~276 dòng | features/cart/hooks/useCart.ts + features/cart/types.ts (CartItem type), useCart chỉ state + API |
| ProductDetailPage.tsx ~305 dòng | product/hooks/useProductDetailState.ts (selectedPackage, selectedDuration, additionalInfo, URL sync, handlers), page gọn |
| HomePage.tsx ~224 dòng | home/hooks/useSyncUserBalance.ts, bỏ effect sync balance trong page |
| BuyButton.tsx ~229 dòng | product/constants.ts (CONTACT_LINKS), BuyButton import từ constants |
| ReviewSection.tsx ~232 dòng | product/utils/reviewUtils.ts (getRatingLabel), ReviewSection gọn |

Thêm tính năng mới nên tuân theo cấu trúc trên để code dễ tìm và tái sử dụng.
