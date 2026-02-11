/**
 * Protected user routes – register handlers from user.controller.
 */
import { Router } from "express";
import { requireAuth, alwaysRequireCaptcha } from "../middleware/apiSecurity";
import { veryStrictLimiter } from "../middleware/rateLimiter";
import * as userController from "../controllers/user.controller";

const router = Router();
router.use(requireAuth);

router.get("/profile", userController.getProfile);
router.get("/orders", userController.getOrders);
router.put("/profile", userController.updateProfile);
router.put("/password", veryStrictLimiter, alwaysRequireCaptcha, userController.changePassword);
router.put("/email", veryStrictLimiter, alwaysRequireCaptcha, userController.changeEmail);
router.get("/sessions", userController.getSessions);
router.delete("/sessions/:sessionId", userController.revokeSession);
router.get("/activity", userController.getActivity);

export default router;
