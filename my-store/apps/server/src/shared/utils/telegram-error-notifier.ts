import os from "node:os";

type NotifyLevel = "critical" | "error" | "warn";

interface NotifyPayload {
  level?: NotifyLevel;
  message: string;
  source?: "backend" | "frontend";
  url?: string;
  method?: string;
  stack?: string;
  extra?: string;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const ERROR_TOPIC_ID = Number.parseInt(process.env.ERROR_TOPIC_ID || "6", 10);
const ENABLED =
  String(process.env.SEND_ERROR_NOTIFICATION || "true").toLowerCase() !== "false";

const RATE_LIMIT_MS = 2_000;
const MAX_QUEUE = 30;
const queue: string[] = [];
let sending = false;
let lastSentAt = 0;

const LEVEL_META: Record<NotifyLevel, { icon: string; label: string }> = {
  critical: { icon: "🔴", label: "CRITICAL" },
  error: { icon: "🚨", label: "Error" },
  warn: { icon: "⚠️", label: "Warning" },
};

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(str: string, max: number): string {
  const text = String(str || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function buildMessage(payload: Required<Pick<NotifyPayload, "message">> & NotifyPayload): string {
  const level = payload.level ?? "error";
  const meta = LEVEL_META[level] || LEVEL_META.error;
  const srcLabel = payload.source === "frontend" ? "Frontend" : "Backend";
  const timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const hostname = os.hostname();

  const lines = [
    `${meta.icon} <b>${srcLabel} ${meta.label}</b>`,
    `⏰ ${timestamp}  🖥 ${hostname}`,
  ];

  if (payload.url) {
    lines.push(`📍 ${payload.method ? `${payload.method} ` : ""}${escapeHtml(payload.url)}`);
  }
  lines.push(`💬 <code>${escapeHtml(truncate(payload.message, 300))}</code>`);
  if (payload.stack) {
    lines.push(`📋 <pre>${escapeHtml(truncate(payload.stack, 500))}</pre>`);
  }
  if (payload.extra) {
    lines.push(`📎 ${escapeHtml(truncate(payload.extra, 250))}`);
  }
  return lines.join("\n");
}

async function postToTelegram(text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: CHAT_ID,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(Number.isFinite(ERROR_TOPIC_ID) ? { message_thread_id: ERROR_TOPIC_ID } : {}),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram send failed: ${res.status} ${detail}`);
  }
}

async function processQueue(): Promise<void> {
  if (sending || queue.length === 0) return;
  sending = true;
  while (queue.length > 0) {
    const now = Date.now();
    const wait = RATE_LIMIT_MS - (now - lastSentAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    const text = queue.shift();
    if (!text) continue;
    try {
      await postToTelegram(text);
      lastSentAt = Date.now();
    } catch (err) {
      console.error("[TelegramErrorNotifier] send failed:", (err as Error)?.message ?? err);
    }
  }
  sending = false;
}

function notify(payload: NotifyPayload): void {
  if (!ENABLED || !BOT_TOKEN || !CHAT_ID || !payload.message) return;
  const text = buildMessage(payload);
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push(text);
  void processQueue();
}

export function notifyWarn(payload: Omit<NotifyPayload, "level">): void {
  notify({ ...payload, level: "warn" });
}

export function notifyError(payload: Omit<NotifyPayload, "level">): void {
  notify({ ...payload, level: "error" });
}

export function notifyCritical(payload: Omit<NotifyPayload, "level">): void {
  notify({ ...payload, level: "critical" });
}

