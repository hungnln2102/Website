/**
 * Mail webhook controller – nhận event từ provider (Resend/SendGrid, etc.)
 * Xác minh chữ ký bằng thư viện Svix (Resend dùng Svix).
 */

import type { Request, Response } from "express";
import { Webhook } from "svix";
import * as resendService from "../services/resend.service";

const SIGNING_SECRET = () => process.env.SIGNING_SECRET;

/** Payload event từ webhook (Resend: type = "email.received", etc.) */
export interface MailWebhookEvent {
  type?: string;
  created_at?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * POST /api/mail/webhook
 * Body: raw JSON (bắt buộc raw để verify chữ ký).
 * req.body được set thành Buffer bởi express.raw() trên route.
 */
export async function mailWebhook(req: Request, res: Response): Promise<void> {
  try {
    const rawBody = req.body;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const payload = rawBody.toString("utf8");

    if (SIGNING_SECRET()) {
      const headers: Record<string, string> = {
        "svix-id": (req.headers["svix-id"] as string) || "",
        "svix-timestamp": (req.headers["svix-timestamp"] as string) || "",
        "svix-signature": (req.headers["svix-signature"] as string) || "",
      };
      if (!headers["svix-id"] || !headers["svix-timestamp"] || !headers["svix-signature"]) {
        res.status(401).json({ error: "Missing webhook headers" });
        return;
      }
      try {
        const wh = new Webhook(SIGNING_SECRET()!);
        wh.verify(payload, headers);
        // Verify thành công (không throw) – payload đã được xác minh
      } catch (err) {
        console.error("Mail webhook signature verification failed:", err);
        res.status(400).json({ error: "Invalid webhook" });
        return;
      }
    }

    let event: MailWebhookEvent;
    try {
      event = JSON.parse(payload) as MailWebhookEvent;
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    if (event.type === "email.received") {
      res.status(200).json(event);
      return;
    }

    res.status(200).json({});
  } catch (err) {
    console.error("Mail webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/** POST /api/mail/webhooks/register – tạo webhook, trả về signing_secret (ghi vào SIGNING_SECRET) */
export async function registerWebhook(req: Request, res: Response): Promise<void> {
  try {
    const events = req.body?.events as string[] | undefined;
    const data = await resendService.createWebhook(events as resendService.ResendWebhookEvent[] | undefined);
    res.status(201).json({
      message: "Webhook đã tạo. Ghi signing_secret vào .env làm SIGNING_SECRET.",
      id: data?.id,
      signing_secret: data?.signing_secret,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi tạo webhook";
    res.status(400).json({ error: message });
  }
}

/** GET /api/mail/webhooks */
export async function listWebhooks(_req: Request, res: Response): Promise<void> {
  try {
    const data = await resendService.listWebhooks();
    res.json({ data: data?.data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi lấy danh sách webhook";
    res.status(400).json({ error: message });
  }
}

/** GET /api/mail/webhooks/:id */
export async function getWebhook(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Thiếu id" });
      return;
    }
    const data = await resendService.getWebhook(id);
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi lấy webhook";
    res.status(400).json({ error: message });
  }
}

/** PATCH /api/mail/webhooks/:id */
export async function updateWebhook(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Thiếu id" });
      return;
    }
    const { endpoint, events, status } = req.body || {};
    const data = await resendService.updateWebhook(id, {
      ...(endpoint && { endpoint }),
      ...(events && { events }),
      ...(status && { status }),
    });
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi cập nhật webhook";
    res.status(400).json({ error: message });
  }
}

/** DELETE /api/mail/webhooks/:id */
export async function removeWebhook(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Thiếu id" });
      return;
    }
    await resendService.removeWebhook(id);
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi xóa webhook";
    res.status(400).json({ error: message });
  }
}
