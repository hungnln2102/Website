import express from "express";
import * as productSoldCountController from "../controllers/product-sold-count.controller";

const router = express.Router();

router.get("/with-sold-count", productSoldCountController.getProductsWithSoldCount);
router.get("/:id/sold-count", productSoldCountController.getProductSoldCount);
router.get("/top-selling", productSoldCountController.getTopSelling);
router.get("/sold-count-stats", productSoldCountController.getStats);
router.post("/refresh-sold-count", productSoldCountController.refreshSoldCount);

export default router;
