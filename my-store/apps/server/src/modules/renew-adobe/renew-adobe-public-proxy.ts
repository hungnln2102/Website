/**
 * Chuyển tiếp /api/renew-adobe/public/* sang admin_orderlist backend.
 * Web (prod) gọi VITE_API_URL (store); route này proxy tới ADMIN_ORDERLIST_API_URL.
 */
import { Router } from "express";
import { createAdminOrderlistProxyHandler } from "../admin-orderlist/create-admin-orderlist-proxy";

export const renewAdobePublicProxyRouter = Router();
renewAdobePublicProxyRouter.use(
  createAdminOrderlistProxyHandler({
    upstreamPath: "/api/renew-adobe/public",
    logLabel: "renew-adobe-public-proxy",
    connectionFailureBody: {
      success: false,
      error: "Dịch vụ Renew Adobe tạm thời không khả dụng.",
    },
  }),
);
