/**
 * Mail webhook route – POST /api/mail/webhook (raw body)
 * + Quản lý webhook Resend: /api/mail/webhooks/* (JSON, cần auth)
 */

import express from "express";
import { authenticate } from "../middleware/auth";
import * as mailWebhookController from "../controllers/mail.webhook.controller";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => mailWebhookController.mailWebhook(req, res)
);

router.post(
  "/webhooks/register",
  express.json(),
  authenticate,
  (req, res) => mailWebhookController.registerWebhook(req, res)
);
router.get("/webhooks", authenticate, (req, res) => mailWebhookController.listWebhooks(req, res));
router.get("/webhooks/:id", authenticate, (req, res) => mailWebhookController.getWebhook(req, res));
router.patch(
  "/webhooks/:id",
  express.json(),
  authenticate,
  (req, res) => mailWebhookController.updateWebhook(req, res)
);
router.delete("/webhooks/:id", authenticate, (req, res) => mailWebhookController.removeWebhook(req, res));

export default router;
