import type { Request, Response, NextFunction } from "express";
import { isMaintenanceMode, isWhitelisted } from "../../modules/maintenance/maintenance.service";
import { getClientIP } from "./security/banned-ip";

/**
 * Maintenance mode middleware.
 * Khi maintenance ON → trả 503 cho mọi request, TRỪ IP nằm trong whitelist DB.
 * Đặt SAU rate-limiter, TRƯỚC các route handler.
 */
export const maintenanceGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const maintenance = await isMaintenanceMode();
    if (!maintenance) return next();

    const ip = getClientIP(req);
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
