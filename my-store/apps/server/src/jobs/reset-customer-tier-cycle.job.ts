import cron from "node-cron";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import {
  TIER_CYCLES,
  TIER_CYCLE_TIMEZONE,
  getNextTierCycle,
} from "../config/tier-cycle.config";

const ACCOUNT_TABLE      = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const TYPE_HISTORY_TABLE = `${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.SCHEMA}.${DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.TABLE}`;
const CH = DB_SCHEMA.CUSTOMER_TYPE_HISTORY!.COLS;

async function resetCustomerTierCycle(cycleName: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { periodStart, periodEnd } = getNextTierCycle();

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

    await client.query("COMMIT");
    console.log(
      `✅ [TierCycleReset] ${cycleName} — Đã reset ${result.rowCount} tài khoản`,
      `| Chu kỳ mới: ${periodStart.toISOString().slice(0, 10)} → ${periodEnd.toISOString().slice(0, 10)}`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`❌ [TierCycleReset] ${cycleName} — Lỗi khi reset:`, err);
  } finally {
    client.release();
  }
}

/**
 * Đăng ký cron job tự động dựa trên TIER_CYCLES config.
 * Mỗi chu kỳ sẽ có 1 job chạy lúc 23:59 vào ngày cuối cùng của chu kỳ đó.
 */
for (const cycle of TIER_CYCLES) {
  // Cron: phút giờ ngày tháng thứ
  // Chạy lúc 23:59 vào ngày endDay của tháng endMonth
  const cronExpr = `59 23 ${cycle.endDay} ${cycle.endMonth} *`;

  cron.schedule(
    cronExpr,
    () => {
      console.log(`🕐 [TierCycleReset] Bắt đầu reset "${cycle.name}" (${cycle.endDay}/${cycle.endMonth})...`);
      resetCustomerTierCycle(cycle.name);
    },
    { timezone: TIER_CYCLE_TIMEZONE }
  );

  console.log(
    `✅ [TierCycleReset] "${cycle.name}" scheduled → cron: "${cronExpr}" (${TIER_CYCLE_TIMEZONE})`
  );
}
