/**
 * Banned IP handling: block list + check + honeypot (uses addBannedIP)
 */
import type { Request, Response, NextFunction } from "express";
import { auditService } from "../../services/audit.service";

const bannedIPs = new Set<string>();
const banDuration = 24 * 60 * 60 * 1000; // 24 hours

export const getClientIP = (req: Request): string => {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.ip ||
    "unknown"
  ).trim();
};

export const addBannedIP = (ip: string) => {
  bannedIPs.add(ip);
  setTimeout(() => bannedIPs.delete(ip), banDuration);
};

export const checkBannedIP = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = getClientIP(req);
  if (bannedIPs.has(ip)) {
    return res.status(403).json({ error: "Truy cập bị từ chối" });
  }
  next();
};

export const checkHoneypot = (fieldName: string = "_hp_field") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body[fieldName]) {
      const ip = getClientIP(req);
      auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
        type: "honeypot_triggered",
        ip,
      });
      addBannedIP(ip);
      return res.json({ success: true });
    }
    next();
  };
};
