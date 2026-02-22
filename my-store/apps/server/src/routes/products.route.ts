import express from "express";
import { strictLimiter } from "../middleware/rateLimiter";
import * as productController from "../controllers/product.controller";

const router = express.Router();

router.get("/products", productController.getProducts);
router.get("/promotions", productController.getPromotions);
router.get("/categories", productController.getCategories);
router.get("/product-packages/:package", strictLimiter, productController.getProductPackagesHandler);
router.get("/product-packages", strictLimiter, productController.getProductPackagesHandler);
router.post("/cache/invalidate", productController.invalidateCache);

export default router;
