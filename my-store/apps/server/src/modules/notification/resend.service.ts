/**
 * Resend service – quản lý webhook qua Resend API (create, list, get, update, remove).
 * Dùng SEND_MAIL_API_KEY và MAIL_WEBHOOK_URL từ env.
 */

import { Resend } from "resend";

const API_KEY = process.env.SEND_MAIL_API_KEY;
const WEBHOOK_URL = process.env.MAIL_WEBHOOK_URL;

const resend = API_KEY ? new Resend(API_KEY) : null;

export type ResendWebhookEvent =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked"
  | "email.received";

const DEFAULT_EVENTS: ResendWebhookEvent[] = [
  "email.sent",
  "email.delivered",
  "email.bounced",
  "email.received",
];

export function isResendConfigured(): boolean {
  return Boolean(API_KEY);
}

/**
 * Tạo webhook mới – endpoint = MAIL_WEBHOOK_URL, events mặc định hoặc truyền vào.
 * Trả về { id, signing_secret } – cần ghi signing_secret vào SIGNING_SECRET trong .env.
 */
export async function createWebhook(events?: ResendWebhookEvent[]) {
  if (!resend) throw new Error("SEND_MAIL_API_KEY chưa cấu hình");
  if (!WEBHOOK_URL) throw new Error("MAIL_WEBHOOK_URL chưa cấu hình");
  const { data, error } = await resend.webhooks.create({
    endpoint: WEBHOOK_URL,
    events: events ?? DEFAULT_EVENTS,
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Danh sách webhook
 */
export async function listWebhooks() {
  if (!resend) throw new Error("SEND_MAIL_API_KEY chưa cấu hình");
  const { data, error } = await resend.webhooks.list();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Chi tiết một webhook
 */
export async function getWebhook(id: string) {
  if (!resend) throw new Error("SEND_MAIL_API_KEY chưa cấu hình");
  const { data, error } = await resend.webhooks.get(id);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Cập nhật webhook (endpoint, events, status)
 */
export async function updateWebhook(
  id: string,
  options: { endpoint?: string; events?: ResendWebhookEvent[]; status?: "enabled" | "disabled" }
) {
  if (!resend) throw new Error("SEND_MAIL_API_KEY chưa cấu hình");
  const { data, error } = await resend.webhooks.update(id, options);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Xóa webhook
 */
export async function removeWebhook(id: string) {
  if (!resend) throw new Error("SEND_MAIL_API_KEY chưa cấu hình");
  const { data, error } = await resend.webhooks.remove(id);
  if (error) throw new Error(error.message);
  return data;
}

export const resendService = {
  isResendConfigured,
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  removeWebhook,
};
