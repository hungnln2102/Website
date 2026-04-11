/**
 * Chỉ một instance trong cluster chạy cron — Redis SET NX + gia hạn TTL.
 * Không có Redis: xem `CRON_WITHOUT_REDIS` (mặc định production = không chạy cron).
 */
import { getRedisClient } from "../config/redis";
import logger from "../shared/utils/logger";

const LOCK_TTL_SEC = Number(process.env.CRON_LEADER_LOCK_TTL_SEC ?? "55") || 55;
const RENEW_MS = Number(process.env.CRON_LEADER_RENEW_MS ?? "25000") || 25000;

function lockKey(): string {
  const p = (process.env.REDIS_KEY_PREFIX ?? "").trim().replace(/:+$/, "");
  const base = (process.env.CRON_LEADER_LOCK_KEY ?? "my-store:cron:leader").trim();
  return p ? `${p}:${base}` : base;
}

function instanceId(): string {
  return (
    process.env.KUBE_POD_NAME?.trim() ||
    process.env.HOSTNAME?.trim() ||
    `pid-${process.pid}`
  );
}

let renewTimer: ReturnType<typeof setInterval> | null = null;
let heldLock = false;
let exitHooked = false;

function hookReleaseOnExit(): void {
  if (exitHooked) return;
  exitHooked = true;
  const release = () => {
    void releaseCronLeaderLock();
  };
  process.once("SIGTERM", release);
  process.once("SIGINT", release);
}

async function renewLock(id: string, key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const v = await redis.get(key);
    if (v === id) {
      await redis.expire(key, LOCK_TTL_SEC);
    }
  } catch (e) {
    console.warn("[cron-leader] renew failed:", (e as Error)?.message ?? e);
  }
}

/**
 * Nếu giành được lock Redis → gọi `deploy` (đăng ký mọi cron).
 * Follower: bỏ qua `deploy`.
 */
export async function runAsCronLeaderIfEligible(
  deploy: () => void | Promise<void>,
): Promise<void> {
  const id = instanceId();
  const key = lockKey();
  const redis = getRedisClient();

  if (!redis) {
    const allow =
      String(process.env.CRON_WITHOUT_REDIS ?? "").toLowerCase() === "allow" ||
      process.env.NODE_ENV !== "production";
    if (!allow) {
      console.warn(
        "[cron-leader] Redis không kết nối — không đăng ký cron (tránh trùng khi scale). " +
          "Đặt CRON_WITHOUT_REDIS=allow trên môi trường chỉ 1 instance, hoặc bật Redis.",
      );
      return;
    }
    console.warn(
      "[cron-leader] Redis không kết nối — chạy cron trên instance này (CRON_WITHOUT_REDIS=allow hoặc dev).",
    );
    await deploy();
    return;
  }

  try {
    const ok = await redis.set(key, id, "EX", LOCK_TTL_SEC, "NX");
    if (ok !== "OK") {
      console.log(
        "[cron-leader] Không phải leader (lock đã có) — bỏ qua đăng ký cron trên instance này.",
      );
      return;
    }
    heldLock = true;
    hookReleaseOnExit();
    console.log("[cron-leader] Đã giành leader lock, đăng ký cron —", id);
    await deploy();
    renewTimer = setInterval(() => void renewLock(id, key), RENEW_MS);
  } catch (e) {
    logger.error("[cron-leader] Lỗi lock", {
      error: (e as Error)?.message ?? e,
    });
  }
}

/** Giải phóng lock khi shutdown (best-effort). */
export async function releaseCronLeaderLock(): Promise<void> {
  if (!heldLock) return;
  const redis = getRedisClient();
  const key = lockKey();
  const id = instanceId();
  if (renewTimer) {
    clearInterval(renewTimer);
    renewTimer = null;
  }
  if (!redis) return;
  try {
    const v = await redis.get(key);
    if (v === id) await redis.del(key);
  } catch {
    /* ignore */
  }
  heldLock = false;
}
