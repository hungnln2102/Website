import { Router } from "express";
import { authenticate, authorize } from "../../shared/middleware/auth";
import { asyncHandler } from "../../shared/middleware/error-handler";
import * as ctrl from "./maintenance.controller";

const router = Router();

// Public — ai cũng có thể check trạng thái maintenance
router.get("/status", asyncHandler(ctrl.getStatus));

// Admin-only — CRUD whitelist + toggle maintenance
router.use(authenticate, authorize("admin"));

router.put("/toggle", asyncHandler(ctrl.toggleMaintenance));

router.get("/whitelist", asyncHandler(ctrl.getWhitelist));
router.post("/whitelist", asyncHandler(ctrl.addIP));
router.post("/whitelist/me", asyncHandler(ctrl.addMyIP));
router.delete("/whitelist/:id", asyncHandler(ctrl.removeIP));
router.patch("/whitelist/:id", asyncHandler(ctrl.toggleIP));

export default router;
