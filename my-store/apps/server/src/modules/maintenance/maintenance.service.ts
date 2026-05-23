import pool from "../../config/database";
import { DB_SCHEMA } from "../../config/db.config";

const SCHEMA_ADMIN = DB_SCHEMA.IP_WHITELISTS!.SCHEMA;
const IP_WHITELIST_TABLE = `"${SCHEMA_ADMIN}"."${DB_SCHEMA.IP_WHITELISTS!.TABLE}"`;
const SETTINGS_TABLE = `"${SCHEMA_ADMIN}"."${DB_SCHEMA.SITE_SETTINGS!.TABLE}"`;

// Whitelist cache — reload mỗi 30s (ít thay đổi hơn maintenance flag).
let cachedWhitelist: Set<string> = new Set();
let whitelistLastRefresh = 0;
const WHITELIST_CACHE_TTL = 30_000;

async function readMaintenanceModeFromDb(): Promise<boolean> {
  try {
    const settRes = await pool.query<{ value: string }>(
      `SELECT ${DB_SCHEMA.SITE_SETTINGS!.COLS.VALUE} FROM ${SETTINGS_TABLE} WHERE ${DB_SCHEMA.SITE_SETTINGS!.COLS.KEY} = 'maintenance_mode'`
    );
    return settRes.rows[0]?.value === "on";
  } catch (err) {
    console.error("[maintenance] Failed to read maintenance_mode:", err);
    // Khi lỗi DB → tắt maintenance để không block user
    return false;
  }
}

async function refreshWhitelistCache() {
  const now = Date.now();
  if (now - whitelistLastRefresh < WHITELIST_CACHE_TTL) return;
  whitelistLastRefresh = now;

  try {
    const ipRes = await pool.query<{ ip_address: string }>(
      `SELECT ${DB_SCHEMA.IP_WHITELISTS!.COLS.IP_ADDRESS} FROM ${IP_WHITELIST_TABLE} WHERE ${DB_SCHEMA.IP_WHITELISTS!.COLS.IS_ACTIVE} = true`
    );
    cachedWhitelist = new Set(ipRes.rows.map((r) => r.ip_address));
  } catch (err) {
    console.error("[maintenance] Failed to refresh whitelist cache:", err);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Luôn đọc DB — không cache để bật/tắt bảo trì có hiệu lực ngay. */
export async function isMaintenanceMode(): Promise<boolean> {
  return readMaintenanceModeFromDb();
}

export async function isWhitelisted(ip: string): Promise<boolean> {
  await refreshWhitelistCache();
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
}

/** Lấy danh sách tất cả IP whitelist */
export async function listWhitelist() {
  const res = await pool.query(
    `SELECT id, ip_address, label, is_active, created_at, updated_at
     FROM ${IP_WHITELIST_TABLE} ORDER BY created_at DESC`
  );
  return res.rows;
}

/** Thêm IP vào whitelist */
export async function addWhitelistIP(ip: string, label?: string) {
  const res = await pool.query(
    `INSERT INTO ${IP_WHITELIST_TABLE} (ip_address, label)
     VALUES ($1, $2)
     ON CONFLICT (ip_address) DO UPDATE SET is_active = true, label = COALESCE($2, ${IP_WHITELIST_TABLE}.label), updated_at = NOW()
     RETURNING *`,
    [ip.trim(), label?.trim() || null]
  );
  whitelistLastRefresh = 0;
  return res.rows[0];
}

/** Xoá IP khỏi whitelist (hard delete) */
export async function removeWhitelistIP(id: number) {
  const res = await pool.query(
    `DELETE FROM ${IP_WHITELIST_TABLE} WHERE id = $1 RETURNING *`,
    [id]
  );
  whitelistLastRefresh = 0;
  return res.rows[0];
}

/** Toggle active */
export async function toggleWhitelistIP(id: number, isActive: boolean) {
  const res = await pool.query(
    `UPDATE ${IP_WHITELIST_TABLE} SET is_active = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, isActive]
  );
  whitelistLastRefresh = 0;
  return res.rows[0];
}

/** Force reload whitelist cache ngay lập tức */
export function invalidateCache() {
  whitelistLastRefresh = 0;
}
