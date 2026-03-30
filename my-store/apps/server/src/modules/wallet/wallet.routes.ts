import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as topupController from "../controllers/topup.controller";

const router = Router();

router.get("/packages", topupController.getPackages);
router.get("/transfer-code", authenticate, topupController.getTransferCode);
router.post("/test", authenticate, topupController.testTopup);
router.get("/balance", authenticate, topupController.getBalance);
router.get("/history", authenticate, topupController.getHistory);

export default router;
