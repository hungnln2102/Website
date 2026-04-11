/**
 * Proxy HTTP tới backend admin_orderlist (tin tức, ảnh bài viết, Renew Adobe public).
 * Dùng chung để tránh lệch logic và log lỗi upstream thống nhất.
 */
import type { Request, RequestHandler, Response } from "express";
import logger from "../../shared/utils/logger";

const DEFAULT_ADMIN = "http://127.0.0.1:3001";

function parseTimeoutMs(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1000 ? Math.floor(n) : fallback;
}

/** Timeout gọi admin mặc định (JSON / API thường). Env: `ADMIN_ORDERLIST_TIMEOUT_MS`. */
const UPSTREAM_TIMEOUT_MS = parseTimeoutMs(
  process.env.ADMIN_ORDERLIST_TIMEOUT_MS,
  60_000,
);

/**
 * Timeout cho proxy đọc nhanh (tin, ảnh) — tách khỏi Renew Adobe (Playwright dài).
 * Env: `ADMIN_ORDERLIST_READ_TIMEOUT_MS` (mặc định 45s).
 */
export const UPSTREAM_TIMEOUT_READ_MS = parseTimeoutMs(
  process.env.ADMIN_ORDERLIST_READ_TIMEOUT_MS,
  45_000,
);

/** Renew Adobe public /activate. Env: `ADMIN_ORDERLIST_RENEW_TIMEOUT_MS` (mặc định 660s). */
export const UPSTREAM_TIMEOUT_RENEW_ADOBE_MS = parseTimeoutMs(
  process.env.ADMIN_ORDERLIST_RENEW_TIMEOUT_MS,
  660_000,
);

function normalizeAdminBase(raw: string): string {
  let b = raw.trim().replace(/\/+$/, "");
  if (b.endsWith("/api")) {
    b = b.slice(0, -4).replace(/\/+$/, "");
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[admin-orderlist-proxy] ADMIN_ORDERLIST_API_URL không nên kết thúc bằng /api (đã tự bỏ hậu tố).",
      );
    }
  }
  return b;
}

export function getAdminOrderlistBase(): string {
  const fromEnv = process.env.ADMIN_ORDERLIST_API_URL?.trim();
  if (!fromEnv) return DEFAULT_ADMIN;
  return normalizeAdminBase(fromEnv);
}

export type AdminOrderlistProxyOptions = {
  /** Đường dẫn trên admin sau origin, ví dụ /api/renew-adobe/public */
  upstreamPath: string;
  logLabel: string;
  /** JSON trả về khi không kết nối được admin (fetch throw / timeout). */
  connectionFailureBody: Record<string, unknown>;
  /** Mặc định 60s; route Playwright (Renew Adobe) nên truyền ~660s. */
  upstreamTimeoutMs?: number;
};

export function createAdminOrderlistProxyHandler(
  options: AdminOrderlistProxyOptions,
): RequestHandler {
  const { upstreamPath, logLabel, connectionFailureBody } = options;
  const upstreamTimeoutMs = options.upstreamTimeoutMs ?? UPSTREAM_TIMEOUT_MS;

  return async (req: Request, res: Response) => {
    const base = getAdminOrderlistBase();
    const target = `${base}${upstreamPath}${req.url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), upstreamTimeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: (req.headers.accept as string) || "*/*",
      };
      const ct = req.headers["content-type"];
      if (ct) headers["Content-Type"] = ct as string;
      if (req.headers.cookie) headers.Cookie = req.headers.cookie;
      if (req.headers.authorization)
        headers.Authorization = req.headers.authorization as string;

      const init: RequestInit = {
        method: req.method,
        headers,
        redirect: "manual",
        signal: controller.signal,
      };

      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        init.body = JSON.stringify(
          req.body && typeof req.body === "object" ? req.body : {},
        );
      }

      const upstream = await fetch(target, init);
      clearTimeout(timeoutId);

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (k === "content-encoding" || k === "transfer-encoding") return;
        if (k === "set-cookie") res.append(key, value);
        else res.setHeader(key, value);
      });

      const buf = Buffer.from(await upstream.arrayBuffer());
      res.send(buf);
    } catch (err) {
      clearTimeout(timeoutId);
      const reason = err instanceof Error ? err.message : String(err);
      const pathOnly = req.url.split("?")[0];
      logger.error(`[${logLabel}] không gọi được admin_orderlist`, {
        upstream: `${base}${upstreamPath}${pathOnly}`,
        reason,
        hint:
          "ADMIN_ORDERLIST_API_URL = origin admin_orderlist (không /api). Production: https://admin.<domain> qua Nginx; " +
          "dev host: http://127.0.0.1:3001; Docker không resolve domain: http://host.docker.internal:3001.",
      });
      if (!res.headersSent) {
        res.status(503).json(connectionFailureBody);
      }
    }
  };
}

/** Gọi một lần khi khởi động production nếu thiếu env — giảm 503 “không hiểu vì sao”. */
export function warnIfAdminOrderlistUrlMissingInProduction(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (String(process.env.ADMIN_ORDERLIST_API_URL ?? "").trim()) return;
  logger.error(
    "[store] ADMIN_ORDERLIST_API_URL chưa đặt — Renew Adobe / tin tức / ảnh bài sẽ lỗi. " +
      "Đặt trong apps/server/.env: production https://admin.<domain>; dev http://127.0.0.1:3001 (không thêm /api).",
  );
}
