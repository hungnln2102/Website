import pool from "../../config/database";

const SCHEMA = "admin";
const IP_TABLE = `"${SCHEMA}"."ip_whitelist"`;
const SETTINGS_TABLE = `"${SCHEMA}"."site_settings"`;

// ─── In-memory cache (reload mỗi 30s) ──────────────────────────────────────
let cachedWhitelist: Set<string> = new Set();
let cachedMaintenanceMode = false;
let lastRefresh = 0;
const CACHE_TTL = 30_000; // 30 seconds

async function refreshCache() {
  const now = Date.now();
  if (now - lastRefresh < CACHE_TTL) return;
  lastRefresh = now;

  try {
    const [ipRes, settRes] = await Promise.all([
      pool.query<{ ip_address: string }>(
        `SELECT ip_address FROM ${IP_TABLE} WHERE is_active = true`
      ),
      pool.query<{ value: string }>(
        `SELECT value FROM ${SETTINGS_TABLE} WHERE key = 'maintenance_mode'`
      ),
    ]);

    cachedWhitelist = new Set(ipRes.rows.map((r) => r.ip_address));
    cachedMaintenanceMode = settRes.rows[0]?.value === "on";
  } catch (err) {
    console.error("[maintenance] Failed to refresh cache:", err);
    // Khi lỗi DB → tắt maintenance để không block user
    cachedMaintenanceMode = false;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function isMaintenanceMode(): Promise<boolean> {
  await refreshCache();
  return cachedMaintenanceMode;
}

export async function isWhitelisted(ip: string): Promise<boolean> {
  await refreshCache();
  return cachedWhitelist.has(ip);
}

/** Bật / tắt maintenance mode */
export async function setMaintenanceMode(on: boolean): Promise<void> {
  await pool.query(
    `INSERT INTO ${SETTINGS_TABLE} (key, value, updated_at)
     VALUES ('maintenance_mode', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [on ? "on" : "off"]
  );
  lastRefresh = 0; // invalidate cache
}

/** Lấy danh sách tất cả IP whitelist */
export async function listWhitelist() {
  const res = await pool.query(
    `SELECT id, ip_address, label, is_active, created_at, updated_at
     FROM ${IP_TABLE} ORDER BY created_at DESC`
  );
  return res.rows;
}

/** Thêm IP vào whitelist */
export async function addWhitelistIP(ip: string, label?: string) {
  const res = await pool.query(
    `INSERT INTO ${IP_TABLE} (ip_address, label)
     VALUES ($1, $2)
     ON CONFLICT (ip_address) DO UPDATE SET is_active = true, label = COALESCE($2, ${IP_TABLE}.label), updated_at = NOW()
     RETURNING *`,
    [ip.trim(), label?.trim() || null]
  );
  lastRefresh = 0;
  return res.rows[0];
}

/** Xoá IP khỏi whitelist (hard delete) */
export async function removeWhitelistIP(id: number) {
  const res = await pool.query(
    `DELETE FROM ${IP_TABLE} WHERE id = $1 RETURNING *`,
    [id]
  );
  lastRefresh = 0;
  return res.rows[0];
}

/** Toggle active */
export async function toggleWhitelistIP(id: number, isActive: boolean) {
  const res = await pool.query(
    `UPDATE ${IP_TABLE} SET is_active = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, isActive]
  );
  lastRefresh = 0;
  return res.rows[0];
}

/** Force reload cache ngay lập tức */
export function invalidateCache() {
  lastRefresh = 0;
}
