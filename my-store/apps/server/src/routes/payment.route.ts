import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validationRules, handleValidationErrors } from "../utils/validation";
import * as paymentController from "../controllers/payment.controller";

const router = express.Router();

router.post(
  "/create",
  optionalAuth,
  [
    validationRules.amount(),
    validationRules.orderId(),
    validationRules.optionalString("description", 255),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => paymentController.createPayment(req, res)
);

router.post(
  "/balance/confirm",
  authenticate,
  [
    validationRules.orderId(),
    validationRules.amount(),
    body("items")
      .isArray({ min: 1 })
      .withMessage("items must be a non-empty array"),
    body("items.*.id_product")
      .trim()
      .notEmpty()
      .withMessage("Each item must have id_product"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Each item quantity must be at least 1"),
    body("items.*.price")
      .isNumeric()
      .custom((v) => Number(v) >= 0)
      .withMessage("Each item must have a valid price"),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => paymentController.confirmBalance(req, res)
);

router.get(
  "/status/:orderId",
  authenticate,
  (req: Request, res: Response) => paymentController.getPaymentStatus(req, res)
);

router.get("/success", (req: Request, res: Response) =>
  paymentController.successCallback(req, res)
);
router.get("/error", (req: Request, res: Response) =>
  paymentController.errorCallback(req, res)
);
router.get("/cancel", (req: Request, res: Response) =>
  paymentController.cancelCallback(req, res)
);

router.post("/webhook", (req: Request, res: Response) =>
  paymentController.webhook(req, res)
);

router.get("/health", (req: Request, res: Response) =>
  paymentController.health(req, res)
);

export default router;
