/**
 * Mã loại đơn / giống prefix admin_orderlist (MAVC, MAVL, …).
 * Dùng cho danh sách sản phẩm (giá “TỪ”) theo đúng công thức từng vai trò.
 */
export const PRODUCT_LIST_PRICE_SCOPES = [
  /** Admin: giá gốc / cost NCC (price_max supply), làm tròn nghìn */
  "MAV",
  "MAVC",
  "MAVL",
  "MAVK",
  "MAVT",
  "MAVN",
  "MAVS",
] as const;

export type ProductListPriceScope = (typeof PRODUCT_LIST_PRICE_SCOPES)[number];

export function normalizeProductListPriceScope(raw: unknown): ProductListPriceScope {
  const s = String(raw ?? "MAVL")
    .trim()
    .toUpperCase()
    .slice(0, 4);
  return (PRODUCT_LIST_PRICE_SCOPES as readonly string[]).includes(s)
    ? (s as ProductListPriceScope)
    : "MAVL";
}

/** Gắn JWT `role` để giỏ hàng (CTV vs CUSTOMER) khớp CTV = MAVC. */
export function jwtShoppingRoleFromPriceScope(scope: ProductListPriceScope): "CTV" | "CUSTOMER" {
  return scope === "MAVC" ? "CTV" : "CUSTOMER";
}
