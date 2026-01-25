/**
 * Pricing calculation utilities
 */

export type ProductPriceRow = {
  id: string | number;
  pct_ctv: number | string | null;
  pct_khach: number | string | null;
  pct_promo: number | string | null;
};

export type SupplyPriceRow = {
  product_id: string | number;
  price: number | string;
};

type Numeric = number | string | null | undefined;

const toNumber = (value: Numeric): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
};

const roundMoney = (value: number) => Math.max(0, Math.round(value));

export const roundToNearestThousand = (value: Numeric) => {
  const num = toNumber(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num / 1000) * 1000;
};

export function findMaxSupplyPrice(productPriceId: string | number, supplyPrices: SupplyPriceRow[]): number {
  const targetId = String(productPriceId);

  return supplyPrices.reduce((currentMax, row) => {
    if (String(row.product_id) !== targetId) return currentMax;
    const price = toNumber(row.price);
    return price > currentMax ? price : currentMax;
  }, 0);
}

export function computeSalePrice({
  pctCtv,
  pctKhach,
  priceMax,
}: {
  pctCtv: Numeric;
  pctKhach: Numeric;
  priceMax: Numeric;
}): number {
  const sale = toNumber(pctCtv) * toNumber(priceMax) * toNumber(pctKhach);
  return roundToNearestThousand(sale);
}

export function computePromoPrice({ salePrice, pctPromo }: { salePrice: Numeric; pctPromo: Numeric }): number {
  const promo = toNumber(salePrice) * (1 - toNumber(pctPromo));
  return roundToNearestThousand(promo);
}

export function computePricing({
  productPriceId,
  pct_ctv,
  pct_khach,
  pct_promo,
  supplyPrices = [],
  priceMaxOverride,
}: {
  productPriceId: string | number;
  pct_ctv: Numeric;
  pct_khach: Numeric;
  pct_promo: Numeric;
  supplyPrices?: SupplyPriceRow[];
  priceMaxOverride?: Numeric;
}) {
  const priceMax =
    priceMaxOverride !== undefined && priceMaxOverride !== null
      ? toNumber(priceMaxOverride)
      : findMaxSupplyPrice(productPriceId, supplyPrices);

  // Formula: sale = pct_ctv * priceMax * pct_khach; promo = sale * (1 - pct_promo)
  const salePrice = computeSalePrice({ pctCtv: pct_ctv, pctKhach: pct_khach, priceMax });
  const promoPrice = computePromoPrice({ salePrice, pctPromo: pct_promo });

  return { priceMax, salePrice, promoPrice };
}

export const formatCurrency = (value: number, suffix = " VND") =>
  `${value.toLocaleString("vi-VN")} ${suffix}`.trim();
