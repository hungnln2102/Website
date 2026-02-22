import express from "express";
import * as variantController from "../controllers/variant.controller";

const router = express.Router();

router.get("/:id/detail", variantController.getVariantDetail);
router.get("/by-name/:displayName/detail", variantController.getVariantByName);
router.get("/product/:baseName", variantController.getVariantsByBaseName);
router.get("/product-info/:baseName", variantController.getProductInfo);

export default router;
