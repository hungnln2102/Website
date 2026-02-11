/**
 * Additional security headers (on top of helmet)
 */
import type { Request, Response, NextFunction } from "express";

export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.path.includes("/api/auth/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  res.setHeader(
    "X-Request-Id",
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  next();
};
