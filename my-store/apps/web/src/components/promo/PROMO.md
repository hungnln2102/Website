# Phân bổ giá trị Promo (Discount)

Tài liệu mô tả công thức và cách dùng util + component phân bổ tổng discount (D) cho nhiều sản phẩm sao cho **tổng discount phân bổ = D chính xác**, không lệch 1 đồng do làm tròn.

---

## Công thức tổng quát (n sản phẩm)

**Giả sử:**

- Có **n** sản phẩm.
- Giá từng sản phẩm: **P₁, P₂, ..., Pₙ**.
- **Subtotal** = **S** = P₁ + P₂ + ... + Pₙ.
- Tổng discount cần phân bổ = **D**.

**Bước 1 — Discount tạm cho từng item (trừ item cuối):**

Với `i` từ `1` → `n-1`:

```
Di = round(D × Pi / S)
```

**Bước 2 — Item cuối nhận phần còn lại:**

```
Dn = D - (D1 + D2 + ... + D(n-1))
```

**Kết quả:**

- D₁ + D₂ + ... + Dₙ = **D** (100% chính xác).
- Không bao giờ lệch 1 đồng.

---

## Util — `promoAllocation`

**File:** `@/lib/utils/promoAllocation.ts`

### `allocatePromoDiscount(prices, totalDiscount)`

Phân bổ tổng discount theo mảng giá (đã là tổng dòng nếu có quantity).

| Tham số         | Kiểu        | Mô tả                                                |
|-----------------|-------------|------------------------------------------------------|
| `prices`        | `number[]`  | Mảng giá từng item (P₁..Pₙ). Có thể là `price × quantity`. |
| `totalDiscount` | `number`    | Tổng discount cần phân bổ (D).                       |

**Trả về:** `number[]` — Mảng discount từng item (D₁..Dₙ), tổng luôn bằng `totalDiscount`.

**Ví dụ:**

```ts
import { allocatePromoDiscount } from "@/lib/utils/promoAllocation";

const prices = [100_000, 200_000, 300_000]; // S = 600_000
const D = 50_000;
const allocation = allocatePromoDiscount(prices, D);
// allocation = [8333, 16667, 25000] (ví dụ), tổng = 50_000
```

### `allocatePromoByItems(items, totalDiscount)`

Nhận danh sách item có `price` và `quantity`, trả về discount phân bổ theo từng dòng.

| Tham số         | Kiểu        | Mô tả                              |
|-----------------|-------------|------------------------------------|
| `items`         | `Array<{ price: number; quantity?: number }>` | Giá đơn vị, quantity mặc định 1. |
| `totalDiscount` | `number`    | Tổng discount (D).                 |

**Trả về:** `number[]` — Discount từng item (theo thứ tự), tổng = `totalDiscount`.

**Ví dụ:**

```ts
import { allocatePromoByItems } from "@/lib/utils/promoAllocation";

const items = [
  { price: 100_000, quantity: 2 }, // 200_000
  { price: 50_000, quantity: 1 },  // 50_000
];
const allocation = allocatePromoByItems(items, 25_000);
// allocation[0] + allocation[1] = 25_000
```

---

## Component — `PromoAllocation`

**File:** `@/components/promo/PromoAllocation.tsx`  
**Export:** `import { PromoAllocation } from "@/components/promo";`

Tính toán và hiển thị phân bổ discount theo công thức trên (subtotal, giảm giá từng dòng, tổng thanh toán).

### Props

| Prop             | Kiểu                       | Mặc định   | Mô tả                              |
|------------------|----------------------------|------------|------------------------------------|
| `items`          | `PromoAllocationItem[]`    | (bắt buộc) | Danh sách item (label, price, quantity). |
| `totalDiscount`  | `number`                   | (bắt buộc) | Tổng discount cần phân bổ (D).     |
| `showBreakdown`  | `boolean`                  | `true`     | Hiển thị bảng chi tiết từng dòng.  |
| `formatCurrency` | `(value: number) => string`| `vi-VN đ`  | Hàm format số tiền.                |
| `className`      | `string`                   | `""`       | Class cho container.               |

`PromoAllocationItem`: `{ label?: string; price: number; quantity?: number }`.

### Ví dụ dùng component

```tsx
import { PromoAllocation } from "@/components/promo";

<PromoAllocation
  items={[
    { label: "Sản phẩm A", price: 100_000, quantity: 2 },
    { label: "Sản phẩm B", price: 50_000, quantity: 1 },
  ]}
  totalDiscount={30_000}
  showBreakdown={true}
  formatCurrency={(v) => `${v.toLocaleString("vi-VN")}đ`}
/>
```

---

## Tích hợp vào Giỏ hàng / Checkout

1. Có danh sách dòng giỏ: mỗi dòng có `price`, `quantity` (và có thể `label`).
2. Có tổng discount áp dụng cho đơn (ví dụ từ mã khuyến mãi): `totalDiscount`.
3. **Lấy discount từng dòng:**  
   `const perLineDiscount = allocatePromoByItems(cartLines, totalDiscount);`
4. **Hiển thị:** Dùng component `<PromoAllocation items={cartLines} totalDiscount={totalDiscount} />` hoặc tự render từ `perLineDiscount`.
5. **Lưu đơn:** Có thể lưu `totalDiscount` và/hoặc từng `perLineDiscount[i]` tùy backend.

---

## Test

File test: `src/lib/utils/promoAllocation.test.ts`.

Chạy:

```bash
npx vitest run src/lib/utils/promoAllocation.test.ts
```

Các case: tổng phân bổ = D, không lệch với nhiều item, mảng rỗng, totalDiscount ≤ 0, một sản phẩm, `allocatePromoByItems` theo price×quantity.
