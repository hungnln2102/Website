import express from "express";
import type { Request, Response } from "express";
import * as orderController from "../controllers/order.controller";

const router = express.Router();

router.post("/notify-done", (req: Request, res: Response) =>
  orderController.notifyDone(req, res)
);

router.post("/cancel", (req: Request, res: Response) =>
  orderController.cancel(req, res)
);

router.get("/suppliers", (req: Request, res: Response) =>
  orderController.getSuppliers(req, res)
);

export default router;
