/**
 * Cấu hình chu kỳ tier khách hàng
 *
 * Mỗi chu kỳ định nghĩa bằng ngày bắt đầu (start) và ngày kết thúc (end).
 * Thêm/bớt/sửa chu kỳ ở đây — job và controller sẽ tự động cập nhật theo.
 *
 * Ví dụ đổi sang 4 quý/năm: thêm 4 mục với start/end tương ứng.
 */
export interface TierCycle {
  /** Tên chu kỳ để dễ đọc trong log */
  name: string;
  /** Tháng bắt đầu (1-12) */
  startMonth: number;
  /** Ngày bắt đầu trong tháng */
  startDay: number;
  /** Tháng kết thúc (1-12) */
  endMonth: number;
  /** Ngày kết thúc trong tháng */
  endDay: number;
}

export const TIER_CYCLES: TierCycle[] = [
  { name: "Chu kỳ 1", startMonth: 1,  startDay: 1,  endMonth: 6,  endDay: 30 },
  { name: "Chu kỳ 2", startMonth: 7,  startDay: 1,  endMonth: 12, endDay: 31 },
];

/**
 * Timezone của cron job và tính toán ngày
 */
export const TIER_CYCLE_TIMEZONE = "Asia/Ho_Chi_Minh";

// ─── Helper functions ──────────────────────────────────────────────────────────

/**
 * Lấy chu kỳ hiện tại dựa trên ngày hôm nay.
 * Trả về null nếu ngày hôm nay không nằm trong bất kỳ chu kỳ nào (lỗi config).
 */
export function getCurrentTierCycle(now: Date = new Date()): TierCycle | null {
  const month = now.getMonth() + 1;
  const day   = now.getDate();

  return TIER_CYCLES.find((c) => {
    const afterStart = month > c.startMonth || (month === c.startMonth && day >= c.startDay);
    const beforeEnd  = month < c.endMonth   || (month === c.endMonth   && day <= c.endDay);
    return afterStart && beforeEnd;
  }) ?? null;
}

/**
 * Lấy chu kỳ TIẾP THEO sau chu kỳ hiện tại.
 * Nếu đang ở chu kỳ cuối cùng → quay về chu kỳ đầu tiên (năm sau).
 */
export function getNextTierCycle(now: Date = new Date()): {
  cycle: TierCycle;
  periodStart: Date;
  periodEnd: Date;
} {
  const currentIdx = TIER_CYCLES.findIndex((c) => {
    const month = now.getMonth() + 1;
    const day   = now.getDate();
    const afterStart = month > c.startMonth || (month === c.startMonth && day >= c.startDay);
    const beforeEnd  = month < c.endMonth   || (month === c.endMonth   && day <= c.endDay);
    return afterStart && beforeEnd;
  });

  const nextIdx  = (currentIdx + 1) % TIER_CYCLES.length;
  const nextCycle = TIER_CYCLES[nextIdx]!;
  const isWrapping = nextIdx === 0; // Quay về chu kỳ 1 → sang năm mới
  const year = isWrapping ? now.getFullYear() + 1 : now.getFullYear();

  return {
    cycle:       nextCycle,
    periodStart: new Date(year, nextCycle.startMonth - 1, nextCycle.startDay),
    periodEnd:   new Date(year, nextCycle.endMonth   - 1, nextCycle.endDay),
  };
}

/**
 * Trả về period_start và period_end cho một ngày cụ thể (dùng khi đăng ký).
 * period_start = ngày đăng ký (truyền vào), period_end = cuối chu kỳ hiện tại.
 */
export function getRegistrationCycleBounds(registeredAt: Date = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const cycle = getCurrentTierCycle(registeredAt);
  if (!cycle) {
    // Fallback an toàn: hết năm
    return {
      periodStart: registeredAt,
      periodEnd:   new Date(registeredAt.getFullYear(), 11, 31),
    };
  }
  return {
    periodStart: registeredAt,
    periodEnd:   new Date(
      registeredAt.getFullYear(),
      cycle.endMonth - 1,
      cycle.endDay
    ),
  };
}
