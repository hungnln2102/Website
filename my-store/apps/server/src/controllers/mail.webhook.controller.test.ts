/**
 * Unit tests – mail webhook controller (nhận mail về support@mavrykpremium.store)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mailWebhook } from "./mail.webhook.controller";

const SUPPORT_EMAIL = "support@mavrykpremium.store";

function createMockRequest(body: Buffer, headers: Record<string, string> = {}) {
  return {
    body,
    headers: { "content-type": "application/json", ...headers },
  } as any;
}

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  res.send = vi.fn().mockReturnThis();
  return res;
}

describe("mail.webhook.controller", () => {
  const originalSecret = process.env.SIGNING_SECRET;
  beforeEach(() => {
    vi.resetModules();
    process.env.SIGNING_SECRET = "";
  });
  afterEach(() => {
    process.env.SIGNING_SECRET = originalSecret;
  });

  describe("mailWebhook – email.received về support@mavrykpremium.store", () => {
    it("trả 200 và trả lại event khi type = email.received gửi tới support", async () => {
      const payload = {
        type: "email.received",
        created_at: new Date().toISOString(),
        data: {
          email_id: "test-uuid-support",
          from: "Khách <customer@example.com>",
          to: [SUPPORT_EMAIL],
          subject: "Test support",
          message_id: "<msg@example.com>",
        },
      };
      const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
      const req = createMockRequest(rawBody);
      const res = createMockResponse();

      await mailWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "email.received",
          data: expect.objectContaining({
            to: [SUPPORT_EMAIL],
            subject: "Test support",
          }),
        })
      );
    });

    it("trả 400 khi body không phải Buffer", async () => {
      const req = createMockRequest(undefined as any);
      const res = createMockResponse();

      await mailWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid body" });
    });

    it("trả 400 khi body không phải JSON hợp lệ", async () => {
      const req = createMockRequest(Buffer.from("not json", "utf8"));
      const res = createMockResponse();

      await mailWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid JSON" });
    });

    it("trả 200 với {} khi type khác email.received", async () => {
      const payload = { type: "email.sent", created_at: new Date().toISOString(), data: {} };
      const req = createMockRequest(Buffer.from(JSON.stringify(payload), "utf8"));
      const res = createMockResponse();

      await mailWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({});
    });
  });
});
