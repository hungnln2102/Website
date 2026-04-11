import { runAsCronLeaderIfEligible } from "./cron-leader";

/**
 * Đăng ký toàn bộ cron sau khi `initRedis()` xong (để leader lock dùng Redis nếu có).
 */
export async function registerAllCrons(): Promise<void> {
  if (String(process.env.DISABLE_CRON ?? "").toLowerCase() === "true") {
    console.log("[Jobs] DISABLE_CRON=true — không đăng ký cron.");
    return;
  }

  await runAsCronLeaderIfEligible(async () => {
    const [variantJob, sold30Job, tierJob] = await Promise.all([
      import("./analytics/refresh-variant-sold-count.job"),
      import("./analytics/refresh-product-sold-30d.job"),
      import("./user/reset-customer-tier-cycle.job"),
    ]);
    variantJob.registerRefreshVariantSoldCountCron();
    sold30Job.registerRefreshProductSold30dCron();
    tierJob.registerTierCycleResetCron();
    console.log("[Jobs] Cron jobs đã đăng ký (leader).");
  });
}
