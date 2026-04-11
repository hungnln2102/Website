import cron from "node-cron";
import prisma from "@my-store/db";
import logger from "../../shared/utils/logger";

/**
 * Refresh product_sold_30d MV.
 * Gọi từ `registerCrons` — chỉ leader cluster mới đăng ký.
 */
export function registerRefreshProductSold30dCron() {
  const task = cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("🔄 Refreshing product sold count (30 days)...");
      await prisma.$executeRaw`SELECT product.refresh_product_sold_30d()`;
      console.log("✅ Product sold count (30 days) refreshed");
    } catch (error) {
      logger.error("Failed to refresh product sold count (30 days)", { error });
    }
  });
  console.log("✅ Product sold count (30 days) cron scheduled (every 5 minutes)");
  return task;
}
