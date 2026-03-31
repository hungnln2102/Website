/**
 * Pricing calculation ported from admin_orderlist (backend/src/services/pricing/core.js).
 *
 * Formula (margin-based):
 *   ctvPrice     = priceMax / (1 - pctCtv)
 *   retailPrice  = ctvPrice / (1 - pctKhach)
 *   promoPrice   = retailPrice * (1 - pctPromo)
 *
 * All results rounded to nearest 1 000 VND.
 */

const clampOpenRatio = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.9999, Math.max(0, value));
};

const normalizeMarginRatio = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return clampOpenRatio(fallback);
  if (numeric === 0) return 0;
  if (numeric >= 1) return clampOpenRatio(fallback);
  return clampOpenRatio(numeric);
};

const normalizePromoRatio = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return clampOpenRatio(numeric > 1 ? numeric / 100 : numeric);
};

const roundToThousands = (value: number): number => {
  const numeric = Math.round(value);
  if (!Number.isFinite(numeric) || numeric === 0) return 0;
  const remainder = numeric % 1000;
  if (remainder === 0) return numeric;
  return remainder >= 500 ? numeric + (1000 - remainder) : numeric - remainder;
};

const calculateMarginBasedPrice = (basePrice: number, marginRatio: number): number => {
  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;
  const normalizedMargin = clampOpenRatio(marginRatio);
  const denominator = Math.max(0.0001, 1 - normalizedMargin);
  return basePrice / denominator;
};

export interface PricingInput {
  priceMax: number;
  pctCtv: number;
  pctKhach: number;
  pctPromo?: number | null;
}

export interface PricingResult {
  ctvPrice: number;
  retailPrice: number;
  promoPrice: number;
}

/**
 * Calculate selling prices from cost + margin ratios.
 * Matches admin_orderlist `calculateOrderPricingFromResolvedValues`.
 */
export function calculatePrices(input: PricingInput): PricingResult {
  const { priceMax, pctCtv, pctKhach, pctPromo } = input;

  const normalizedCtv = normalizeMarginRatio(pctCtv, 0);
  const normalizedKhach = normalizeMarginRatio(pctKhach, 0);
  const normalizedPromo = normalizePromoRatio(pctPromo);

  const ctvRaw = calculateMarginBasedPrice(priceMax, normalizedCtv);
  const retailRaw = calculateMarginBasedPrice(ctvRaw, normalizedKhach);

  const ctvPrice = Math.max(0, roundToThousands(Math.round(ctvRaw)));
  const retailPrice = Math.max(0, roundToThousands(Math.round(retailRaw)));
  const promoPrice =
    normalizedPromo > 0
      ? Math.max(0, roundToThousands(Math.round(retailRaw * (1 - normalizedPromo))))
      : retailPrice;

  return { ctvPrice, retailPrice, promoPrice };
}

/**
 * SQL expression that replicates the margin-based formula in PostgreSQL.
 * Use in place of the old `pct_ctv * price_max * pct_khach`.
 *
 * @param priceMaxExpr  - SQL expression for price_max  (e.g. "sm.price_max")
 * @param pctCtvExpr    - SQL expression for pct_ctv    (e.g. "v.pct_ctv")
 * @param pctKhachExpr  - SQL expression for pct_khach  (e.g. "v.pct_khach")
 */
export function sqlRetailPrice(
  priceMaxExpr: string,
  pctCtvExpr: string,
  pctKhachExpr: string,
): string {
  // ctv = price_max / GREATEST(1 - pct_ctv, 0.0001)
  // retail = ctv / GREATEST(1 - pct_khach, 0.0001)
  // Round to nearest 1000
  return `ROUND(
  (${priceMaxExpr})::numeric
  / GREATEST(1 - COALESCE(${pctCtvExpr}::numeric, 0), 0.0001)
  / GREATEST(1 - COALESCE(${pctKhachExpr}::numeric, 0), 0.0001)
  / 1000) * 1000`;
}

/**
 * SQL expression for promo price (retail * (1 - pct_promo)), rounded to 1000.
 */
export function sqlPromoPrice(
  priceMaxExpr: string,
  pctCtvExpr: string,
  pctKhachExpr: string,
  pctPromoExpr: string,
): string {
  return `ROUND(
  (${priceMaxExpr})::numeric
  / GREATEST(1 - COALESCE(${pctCtvExpr}::numeric, 0), 0.0001)
  / GREATEST(1 - COALESCE(${pctKhachExpr}::numeric, 0), 0.0001)
  * (1 - COALESCE(${pctPromoExpr}::numeric, 0))
  / 1000) * 1000`;
}

/**
 * SQL expression for CTV price (price_max / (1 - pct_ctv)), rounded to 1000.
 */
export function sqlCtvPrice(
  priceMaxExpr: string,
  pctCtvExpr: string,
): string {
  return `ROUND(
  (${priceMaxExpr})::numeric
  / GREATEST(1 - COALESCE(${pctCtvExpr}::numeric, 0), 0.0001)
  / 1000) * 1000`;
}
