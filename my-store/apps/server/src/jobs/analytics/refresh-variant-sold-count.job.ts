import cron from "node-cron";
import prisma from "@my-store/db";
import logger from "../../shared/utils/logger";

/**
 * Refresh variant + product sold count (MV).
 * Gọi từ `registerCrons` — chỉ leader cluster mới đăng ký.
 */
export function registerRefreshVariantSoldCountCron() {
  const task = cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("🔄 Refreshing variant sold count...");
      await prisma.$executeRaw`SELECT product.refresh_variant_sold_count()`;
      console.log("✅ Variant sold count refreshed");
    } catch (error) {
      logger.error("Failed to refresh variant sold count", { error });
    }
  });
  console.log("✅ Variant sold count cron scheduled (every 10 minutes)");
  return task;
}
