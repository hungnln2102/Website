import type { Request, Response, NextFunction } from "express";
import { isMaintenanceMode, isWhitelisted } from "../../modules/maintenance/maintenance.service";
import { getClientIP } from "./security/banned-ip";

/**
 * Maintenance mode middleware.
 * Khi maintenance ON → trả 503 cho mọi request, TRỪ IP nằm trong whitelist DB
 * và TRỪ API phục vụ Trung tâm gói (/system trên web).
 * Đặt SAU rate-limiter, TRƯỚC các route handler.
 */
const LOCALHOST_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/** Public GET dùng cho menu Trung tâm gói + các API fix profile / renew trên web */
const MAINTENANCE_BYPASS_PREFIXES = [
  "/api/fix-adobe",
  "/api/netflix",
  "/api/renew-adobe/public",
  /** Route check trạng thái maintenance (đặt trước guard, vẫn keep ở đây để chống regression). */
  "/api/maintenance/status",
  "/categories",
  "/products",
  /** Probe + metrics vận hành (1.3) — không chặn khi bảo trì. */
  "/health",
];

function pathBypassesMaintenance(reqPath: string): boolean {
  return MAINTENANCE_BYPASS_PREFIXES.some(
    (p) => reqPath === p || reqPath.startsWith(`${p}/`)
  );
}

export const maintenanceGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const maintenance = await isMaintenanceMode();
    if (!maintenance) return next();

    if (pathBypassesMaintenance(req.path)) {
      return next();
    }

    const ip = getClientIP(req);

    // Localhost luôn bypass – local development không bao giờ bị chặn
    if (LOCALHOST_IPS.has(ip)) return next();

    const allowed = await isWhitelisted(ip);
    if (allowed) return next();

    return res.status(503).json({
      error: "SERVICE_UNAVAILABLE",
      message: "Website đang bảo trì. Vui lòng quay lại sau.",
      maintenance: true,
    });
  } catch {
    // Nếu lỗi khi check → cho qua để không block user
    next();
  }
};
