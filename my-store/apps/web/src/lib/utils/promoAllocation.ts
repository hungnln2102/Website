/**
 * Phân bổ tổng discount (D) theo giá từng sản phẩm (P1, P2, ..., Pn)
 * sao cho D1 + D2 + ... + Dn = D chính xác, không lệch 1 đồng do làm tròn.
 *
 * Công thức:
 * - Bước 1: Với i từ 1 -> n-1: Di = round(D * Pi / S), với S = P1 + P2 + ... + Pn
 * - Bước 2: Dn = D - (D1 + D2 + ... + D(n-1))
 */

/**
 * Phân bổ tổng discount cho từng item theo tỷ lệ giá.
 * @param prices - Mảng giá từng item (P1, P2, ..., Pn). Có thể là giá đơn vị; nếu item có quantity thì truyền price * quantity.
 * @param totalDiscount - Tổng discount cần phân bổ (D)
 * @returns Mảng discount cho từng item (D1, D2, ..., Dn), tổng luôn bằng totalDiscount
 */
export function allocatePromoDiscount(prices: number[], totalDiscount: number): number[] {
  const n = prices.length;
  if (n === 0) return [];
  if (totalDiscount <= 0) return prices.map(() => 0);

  const S = prices.reduce((sum, p) => sum + p, 0);
  if (S <= 0) return prices.map(() => 0);

  const result: number[] = [];
  let sumSoFar = 0;

  for (let i = 0; i < n - 1; i++) {
    const Di = Math.round((totalDiscount * prices[i]) / S);
    result.push(Di);
    sumSoFar += Di;
  }

  result.push(Math.max(0, totalDiscount - sumSoFar));
  return result;
}

/**
 * Nhận danh sách item có price và quantity, trả về discount phân bổ cho từng item.
 * @param items - Mảng { price: giá đơn vị, quantity: số lượng }
 * @param totalDiscount - Tổng discount (D)
 * @returns Mảng discount cho từng item (theo thứ tự), tổng = totalDiscount
 */
export function allocatePromoByItems(
  items: Array<{ price: number; quantity?: number }>,
  totalDiscount: number
): number[] {
  const lineTotals = items.map((item) => (item.price || 0) * Math.max(1, item.quantity ?? 1));
  return allocatePromoDiscount(lineTotals, totalDiscount);
}
