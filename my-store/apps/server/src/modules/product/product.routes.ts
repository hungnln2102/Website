import express from "express";
import { strictLimiter } from "../../shared/middleware/rate-limiter";
import * as productController from "./product.controller";
import * as seoController from "./seo.controller";

const router = express.Router();

router.get("/products", productController.getProducts);
router.get("/promotions", productController.getPromotions);
router.get("/categories", productController.getCategories);
router.get("/product-packages/:package", strictLimiter, productController.getProductPackagesHandler);
router.get("/product-packages", strictLimiter, productController.getProductPackagesHandler);
router.post("/api/seo/product-audit", seoController.auditProductSeoHandler);
router.post("/cache/invalidate", productController.invalidateCache);

export default router;
