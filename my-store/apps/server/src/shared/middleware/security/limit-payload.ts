/**
 * Request payload size limiter
 */
import type { Request, Response, NextFunction } from "express";
import { auditService } from "../../services/audit.service";

export const limitPayloadSize = (maxSizeKB: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    const maxSize = maxSizeKB * 1024;

    if (contentLength > maxSize) {
      auditService.logSecurity("SUSPICIOUS_ACTIVITY", req, {
        type: "large_payload",
        size: contentLength,
        maxAllowed: maxSize,
      });
      return res.status(413).json({ error: "Payload quá lớn" });
    }
    next();
  };
};
