import prisma from "@my-store/db";

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
  const items = await prisma.$queryRaw<CartItemDB[]>`
    SELECT id, account_id, variant_id, quantity, extra_info, created_at, updated_at
    FROM customer.cart_items
    WHERE account_id = ${accId}
    ORDER BY created_at DESC
  `;
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
  const items = await prisma.$queryRaw<CartItemDB[]>`
    SELECT id, account_id, variant_id, quantity, extra_info, created_at, updated_at
    FROM customer.cart_items
    WHERE account_id = ${accId} AND variant_id = ${variantId}
    LIMIT 1
  `;
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
  const items = await prisma.$queryRaw<CartItemDB[]>`
    INSERT INTO customer.cart_items (id, account_id, variant_id, quantity, extra_info, created_at, updated_at)
    VALUES (${id}, ${accId}, ${variantId}, ${quantity}, ${extraInfoJson}::jsonb, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      quantity = customer.cart_items.quantity + ${quantity},
      extra_info = COALESCE(${extraInfoJson}::jsonb, customer.cart_items.extra_info),
      updated_at = NOW()
    RETURNING id, account_id, variant_id, quantity, extra_info, created_at, updated_at
  `;

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

  const items = await prisma.$queryRaw<CartItemDB[]>`
    UPDATE customer.cart_items
    SET quantity = ${quantity}, updated_at = NOW()
    WHERE account_id = ${accId} AND variant_id = ${variantId}
    RETURNING id, account_id, variant_id, quantity, extra_info, created_at, updated_at
  `;

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
  const result = await prisma.$executeRaw`
    DELETE FROM customer.cart_items
    WHERE account_id = ${accId} AND variant_id = ${variantId}
  `;
  return result > 0;
}

/**
 * Clear all items from cart
 */
export async function clearCart(accountId: string | number): Promise<number> {
  const accId = toAccountId(accountId);
  const result = await prisma.$executeRaw`
    DELETE FROM customer.cart_items
    WHERE account_id = ${accId}
  `;
  return result;
}

/**
 * Get cart item count
 */
export async function getCartItemCount(accountId: string | number): Promise<number> {
  const accId = toAccountId(accountId);
  const result = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM customer.cart_items
    WHERE account_id = ${accId}
  `;
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
