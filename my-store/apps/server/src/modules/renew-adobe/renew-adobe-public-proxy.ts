/**
 * Chuyển tiếp /api/renew-adobe/public/* sang admin_orderlist backend.
 * Web (prod) gọi cùng origin → store (4000); route này không có trên store nếu không proxy → 404.
 */
import type { Request, Response, RequestHandler } from "express";
import { Router } from "express";

const ADMIN_BASE =
  process.env.ADMIN_ORDERLIST_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3001";

const forward: RequestHandler = async (req: Request, res: Response) => {
  const target = `${ADMIN_BASE}/api/renew-adobe/public${req.url}`;

  try {
    const headers: Record<string, string> = {
      Accept: (req.headers.accept as string) || "application/json",
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
    };

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      init.body = JSON.stringify(
        req.body && typeof req.body === "object" ? req.body : {},
      );
    }

    const upstream = await fetch(target, init);

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
    console.error("[renew-adobe-public-proxy] upstream error:", err);
    res.status(503).json({
      success: false,
      error: "Dịch vụ Renew Adobe tạm thời không khả dụng.",
    });
  }
};

export const renewAdobePublicProxyRouter = Router();
renewAdobePublicProxyRouter.use(forward);
