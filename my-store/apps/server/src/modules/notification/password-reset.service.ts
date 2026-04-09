/**
 * Quên mật khẩu: OTP lưu Redis (TTL 15 phút); fallback bộ nhớ process khi không có Redis (chỉ dev).
 */

import { randomInt, timingSafeEqual } from "crypto";
import pool from "../../config/database";
import { DB_SCHEMA } from "../../config/db.config";
import { getRedisClient, isRedisAvailable } from "../../config/redis";
import logger from "../../shared/utils/logger";
import * as customerEmail from "./customer-email.service";
import { authService } from "../auth/auth.service";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const COLS = DB_SCHEMA.ACCOUNT!.COLS as {
  ID: string;
  EMAIL: string;
  USERNAME: string;
  PASSWORD_HASH: string;
  IS_ACTIVE: string;
};

const OTP_TTL_SEC = 15 * 60;
const REDIS_PREFIX = "pwdreset:";
const MEM_FALLBACK = new Map<string, { value: string; expiresAt: number }>();

function cacheKey(emailNorm: string): string {
  return `${REDIS_PREFIX}${emailNorm.toLowerCase().trim()}`;
}

function safeEqualOtp(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function lookupUserForReset(
  usernameOrEmail: string
): Promise<{ id: string; email: string; username: string; password_hash: string } | null> {
  const q = usernameOrEmail.trim();
  if (!q) return null;
  const res = await pool.query(
    `SELECT ${COLS.ID}::text as id,
            ${COLS.EMAIL} as email,
            ${COLS.USERNAME} as username,
            ${COLS.PASSWORD_HASH} as password_hash
     FROM ${ACCOUNT_TABLE}
     WHERE (LOWER(${COLS.EMAIL}) = LOWER($1) OR LOWER(${COLS.USERNAME}) = LOWER($1))
       AND COALESCE(${COLS.IS_ACTIVE}, true) = true
     LIMIT 1`,
    [q]
  );
  if (res.rows.length === 0) return null;
  return res.rows[0] as {
    id: string;
    email: string;
    username: string;
    password_hash: string;
  };
}

/**
 * Tạo OTP và gửi email. Luôn trả silently nếu không tìm thấy user (chống enumerate).
 */
export async function requestPasswordReset(usernameOrEmail: string): Promise<void> {
  const trimmed = usernameOrEmail.trim();
  if (!trimmed) {
    await delayJitter();
    return;
  }
  const user = await lookupUserForReset(trimmed);
  if (!user) {
    await delayJitter();
    return;
  }
  if (!customerEmail.canSendPasswordResetEmail()) {
    logger.warn("[password-reset] SEND_MAIL_API_KEY chưa cấu hình — không gửi OTP");
    return;
  }

  const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const emailNorm = user.email.toLowerCase().trim();
  const payload = `${user.id}:${otp}`;
  const key = cacheKey(emailNorm);

  const redis = getRedisClient();
  if (redis && isRedisAvailable()) {
    await redis.set(key, payload, "EX", OTP_TTL_SEC);
  } else {
    MEM_FALLBACK.set(key, { value: payload, expiresAt: Date.now() + OTP_TTL_SEC * 1000 });
    logger.warn("[password-reset] Redis không sẵn sàng — OTP lưu bộ nhớ process (chỉ phù hợp dev)");
  }

  try {
    await customerEmail.sendPasswordResetOtp({
      to: user.email,
      username: user.username,
      otp,
    });
  } catch (e) {
    logger.error("[password-reset] Gửi mail thất bại:", e);
    if (redis && isRedisAvailable()) await redis.del(key);
    else MEM_FALLBACK.delete(key);
    throw e;
  }
}

function delayJitter(): Promise<void> {
  return new Promise((r) => setTimeout(r, 200 + Math.floor(Math.random() * 200)));
}

function readMem(key: string): string | null {
  const ent = MEM_FALLBACK.get(key);
  if (!ent) return null;
  if (Date.now() > ent.expiresAt) {
    MEM_FALLBACK.delete(key);
    return null;
  }
  return ent.value;
}

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: "invalid_otp" | "user_not_found" | "weak_password" | "password_reused" };

export type VerifyOtpOnlyResult = { ok: true } | { ok: false; error: "invalid_otp" | "user_not_found" };

/**
 * Chỉ kiểm tra OTP khớp (không đổi mật khẩu, không xóa mã — dùng trước bước nhập mật khẩu mới).
 */
export async function verifyPasswordResetOtpOnly(params: {
  usernameOrEmail: string;
  otp: string;
}): Promise<VerifyOtpOnlyResult> {
  const idQuery = params.usernameOrEmail.trim();
  const otp = String(params.otp).trim().replace(/\s/g, "");
  if (!idQuery || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { ok: false, error: "invalid_otp" };
  }

  const acc = await lookupUserForReset(idQuery);
  if (!acc) return { ok: false, error: "user_not_found" };

  const userId = String(acc.id);
  const emailNorm = acc.email.toLowerCase().trim();
  const key = cacheKey(emailNorm);
  const redis = getRedisClient();
  let stored: string | null = null;
  if (redis && isRedisAvailable()) {
    stored = await redis.get(key);
  } else {
    stored = readMem(key);
  }

  if (!stored) return { ok: false, error: "invalid_otp" };
  const [sid, savedOtp] = stored.split(":");
  if (!sid || !savedOtp || sid !== userId || !safeEqualOtp(savedOtp, otp)) {
    return { ok: false, error: "invalid_otp" };
  }

  return { ok: true };
}

/**
 * Xác minh OTP và đặt mật khẩu mới.
 * `usernameOrEmail` phải trùng giá trị đã dùng khi gửi OTP (email hoặc tên đăng nhập).
 */
export async function verifyOtpAndResetPassword(params: {
  usernameOrEmail: string;
  otp: string;
  newPassword: string;
  /** Kiểm tra không trùng mật gần đây */
  isPasswordReused: (userId: string, plain: string) => Promise<boolean>;
  onSuccess: (userId: string, newHash: string, oldHash: string) => Promise<void>;
}): Promise<ResetPasswordResult> {
  const idQuery = params.usernameOrEmail.trim();
  const otp = String(params.otp).trim().replace(/\s/g, "");
  if (!idQuery || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { ok: false, error: "invalid_otp" };
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(params.newPassword)) {
    return { ok: false, error: "weak_password" };
  }

  const acc = await lookupUserForReset(idQuery);
  if (!acc) return { ok: false, error: "user_not_found" };

  const userId = String(acc.id);
  const oldHash = String(acc.password_hash);
  const emailNorm = acc.email.toLowerCase().trim();

  const key = cacheKey(emailNorm);
  const redis = getRedisClient();
  let stored: string | null = null;
  if (redis && isRedisAvailable()) {
    stored = await redis.get(key);
  } else {
    stored = readMem(key);
  }

  if (!stored) return { ok: false, error: "invalid_otp" };
  const [sid, savedOtp] = stored.split(":");
  if (!sid || !savedOtp || sid !== userId || !safeEqualOtp(savedOtp, otp)) {
    return { ok: false, error: "invalid_otp" };
  }

  if (await params.isPasswordReused(userId, params.newPassword)) {
    return { ok: false, error: "password_reused" };
  }

  const newHash = await authService.hashPassword(params.newPassword);
  await params.onSuccess(userId, newHash, oldHash);

  if (redis && isRedisAvailable()) await redis.del(key);
  else MEM_FALLBACK.delete(key);

  return { ok: true };
}
