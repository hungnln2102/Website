/**
 * Proxy tin tức công khai + ảnh bài viết sang admin_orderlist.
 * Prod: store (VITE_API_URL) phải có route này và ADMIN_ORDERLIST_API_URL đúng.
 */
import { Router } from "express";
import {
  createAdminOrderlistProxyHandler,
  UPSTREAM_TIMEOUT_READ_MS,
} from "./create-admin-orderlist-proxy";

export const publicContentProxyRouter = Router();
publicContentProxyRouter.use(
  createAdminOrderlistProxyHandler({
    upstreamPath: "/api/public/content",
    logLabel: "public-content-proxy",
    upstreamTimeoutMs: UPSTREAM_TIMEOUT_READ_MS,
    connectionFailureBody: {
      error: "SERVICE_UNAVAILABLE",
      message: "Không kết nối được dịch vụ nội dung. Thử lại sau.",
    },
  }),
);

/** Ảnh upload bài viết — URL ghép từ getApiBase() + /image/... */
export const articleImagesProxyRouter = Router();
articleImagesProxyRouter.use(
  createAdminOrderlistProxyHandler({
    upstreamPath: "/image/articles",
    logLabel: "article-images-proxy",
    upstreamTimeoutMs: UPSTREAM_TIMEOUT_READ_MS,
    connectionFailureBody: {
      error: "SERVICE_UNAVAILABLE",
      message: "Không tải được ảnh bài viết.",
    },
  }),
);

/** Ảnh biến thể (admin_orderlist /image_variant) — không dùng chung image_product */
export const variantImagesProxyRouter = Router();
variantImagesProxyRouter.use(
  createAdminOrderlistProxyHandler({
    upstreamPath: "/image_variant",
    logLabel: "variant-images-proxy",
    upstreamTimeoutMs: UPSTREAM_TIMEOUT_READ_MS,
    connectionFailureBody: {
      error: "SERVICE_UNAVAILABLE",
      message: "Không tải được ảnh biến thể.",
    },
  }),
);
