# Cấu trúc thư mục – Web App (src)

Tài liệu mô tả quy ước thư mục và nơi đặt code để dễ bảo trì và mở rộng.

## Tổng quan

```
src/
├── components/     # Component dùng chung (UI, layout, menu)
├── features/       # Theo từng tính năng (auth, cart, profile, topup, ...)
├── hooks/          # Hook dùng chung (useCart, useScroll, useAuth từ feature)
├── lib/            # API, types, utils, config, SEO
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

Mỗi feature thường có cấu trúc:

```
features/<feature-name>/
├── components/       # Component chỉ dùng trong feature
├── hooks/            # Hook riêng (useAuth, useProductData, ...)
├── api/              # Gọi API riêng (fetchProfile, ...)
├── config/           # Cấu hình (tabs, routes)
├── constants.ts      # Hằng số
├── utils.ts          # Hàm tiện ích
├── <Feature>Page.tsx # Trang chính
└── index.ts          # Re-export public
```

**Ví dụ đã áp dụng**:

- **profile**: `config/tabs.ts`, `api/fetchProfile.ts`, `components/order-history/` (utils, Filters, Table, Modal, Cards, Pagination).
- **topup**: `constants.ts` (BANK_CONFIG, TOPUP_PACKAGES), `utils.ts` (formatCurrency, getSelectedAmount/Bonus), page gọn hơn.
- **auth**: `components/`, `hooks/useAuth.ts`, `services/`.

## 3. `hooks/`

Hook dùng ở nhiều nơi: `useCart`, `useScroll`, `useProducts`, `useCategories`, `usePromotions`.  
Hook gắn chặt với một feature nên đặt trong `features/<name>/hooks/` (vd: `useAuth`, `useProductData`).

## 4. `lib/`

- **api/**: Gọi API (auth, cart, products, user, …).
- **types/**: Type/interface dùng chung (api.types, …).
- **utils/**: Hàm thuần (cn, slugify, pricing, …).
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
| useCart.ts ~276 dòng | hooks/cartStorage.ts (CartItem type, loadCart, saveCart, getAuthToken, getCartItemCount), useCart chỉ state + API |
| ProductDetailPage.tsx ~305 dòng | product/hooks/useProductDetailState.ts (selectedPackage, selectedDuration, additionalInfo, URL sync, handlers), page gọn |
| HomePage.tsx ~224 dòng | home/hooks/useSyncUserBalance.ts, bỏ effect sync balance trong page |
| BuyButton.tsx ~229 dòng | product/constants.ts (CONTACT_LINKS), BuyButton import từ constants |
| ReviewSection.tsx ~232 dòng | product/utils/reviewUtils.ts (getRatingLabel), ReviewSection gọn |

Thêm tính năng mới nên tuân theo cấu trúc trên để code dễ tìm và tái sử dụng.
