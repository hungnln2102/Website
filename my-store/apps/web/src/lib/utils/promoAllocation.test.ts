import { allocatePromoDiscount, allocatePromoByItems } from "./promoAllocation";

describe("allocatePromoDiscount", () => {
  it("tổng phân bổ luôn bằng totalDiscount", () => {
    const prices = [100000, 200000, 300000];
    const D = 50000;
    const result = allocatePromoDiscount(prices, D);
    expect(result.reduce((a, b) => a + b, 0)).toBe(D);
  });

  it("không lệch 1 đồng với nhiều item", () => {
    const prices = [11111, 22222, 33333, 44444, 55555];
    const D = 100000;
    const result = allocatePromoDiscount(prices, D);
    expect(result.reduce((a, b) => a + b, 0)).toBe(D);
  });

  it("trả về mảng rỗng khi không có sản phẩm", () => {
    expect(allocatePromoDiscount([], 100)).toEqual([]);
  });

  it("trả về toàn 0 khi totalDiscount <= 0", () => {
    expect(allocatePromoDiscount([100, 200], 0)).toEqual([0, 0]);
    expect(allocatePromoDiscount([100, 200], -10)).toEqual([0, 0]);
  });

  it("một sản phẩm nhận toàn bộ discount", () => {
    expect(allocatePromoDiscount([100], 30)).toEqual([30]);
  });
});

describe("allocatePromoByItems", () => {
  it("tính theo price * quantity và tổng allocation = totalDiscount", () => {
    const items = [
      { price: 100000, quantity: 2 },
      { price: 50000, quantity: 1 },
    ];
    const D = 25000;
    const result = allocatePromoByItems(items, D);
    expect(result).toHaveLength(2);
    expect(result[0] + result[1]).toBe(D);
  });
});
