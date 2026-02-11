import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import * as cartController from "../controllers/cart.controller";

const router = Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

router.get("/", authenticate, (req: Request, res: Response) =>
  cartController.getCart(req, res)
);

router.post(
  "/add",
  authenticate,
  [
    body("variantId").notEmpty().withMessage("Variant ID is required"),
    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("extraInfo")
      .optional()
      .isObject()
      .withMessage("Extra info must be an object"),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => cartController.addItem(req, res)
);

router.put(
  "/:variantId",
  authenticate,
  [
    param("variantId").notEmpty().withMessage("Variant ID is required"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be 0 or greater"),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => cartController.updateItem(req, res)
);

router.delete(
  "/:variantId",
  authenticate,
  [
    param("variantId").notEmpty().withMessage("Variant ID is required"),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => cartController.removeItem(req, res)
);

router.delete("/", authenticate, (req: Request, res: Response) =>
  cartController.clearCart(req, res)
);

router.post(
  "/sync",
  authenticate,
  [
    body("items").isArray().withMessage("Items must be an array"),
    body("items.*.variantId").notEmpty().withMessage("Variant ID is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    handleValidationErrors,
  ],
  (req: Request, res: Response) => cartController.syncCart(req, res)
);

router.get("/count", authenticate, (req: Request, res: Response) =>
  cartController.getCount(req, res)
);

export default router;
