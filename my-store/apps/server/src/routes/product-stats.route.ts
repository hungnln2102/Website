import express from "express";
import * as productStatsController from "../controllers/product-stats.controller";

const router = express.Router();

router.get("/:id/sold-count", productStatsController.getSoldCount);
router.get("/top-selling", productStatsController.getTopSelling);
router.post("/:id/invalidate-cache", productStatsController.invalidateProductCache);
router.post("/warm-cache", productStatsController.warmCache);
router.get("/cache-stats", productStatsController.getCacheStats);

export default router;
