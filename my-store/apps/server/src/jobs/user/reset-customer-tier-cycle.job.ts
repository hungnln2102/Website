import type { PoolClient } from "pg";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const TYPE_HISTORY_TABLE = `${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.SCHEMA}.${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.TABLE}`;
const CH = DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.COLS as Record<string, string>;

const TIER_CYCLES_TABLE = `${DB_SCHEMA.TIER_CYCLES!.SCHEMA}.${DB_SCHEMA.TIER_CYCLES!.TABLE}`;
const TC = DB_SCHEMA.TIER_CYCLES!.COLS as {
  ID: string;
  CYCLE_START_AT: string;
  CYCLE_END_AT: string;
  STATUS: string;
};

const PUBLIC_TIER_CYCLES = `public.${DB_SCHEMA.TIER_CYCLES!.TABLE}`;

type TierCycleRow = { id: number; cycle_start_at: Date; cycle_end_at: Date; status: string };

async function getTableToUse(): Promise<string> {
  try {
    await pool.query(`SELECT 1 FROM ${TIER_CYCLES_TABLE} LIMIT 1`);
    return TIER_CYCLES_TABLE;
  } catch {
    try {
      await pool.query(`SELECT 1 FROM ${PUBLIC_TIER_CYCLES} LIMIT 1`);
      return PUBLIC_TIER_CYCLES;
    } catch {
      return TIER_CYCLES_TABLE;
    }
  }
}

/** Tính số tháng giữa hai timestamp (làm tròn). */
function monthsBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  const months = ms / (30.44 * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.round(months));
}

/** Cộng số tháng vào một Date (giữ ngày giờ, cộng tháng). */
function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
}

/**
 * Lấy chu kỳ OPEN có id thấp nhất (chu kỳ hiện tại — thời điểm chạy reset = cycle_end_at của nó).
 */
async function getCurrentOpenCycle(table: string): Promise<{ cycleEndAt: Date } | null> {
  const r = await pool.query(
    `SELECT ${TC.CYCLE_END_AT}
     FROM ${table}
     WHERE ${TC.STATUS} = 'OPEN'
     ORDER BY ${TC.ID} ASC
     LIMIT 1`
  );
  if (r.rows.length === 0) return null;
  return { cycleEndAt: new Date(r.rows[0][TC.CYCLE_END_AT]) };
}

/**
 * Lấy chu kỳ cần đóng: status = OPEN và cycle_end_at <= NOW(), id thấp nhất trước.
 */
async function getCycleToClose(table: string): Promise<TierCycleRow | null> {
  const r = await pool.query(
    `SELECT ${TC.ID}, ${TC.CYCLE_START_AT}, ${TC.CYCLE_END_AT}, ${TC.STATUS}
     FROM ${table}
     WHERE ${TC.STATUS} = 'OPEN' AND ${TC.CYCLE_END_AT} <= NOW()
     ORDER BY ${TC.ID} ASC
     LIMIT 1`
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: Number(row[TC.ID]),
    cycle_start_at: new Date(row[TC.CYCLE_START_AT]),
    cycle_end_at: new Date(row[TC.CYCLE_END_AT]),
    status: String(row[TC.STATUS]),
  };
}

/**
 * Đóng chu kỳ (status = CLOSE).
 */
async function closeCycle(client: PoolClient, table: string, id: number): Promise<void> {
  await client.query(
    `UPDATE ${table} SET ${TC.STATUS} = 'CLOSE' WHERE ${TC.ID} = $1`,
    [id]
  );
}

/**
 * Lấy chu kỳ tiếp theo theo id (id > currentId, id nhỏ nhất).
 */
async function getNextCycle(client: PoolClient, table: string, afterId: number): Promise<TierCycleRow | null> {
  const r = await client.query(
    `SELECT ${TC.ID}, ${TC.CYCLE_START_AT}, ${TC.CYCLE_END_AT}, ${TC.STATUS}
     FROM ${table}
     WHERE ${TC.ID} > $1
     ORDER BY ${TC.ID} ASC
     LIMIT 1`,
    [afterId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: Number(row[TC.ID]),
    cycle_start_at: new Date(row[TC.CYCLE_START_AT]),
    cycle_end_at: new Date(row[TC.CYCLE_END_AT]),
    status: String(row[TC.STATUS]),
  };
}

/**
 * Tạo chu kỳ mới: cycle_start_at = cycle_end_at của chu kỳ vừa đóng,
 * cycle_end_at = cycle_start_at + (số tháng = cycle_end_at - cycle_start_at của chu kỳ cũ).
 */
async function createNextCycle(
  client: PoolClient,
  table: string,
  previousCycle: TierCycleRow
): Promise<{ periodStart: Date; periodEnd: Date }> {
  const periodStart = new Date(previousCycle.cycle_end_at);
  const months = monthsBetween(previousCycle.cycle_start_at, previousCycle.cycle_end_at);
  const periodEnd = addMonths(periodStart, months);

  await client.query(
    `INSERT INTO ${table} (${TC.CYCLE_START_AT}, ${TC.CYCLE_END_AT}, ${TC.STATUS})
     VALUES ($1, $2, 'OPEN')`,
    [periodStart, periodEnd]
  );

  return { periodStart, periodEnd };
}

/**
 * Reset customer_type_history: cập nhật period_start, period_end và reset total_spend cho chu kỳ mới.
 */
async function resetCustomerTypeHistory(client: PoolClient, periodStart: Date, periodEnd: Date): Promise<number> {
  const result = await client.query(
    `UPDATE ${TYPE_HISTORY_TABLE} cth
     SET
       ${CH.PERIOD_START}  = $1,
       ${CH.PERIOD_END}    = $2,
       ${CH.TOTAL_SPEND}   = 0,
       ${CH.PREVIOUS_TYPE} = ${CH.NEW_TYPE},
       ${CH.EVALUATED_AT}  = NOW()
     FROM ${ACCOUNT_TABLE} a
     WHERE cth.${CH.ACCOUNT_ID} = a.id
       AND a.is_active = true`,
    [periodStart, periodEnd]
  );
  return result.rowCount ?? 0;
}

async function runTierCycleReset(): Promise<void> {
  const table = await getTableToUse();
  const client = await pool.connect();
  try {
    const toClose = await getCycleToClose(table);
    if (!toClose) return;

    await client.query("BEGIN");

    await closeCycle(client, table, toClose.id);

    let periodStart: Date;
    let periodEnd: Date;

    const next = await getNextCycle(client, table, toClose.id);
    if (next) {
      periodStart = next.cycle_start_at;
      periodEnd = next.cycle_end_at;
    } else {
      const created = await createNextCycle(client, table, toClose);
      periodStart = created.periodStart;
      periodEnd = created.periodEnd;
    }

    const rowCount = await resetCustomerTypeHistory(client, periodStart, periodEnd);

    await client.query("COMMIT");
    console.log(
      `✅ [TierCycleReset] Đã đóng chu kỳ id=${toClose.id} (${toClose.cycle_start_at.toISOString().slice(0, 10)} → ${toClose.cycle_end_at.toISOString().slice(0, 10)})`,
      `| Reset ${rowCount} tài khoản | Chu kỳ mới: ${periodStart.toISOString().slice(0, 10)} → ${periodEnd.toISOString().slice(0, 10)}`
    );
    scheduleNextRun();
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [TierCycleReset] Lỗi:", err);
    scheduleNextRun();
  } finally {
    client.release();
  }
}

let nextRunTimer: ReturnType<typeof setTimeout> | null = null;

/** Giới hạn delay cho setTimeout (Node.js dùng 32-bit signed, max ~24.8 ngày) */
const MAX_SETTIMEOUT_MS = 2 ** 31 - 1;

/**
 * Lên lịch chạy reset đúng thời điểm cột cycle_end_at của chu kỳ OPEN (id thấp nhất).
 * Nếu cycle_end_at đã qua → chạy ngay rồi lên lịch lần tiếp theo.
 */
async function scheduleNextRun(): Promise<void> {
  if (nextRunTimer != null) {
    clearTimeout(nextRunTimer);
    nextRunTimer = null;
  }
  try {
    const table = await getTableToUse();
    const current = await getCurrentOpenCycle(table);
    if (!current) {
      console.log("[TierCycleReset] Không có chu kỳ OPEN, bỏ qua lên lịch.");
      return;
    }
    const runAt = current.cycleEndAt.getTime();
    const now = Date.now();
    let delayMs = Math.max(0, runAt - now);
    if (delayMs > MAX_SETTIMEOUT_MS) {
      console.log(`[TierCycleReset] delay ${Math.round(delayMs / 1000 / 60 / 60 / 24)} ngày > max, giới hạn còn ${Math.round(MAX_SETTIMEOUT_MS / 1000 / 60 / 60 / 24)} ngày`);
      delayMs = MAX_SETTIMEOUT_MS;
    }
    if (delayMs === 0) {
      console.log(`[TierCycleReset] cycle_end_at đã đến, chạy ngay.`);
      runTierCycleReset();
      return;
    }
    nextRunTimer = setTimeout(() => {
      nextRunTimer = null;
      runTierCycleReset();
    }, delayMs);
    console.log(
      `✅ [TierCycleReset] Đã lên lịch chạy lúc ${current.cycleEndAt.toISOString()} (sau ${Math.round(delayMs / 1000 / 60)} phút)`
    );
  } catch (err) {
    console.error("[TierCycleReset] Lỗi khi lên lịch:", err);
  }
}

/**
 * Job chạy đúng thời điểm cycle_end_at của chu kỳ OPEN (id thấp nhất).
 * Sau mỗi lần chạy, lên lịch lần tiếp theo theo cycle_end_at của chu kỳ OPEN mới.
 */
scheduleNextRun();

console.log("✅ [TierCycleReset] Đã đăng ký: thời gian chạy = cycle_end_at của chu kỳ OPEN (id nhỏ nhất).");
