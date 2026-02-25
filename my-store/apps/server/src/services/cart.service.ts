import prisma from "@my-store/db";
import pool from "../config/database";
import { DB_SCHEMA, TABLES } from "../config/db.config";

const CART_SCHEMA = DB_SCHEMA.CART_ITEMS!.SCHEMA;
const CART_TABLE = DB_SCHEMA.CART_ITEMS!.TABLE;
const CART_FULL = `"${CART_SCHEMA}"."${CART_TABLE}"`;
const PRODUCT_SCHEMA = DB_SCHEMA.PRODUCT!.SCHEMA;
/** Bảng supplier_cost (có dấu ngoặc để tránh lỗi schema) — dùng cùng config với promotions. */
const SUPPLIER_COST_FULL = `"${DB_SCHEMA.SUPPLIER_COST!.SCHEMA}"."${DB_SCHEMA.SUPPLIER_COST!.TABLE}"`;

/** Thông tin bổ sung (form) — JSON trong cart_items.extra_info: { "input_name": "Dữ liệu ô input" } */
export type CartExtraInfo = Record<string, string>;

/** Loại giá: retail = khách lẻ, promo = khuyến mãi, ctv = cộng tác viên */
export type CartPriceType = "retail" | "promo" | "ctv";

export interface CartItemDB {
  id: string;
  account_id: number;
  variant_id: string;
  quantity: number;
  price_type: CartPriceType;
  extra_info: CartExtraInfo | null;
  created_at: Date;
  updated_at: Date;
}

export interface AddCartItemInput {
  accountId: string | number;
  variantId: string;
  quantity?: number;
  /** retail | promo | ctv — dùng để lấy đúng giá từ price_config */
  priceType?: CartPriceType;
  /** Thông tin bổ sung: { "input_name": "value" } hoặc format cũ { additionalInfo, additionalInfoLabels }; sẽ chuẩn hóa trước khi lưu */
  extraInfo?: unknown;
}

export interface UpdateCartItemInput {
  accountId: string | number;
  variantId: string;
  quantity: number;
}

// Helper to convert accountId to number
const toAccountId = (id: string | number): number => {
  return typeof id === "string" ? parseInt(id, 10) : id;
};

/**
 * Get all cart items for a user (raw, no enrichment)
 */
export async function getCartItems(accountId: string | number): Promise<CartItemDB[]> {
  const accId = toAccountId(accountId);
  const items = await prisma.$queryRawUnsafe<(CartItemDB & { price_type?: string })[]>(
    `SELECT id, account_id, variant_id, quantity, COALESCE(price_type, 'retail') as price_type, extra_info, created_at, updated_at FROM ${CART_FULL} WHERE account_id = $1 ORDER BY created_at DESC`,
    accId
  );
  return items.map((r) => ({ ...r, id: String(r.id), price_type: (r.price_type || "retail") as CartPriceType }));
}

/**
 * Get a specific cart item
 */
export async function getCartItem(
  accountId: string | number,
  variantId: string
): Promise<CartItemDB | null> {
  const accId = toAccountId(accountId);
  const items = await prisma.$queryRawUnsafe<(CartItemDB & { price_type?: string })[]>(
    `SELECT id, account_id, variant_id, quantity, COALESCE(price_type, 'retail') as price_type, extra_info, created_at, updated_at FROM ${CART_FULL} WHERE account_id = $1 AND variant_id = $2 LIMIT 1`,
    accId,
    variantId
  );
  const r = items[0];
  return r ? { ...r, id: String(r.id), price_type: (r.price_type || "retail") as CartPriceType } : null;
}

/**
 * Add item to cart (or update quantity if exists).
 * Bảng cart_items.id là cột tự sinh (SERIAL/IDENTITY). Không dùng ON CONFLICT để tránh phụ thuộc UNIQUE(account_id, variant_id).
 * extraInfo: lưu dạng { "input_name": "Dữ liệu ô input" }. Nếu nhận format cũ { additionalInfo, additionalInfoLabels } thì chuyển sang format mới.
 */
function normalizeExtraInfo(extraInfo: unknown): CartExtraInfo | null {
  if (extraInfo == null || typeof extraInfo !== "object") return null;
  const o = extraInfo as Record<string, unknown>;
  if (o.additionalInfo != null && typeof o.additionalInfo === "object" && !Array.isArray(o.additionalInfo)) {
    const labels = (o.additionalInfoLabels as Record<string, string>) || {};
    const result: Record<string, string> = {};
    for (const [inputId, value] of Object.entries(o.additionalInfo as Record<string, string>)) {
      const inputName = labels[inputId] ?? inputId;
      result[inputName] = String(value ?? "");
    }
    return Object.keys(result).length > 0 ? result : null;
  }
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string") flat[k] = v;
  }
  return Object.keys(flat).length > 0 ? flat : null;
}

export async function addCartItem(input: AddCartItemInput): Promise<CartItemDB> {
  const { accountId, variantId, quantity = 1, priceType = "retail", extraInfo: rawExtraInfo } = input;
  const accId = toAccountId(accountId);
  const extraInfo = normalizeExtraInfo(rawExtraInfo);
  const extraInfoJson = extraInfo ? JSON.stringify(extraInfo) : null;

  const existing = await getCartItem(accountId, variantId);
  if (existing) {
    const newQuantity = existing.quantity + quantity;
    const updated = await prisma.$queryRawUnsafe<(CartItemDB & { price_type?: string })[]>(
      `UPDATE ${CART_FULL} SET quantity = $1, price_type = $2, extra_info = $3::jsonb, updated_at = NOW()
       WHERE account_id = $4 AND variant_id = $5
       RETURNING id, account_id, variant_id, quantity, COALESCE(price_type, 'retail') as price_type, extra_info, created_at, updated_at`,
      newQuantity,
      priceType,
      extraInfoJson,
      accId,
      variantId
    );
    const row = updated[0];
    if (!row) throw new Error("Cart update did not return row");
    return { ...row, id: String(row.id), price_type: (row.price_type || "retail") as CartPriceType };
  }

  const inserted = await prisma.$queryRawUnsafe<(CartItemDB & { price_type?: string })[]>(
    `INSERT INTO ${CART_FULL} (account_id, variant_id, quantity, price_type, extra_info, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
     RETURNING id, account_id, variant_id, quantity, COALESCE(price_type, 'retail') as price_type, extra_info, created_at, updated_at`,
    accId,
    variantId,
    quantity,
    priceType,
    extraInfoJson
  );

  const row = inserted[0];
  if (!row) throw new Error("Cart insert did not return row");
  return { ...row, id: String(row.id), price_type: (row.price_type || "retail") as CartPriceType };
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  input: UpdateCartItemInput
): Promise<CartItemDB | null> {
  const { accountId, variantId, quantity } = input;
  const accId = toAccountId(accountId);

  if (quantity <= 0) {
    await removeCartItem(accId, variantId);
    return null;
  }

  const items = await prisma.$queryRawUnsafe<(CartItemDB & { price_type?: string })[]>(
    `UPDATE ${CART_FULL} SET quantity = $1, updated_at = NOW() WHERE account_id = $2 AND variant_id = $3 RETURNING id, account_id, variant_id, quantity, COALESCE(price_type, 'retail') as price_type, extra_info, created_at, updated_at`,
    quantity,
    accId,
    variantId
  );
  const r = items[0];
  return r ? { ...r, id: String(r.id), price_type: (r.price_type || "retail") as CartPriceType } : null;
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  accountId: string | number,
  variantId: string
): Promise<boolean> {
  const accId = toAccountId(accountId);
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM ${CART_FULL} WHERE account_id = $1 AND variant_id = $2`,
    accId,
    variantId
  );
  return result > 0;
}

/**
 * Clear all items from cart
 */
export async function clearCart(accountId: string | number): Promise<number> {
  const accId = toAccountId(accountId);
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM ${CART_FULL} WHERE account_id = $1`,
    accId
  );
  return result;
}

/**
 * Get cart item count
 */
export async function getCartItemCount(accountId: string | number): Promise<number> {
  const accId = toAccountId(accountId);
  const result = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
    `SELECT COALESCE(SUM(quantity), 0) as total FROM ${CART_FULL} WHERE account_id = $1`,
    accId
  );
  return Number(result[0]?.total || 0);
}

/** Item trả về cho FE: dữ liệu sản phẩm từ variant + price_config theo price_type */
export interface CartItemEnriched {
  id: string;
  variantId: string;
  quantity: number;
  priceType: CartPriceType;
  extraInfo: CartExtraInfo | null;
  name: string;
  packageName: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl?: string | null;
  /** Mô tả sản phẩm từ product_desc */
  description?: string | null;
  /** Quy tắc mua hàng từ product_desc.rules */
  purchaseRules?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Cart items kèm tên/giá/hình từ variant + price_config (giá theo price_type).
 * Đối chiếu: cart_items.variant_id → supplier_cost.variant_id để lấy price_max.
 */
export async function getCartItemsEnriched(accountId: string | number): Promise<CartItemEnriched[]> {
  const accId = toAccountId(accountId);
  const schema = `"${PRODUCT_SCHEMA}"`;
  const { rows } = await pool.query<
    {
      id: string;
      variant_id: string;
      quantity: number;
      price_type: string;
      extra_info: CartExtraInfo | null;
      created_at: Date;
      updated_at: Date;
      display_name: string | null;
      variant_name: string | null;
      duration: string | null;
      image_url: string | null;
      description: string | null;
      purchase_rules: string | null;
      pct_ctv: unknown;
      pct_khach: unknown;
      pct_promo: unknown;
      price_max: unknown;
    }[]
  >(
    `WITH supply_max AS (
       SELECT sc.variant_id, MAX(sc.price::numeric) AS price_max
       FROM ${SUPPLIER_COST_FULL} sc
       GROUP BY sc.variant_id
     )
     SELECT
       c.id, c.variant_id, c.quantity, COALESCE(c.price_type, 'retail') AS price_type, c.extra_info, c.created_at, c.updated_at,
       v.display_name, v.variant_name,
       SPLIT_PART(v.display_name::text, '--', 2) AS duration,
       pd.image_url, pd.description, pd.rules AS purchase_rules,
       COALESCE(pc.pct_ctv, 0) AS pct_ctv, COALESCE(pc.pct_khach, 0) AS pct_khach, pc.pct_promo,
       COALESCE(COALESCE(sm_v.price_max, sm_fallback.price_max), 0) AS price_max
     FROM ${CART_FULL} c
     LEFT JOIN ${schema}.variant v ON v.id::text = c.variant_id::text
     LEFT JOIN ${schema}.product_desc pd ON pd.variant_id = v.id
     LEFT JOIN LATERAL (
       SELECT pct_ctv, pct_khach, pct_promo FROM ${schema}.price_config WHERE variant_id::text = c.variant_id::text ORDER BY updated_at DESC NULLS LAST LIMIT 1
     ) pc ON TRUE
     LEFT JOIN supply_max sm_v ON sm_v.variant_id = (v.id)::int
     LEFT JOIN LATERAL (
       SELECT MAX(sm.price_max) AS price_max
       FROM supply_max sm
       INNER JOIN ${schema}.variant v2 ON v2.id = (sm.variant_id)::int AND v2.product_id = v.product_id
     ) sm_fallback ON TRUE
     WHERE c.account_id = $1
     ORDER BY c.created_at DESC`,
    [accId]
  );
  return rows.map((r) => {
    const pctCtv = toNum(r.pct_ctv);
    const pctKhach = toNum(r.pct_khach);
    const pctPromo = toNum(r.pct_promo);
    const priceMax = toNum(r.price_max);
    // retail = giá bình thường (pct_ctv * price_max * pct_khach)
    const salePrice = Math.round((pctCtv * priceMax * pctKhach) / 1000) * 1000;
    // promo = Deal Sốc: sale * (1 - pct_promo)
    const promoPrice =
      pctPromo > 0 ? Math.round((salePrice * (1 - (pctPromo > 1 ? pctPromo / 100 : pctPromo))) / 1000) * 1000 : salePrice;
    // ctv = pct_ctv * price (base)
    const ctvPrice = Math.round((pctCtv * priceMax) / 1000) * 1000;
    const priceType = (r.price_type || "retail") as CartPriceType;
    const price =
      priceType === "promo" ? promoPrice : priceType === "ctv" ? ctvPrice : salePrice;
    const originalPrice = priceType === "promo" && pctPromo > 0 ? salePrice : undefined;
    const discountPercentage = priceType === "promo" && pctPromo > 0 ? (pctPromo > 1 ? pctPromo : pctPromo * 100) : undefined;
    const baseName = r.display_name ? r.display_name.split("--")[0] : "";
    const duration = r.duration || "";

    // Log để kiểm tra giỏ hàng / giá
    console.log("[Cart] getCartItemsEnriched item", {
      variant_id: r.variant_id,
      price_type: priceType,
      price_max: priceMax,
      pct_ctv: pctCtv,
      pct_khach: pctKhach,
      pct_promo: pctPromo,
      salePrice,
      promoPrice,
      ctvPrice,
      price,
      name: r.display_name || r.variant_name,
    });
    if (priceMax === 0) {
      console.warn(
        "[Cart] price = 0 vì price_max = 0. Kiểm tra bảng supplier_cost: cần có bản ghi với variant_id (",
        r.variant_id,
        ") hoặc variant khác cùng product có supplier_cost."
      );
    }

    return {
      id: String(r.id),
      variantId: r.variant_id,
      quantity: r.quantity,
      priceType,
      extraInfo: r.extra_info,
      name: r.display_name || r.variant_name || "Sản phẩm",
      packageName: r.variant_name || baseName || "",
      duration,
      price,
      originalPrice,
      discountPercentage,
      imageUrl: r.image_url,
      description: r.description ?? undefined,
      purchaseRules: r.purchase_rules ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

/** Dữ liệu đầy đủ sản phẩm theo variant_id (dùng khi chỉ có variant_id) */
export interface VariantProductData {
  variantId: string;
  name: string;
  packageName: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  priceType: CartPriceType;
  imageUrl?: string | null;
  description?: string | null;
  purchaseRules?: string | null;
}

/**
 * Lấy đủ dữ liệu sản phẩm theo variant_id (giá theo price_type, mô tả/hình từ product_desc).
 */
export async function getVariantProductData(
  variantId: string,
  priceType: CartPriceType = "retail"
): Promise<VariantProductData | null> {
  const schema = `"${PRODUCT_SCHEMA}"`;
  const rows = await prisma.$queryRawUnsafe<
    {
      variant_id: string;
      display_name: string | null;
      variant_name: string | null;
      duration: string | null;
      image_url: string | null;
      description: string | null;
      purchase_rules: string | null;
      pct_ctv: unknown;
      pct_khach: unknown;
      pct_promo: unknown;
      price_max: unknown;
    }[]
  >(
    `WITH supply_max AS (
       SELECT sc.variant_id, MAX(sc.price::numeric) AS price_max
       FROM ${SUPPLIER_COST_FULL} sc
       GROUP BY sc.variant_id
     )
     SELECT
       v.id AS variant_id,
       v.display_name, v.variant_name,
       SPLIT_PART(v.display_name::text, '--', 2) AS duration,
       pd.image_url, pd.description, pd.rules AS purchase_rules,
       COALESCE(pc.pct_ctv, 0) AS pct_ctv, COALESCE(pc.pct_khach, 0) AS pct_khach, pc.pct_promo,
       COALESCE(COALESCE(sm_v.price_max, sm_fallback.price_max), 0) AS price_max
     FROM ${schema}.variant v
     LEFT JOIN ${schema}.product_desc pd ON pd.variant_id = v.id
     LEFT JOIN LATERAL (
       SELECT pct_ctv, pct_khach, pct_promo FROM ${schema}.price_config WHERE variant_id = v.id ORDER BY updated_at DESC NULLS LAST LIMIT 1
     ) pc ON TRUE
     LEFT JOIN supply_max sm_v ON sm_v.variant_id = v.id
     LEFT JOIN LATERAL (
       SELECT MAX(sm.price_max) AS price_max
       FROM supply_max sm
       INNER JOIN ${schema}.variant v2 ON v2.id = sm.variant_id AND v2.product_id = v.product_id
     ) sm_fallback ON TRUE
     WHERE v.id::text = $1`,
    variantId
  );
  const r = rows[0];
  if (!r) return null;

  const pctCtv = toNum(r.pct_ctv);
  const pctKhach = toNum(r.pct_khach);
  const pctPromo = toNum(r.pct_promo);
  const priceMax = toNum(r.price_max);
  const salePrice = Math.round((pctCtv * priceMax * pctKhach) / 1000) * 1000;
  const promoPrice =
    pctPromo > 0 ? Math.round((salePrice * (1 - (pctPromo > 1 ? pctPromo / 100 : pctPromo))) / 1000) * 1000 : salePrice;
  const ctvPrice = Math.round((pctCtv * priceMax) / 1000) * 1000;
  const price = priceType === "promo" ? promoPrice : priceType === "ctv" ? ctvPrice : salePrice;
  const originalPrice = priceType === "promo" && pctPromo > 0 ? salePrice : undefined;
  const discountPercentage = priceType === "promo" && pctPromo > 0 ? (pctPromo > 1 ? pctPromo : pctPromo * 100) : undefined;
  const baseName = r.display_name ? r.display_name.split("--")[0] : "";

  return {
    variantId: String(r.variant_id),
    name: r.display_name || r.variant_name || "Sản phẩm",
    packageName: r.variant_name || baseName || "",
    duration: r.duration || "",
    price,
    originalPrice,
    discountPercentage,
    priceType,
    imageUrl: r.image_url,
    description: r.description ?? undefined,
    purchaseRules: r.purchase_rules ?? undefined,
  };
}

/**
 * Sync local cart items to database (merge localStorage cart on login)
 */
export async function syncCartItems(
  accountId: string | number,
  localItems: Array<{
    variantId: string;
    quantity: number;
    priceType?: CartPriceType;
    extraInfo?: AddCartItemInput["extraInfo"];
  }>
): Promise<CartItemDB[]> {
  const accId = toAccountId(accountId);

  for (const item of localItems) {
    await addCartItem({
      accountId: accId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceType: item.priceType ?? "retail",
      extraInfo: item.extraInfo,
    });
  }

  return getCartItems(accId);
}
