/**
 * Auth routes – register handlers from auth.controller.
 */
import { Router } from "express";
import { authLimiter, checkUserLimiter } from "../middleware/rateLimiter";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/check-user", checkUserLimiter, authController.checkUser);
router.get("/captcha-required", authController.captchaRequired);
router.get("/csrf-token", authController.getCsrfToken);
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authLimiter, authController.logout);
router.post("/refresh", authLimiter, authController.refresh);
router.get("/sessions", authController.getSessions);
router.delete("/sessions/:sessionId", authController.revokeSession);
router.post("/logout-all", authController.logoutAll);

export default router;
