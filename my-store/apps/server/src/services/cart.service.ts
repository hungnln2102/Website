import prisma from "@my-store/db";
import { DB_SCHEMA } from "../config/db.config";

const CART_SCHEMA = DB_SCHEMA.CART_ITEMS!.SCHEMA;
const CART_TABLE = DB_SCHEMA.CART_ITEMS!.TABLE;
const CART_FULL = `"${CART_SCHEMA}"."${CART_TABLE}"`;

export interface CartItemDB {
  id: string;
  account_id: number;
  variant_id: string;
  quantity: number;
  extra_info: {
    name?: string;
    packageName?: string;
    duration?: string;
    price?: number;
    originalPrice?: number;
    discountPercentage?: number;
    imageUrl?: string;
  } | null;
  created_at: Date;
  updated_at: Date;
}

export interface AddCartItemInput {
  accountId: string | number;
  variantId: string;
  quantity?: number;
  extraInfo?: {
    name?: string;
    packageName?: string;
    duration?: string;
    price?: number;
    originalPrice?: number;
    discountPercentage?: number;
    imageUrl?: string;
  };
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
 * Get all cart items for a user
 */
export async function getCartItems(accountId: string | number): Promise<CartItemDB[]> {
  const accId = toAccountId(accountId);
  const items = await prisma.$queryRawUnsafe<CartItemDB[]>(
    `SELECT id, account_id, variant_id, quantity, extra_info, created_at, updated_at FROM ${CART_FULL} WHERE account_id = $1 ORDER BY created_at DESC`,
    accId
  );
  return items;
}

/**
 * Get a specific cart item
 */
export async function getCartItem(
  accountId: string | number,
  variantId: string
): Promise<CartItemDB | null> {
  const accId = toAccountId(accountId);
  const items = await prisma.$queryRawUnsafe<CartItemDB[]>(
    `SELECT id, account_id, variant_id, quantity, extra_info, created_at, updated_at FROM ${CART_FULL} WHERE account_id = $1 AND variant_id = $2 LIMIT 1`,
    accId,
    variantId
  );
  return items[0] || null;
}

/**
 * Add item to cart (or update quantity if exists)
 */
export async function addCartItem(input: AddCartItemInput): Promise<CartItemDB> {
  const { accountId, variantId, quantity = 1, extraInfo } = input;
  const accId = toAccountId(accountId);
  const id = `${accId}-${variantId}`;
  const extraInfoJson = extraInfo ? JSON.stringify(extraInfo) : null;

  // Upsert - insert or update if exists
  const items = await prisma.$queryRawUnsafe<CartItemDB[]>(
    `INSERT INTO ${CART_FULL} (id, account_id, variant_id, quantity, extra_info, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       quantity = ${CART_FULL}.quantity + EXCLUDED.quantity,
       extra_info = COALESCE(EXCLUDED.extra_info, ${CART_FULL}.extra_info),
       updated_at = NOW()
     RETURNING id, account_id, variant_id, quantity, extra_info, created_at, updated_at`,
    id,
    accId,
    variantId,
    quantity,
    extraInfoJson
  );

  const row = items[0];
  if (!row) throw new Error("Cart insert did not return row");
  return row;
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

  const items = await prisma.$queryRawUnsafe<CartItemDB[]>(
    `UPDATE ${CART_FULL} SET quantity = $1, updated_at = NOW() WHERE account_id = $2 AND variant_id = $3 RETURNING id, account_id, variant_id, quantity, extra_info, created_at, updated_at`,
    quantity,
    accId,
    variantId
  );
  return items[0] || null;
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

/**
 * Sync local cart items to database (merge localStorage cart on login)
 */
export async function syncCartItems(
  accountId: string | number,
  localItems: Array<{
    variantId: string;
    quantity: number;
    extraInfo?: AddCartItemInput["extraInfo"];
  }>
): Promise<CartItemDB[]> {
  const accId = toAccountId(accountId);
  
  // Add each local item to cart (will merge with existing)
  for (const item of localItems) {
    await addCartItem({
      accountId: accId,
      variantId: item.variantId,
      quantity: item.quantity,
      extraInfo: item.extraInfo,
    });
  }

  // Return updated cart
  return getCartItems(accId);
}
