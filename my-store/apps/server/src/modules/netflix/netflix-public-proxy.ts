import { Router } from "express";
import {
  createAdminOrderlistProxyHandler,
  UPSTREAM_TIMEOUT_READ_MS,
} from "../admin-orderlist/create-admin-orderlist-proxy";

export const netflixPublicProxyRouter = Router();

netflixPublicProxyRouter.use(
  createAdminOrderlistProxyHandler({
    upstreamPath: "/api/netflix/public",
    logLabel: "netflix-public-proxy",
    connectionFailureBody: {
      success: false,
      error: "Dịch vụ Netflix tạm thời không khả dụng.",
      code: "NETFLIX_UPSTREAM_UNREACHABLE",
    },
    upstreamTimeoutMs: UPSTREAM_TIMEOUT_READ_MS,
  }),
);
