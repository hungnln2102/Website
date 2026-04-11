import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const cwd = process.cwd();
const envCandidates = [
  path.join(cwd, ".env"),
  path.join(cwd, "apps", "server", ".env"),
  path.join(cwd, "my-store", "apps", "server", ".env"),
];
const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    // CORS_ORIGIN: single URL or comma-separated (e.g. https://a.com,https://www.a.com)
    CORS_ORIGIN: z
      .string()
      .optional()
      .transform((s) => (s ? s.split(",").map((u) => u.trim()).filter(Boolean) : [])),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    IMAGE_BASE_URL: z.string().url().optional(),
    /** Public site URL (email links, security.txt defaults). */
    FRONTEND_URL: z.string().url().optional(),
    /** RFC 9116 security.txt — override defaults from FRONTEND_URL. */
    SECURITY_TXT_CONTACT: z.string().min(1).optional(),
    SECURITY_TXT_POLICY: z.string().url().optional(),
    SECURITY_TXT_CANONICAL: z.string().url().optional(),
    SECURITY_TXT_EXPIRES: z.string().optional(),
    /** HTTP access middleware: all | errors | off (mặc định prod = errors). */
    HTTP_ACCESS_LOG: z.enum(["all", "errors", "off"]).optional(),
    /** Winston + optional prod console. */
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).optional(),
    ENABLE_CONSOLE_LOG: z.string().optional(),
    /** Bật GET /health/metrics (Bearer hoặc x-metrics-token). */
    METRICS_TOKEN: z.string().optional(),
    /** Alert runtime cho route trọng yếu (ms + cooldown). */
    ALERT_PAYMENT_SLOW_MS: z.string().optional(),
    ALERT_HEALTH_DB_SLOW_MS: z.string().optional(),
    ALERT_COOLDOWN_MS: z.string().optional(),
    /** CSP extend lists (comma-separated trusted sources), dùng khi thêm script/domain mới. */
    CSP_SCRIPT_SRC: z.string().optional(),
    CSP_STYLE_SRC: z.string().optional(),
    CSP_FONT_SRC: z.string().optional(),
    CSP_CONNECT_SRC: z.string().optional(),
    CSP_IMG_SRC: z.string().optional(),
    CSP_FRAME_SRC: z.string().optional(),
    /** Auth secrets (bắt buộc ở production bởi guard server). */
    JWT_SECRET: z.string().optional(),
    JWT_REFRESH_SECRET: z.string().optional(),
    /** Payment/notify secrets (quản lý qua secret manager, không commit). */
    SEPAY_API_KEY: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
    TELEGRAM_TOPIC_ID: z.string().optional(),
    ERROR_TOPIC_ID: z.string().optional(),
    SEND_ERROR_NOTIFICATION: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    ADMIN_ORDERLIST_TIMEOUT_MS: z.string().optional(),
    ADMIN_ORDERLIST_READ_TIMEOUT_MS: z.string().optional(),
    ADMIN_ORDERLIST_RENEW_TIMEOUT_MS: z.string().optional(),
    /** Namespace key cache in-memory (HTTP). */
    MEMORY_CACHE_KEY_PREFIX: z.string().optional(),
    /** Prefix mọi key RedisMap (Redis). */
    REDIS_KEY_PREFIX: z.string().optional(),
    /** Jitter TTL giây (0 = tắt) cho getOrSet HTTP cache. */
    CACHE_TTL_JITTER_SEC: z.string().optional(),
    /** `true` = không đăng ký cron (replica / worker không chạy job). */
    DISABLE_CRON: z.string().optional(),
    /**
     * `allow` = không có Redis vẫn chạy cron trên instance này (chỉ dùng khi chắc chắn chỉ 1 instance).
     * Production mặc định: không Redis → không cron (tránh trùng khi scale).
     */
    CRON_WITHOUT_REDIS: z.string().optional(),
    /** Key lock leader (mặc định `my-store:cron:leader`, có thêm `REDIS_KEY_PREFIX`). */
    CRON_LEADER_LOCK_KEY: z.string().optional(),
    CRON_LEADER_LOCK_TTL_SEC: z.string().optional(),
    CRON_LEADER_RENEW_MS: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
