/**
 * Protected user routes – register handlers from user.controller.
 */
import { Router } from "express";
import { requireAuth, alwaysRequireCaptcha } from "../../shared/middleware/api-security";
import { veryStrictLimiter } from "../../shared/middleware/rate-limiter";
import * as userController from "./user.controller";

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
router.get("/transactions", userController.getTransactions);
router.get("/reviews", userController.getReviews);

export default router;
