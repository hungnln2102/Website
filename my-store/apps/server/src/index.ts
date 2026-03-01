import { createContext } from "@my-store/api/context";
import { appRouter } from "@my-store/api/routers/index";
import prisma from "@my-store/db";
import { env } from "@my-store/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler, asyncHandler } from "./middleware/errorHandler";
import { requestLogger, responseTimeLogger } from "./middleware/logger";
import { generalLimiter } from "./middleware/rateLimiter";
import {
  apiSecurityMiddleware,
  limitPayloadSize,
} from "./middleware/api-security";
import { csrfProtection } from "./middleware/csrf";
import paymentRouter from "./routes/payment.route";
import orderRouter from "./routes/order.route";
import mailRouter from "./routes/mail.route";
import * as mailWebhookController from "./controllers/mail.webhook.controller";
import variantDetailRouter from "./routes/variant-detail.route";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import cartRouter from "./routes/cart.route";
import topupRouter from "./routes/topup.route";
import formRouter from "./routes/form.route";
import productsRouter from "./routes/products.route";
import debugRouter from "./routes/debug.route";
import * as sitemapController from "./controllers/sitemap.controller";
import * as healthRoutes from "./routes/health";

// Cron jobs: load sau khi server listen (dynamic import trong start()) để tránh treo lúc khởi động

if (process.env.NODE_ENV !== "production") {
  console.log("[Server] Imports done, starting app...");
}

const app = express();

// Khi chạy sau proxy (Nginx, load balancer): cần trust proxy để express-rate-limit
// và req.secure/req.ip dùng đúng X-Forwarded-For / X-Forwarded-Proto
app.set("trust proxy", 1);

// HTTPS redirect for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check for Heroku/AWS/Cloud proxy headers
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (!isHttps) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Security headers - using helmet defaults + customizations
app.use(helmet({
  // Disable CSP in development (causes issues with dev tools)
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://challenges.cloudflare.com/"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["https://challenges.cloudflare.com/"],
      objectSrc: ["'none'"],
    },
  } : false,
  // HSTS only in production
  strictTransportSecurity: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
}));

// Add additional security headers manually for better compatibility
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

// Response compression (gzip/deflate) – reduces JSON payload size by ~70-80%
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression ratio
    threshold: 1024, // Only compress responses > 1KB
  }),
);

// CORS configuration - SECURITY: Fail fast if CORS_ORIGIN missing in production
const corsOriginList = env.CORS_ORIGIN || [];
if (process.env.NODE_ENV === 'production' && corsOriginList.length === 0) {
  throw new Error('CORS_ORIGIN must be set in production (e.g. https://mavrykpremium.store,https://www.mavrykpremium.store)');
}

const corsOrigins: (string | RegExp)[] = process.env.NODE_ENV === 'production'
  ? corsOriginList
  : ['http://localhost:3001', 'http://localhost:4001', ...corsOriginList];

app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// Mail webhook – mount trước express.json() để nhận raw body (verify chữ ký Svix)
app.use("/api/mail", mailRouter);
// Alias đúng URL Resend đang gọi: https://api.mavrykpremium.store/webhook/mail
app.post(
  "/webhook/mail",
  express.raw({ type: "application/json" }),
  (req, res) => mailWebhookController.mailWebhook(req, res)
);

// Parse JSON bodies
app.use(express.json());

// Parse cookies (required for CSRF protection)
app.use(cookieParser());

// Request/response logging
app.use(requestLogger);
app.use(responseTimeLogger);

// Apply general rate limiting to all routes - ENABLED for DDoS protection
app.use(generalLimiter);

// Apply API security middleware (banned IP check, validation, security headers)
app.use(...apiSecurityMiddleware);

// CSRF protection for state-changing requests
app.use("/api", csrfProtection);

// Limit payload size for API endpoints (100KB default)
app.use("/api", limitPayloadSize(100));

// tRPC middleware
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Payment routes
app.use("/api/payment", paymentRouter);

// Order routes (notify-done, cancel – Bot Telegram)
app.use("/api/orders", orderRouter);

// Variant detail routes
app.use("/api/variants", variantDetailRouter);

// Auth routes
app.use("/api/auth", authRouter);

// Protected user routes
app.use("/api/user", userRouter);

// Cart routes
app.use("/api/cart", cartRouter);

// Topup routes
app.use("/api/topup", topupRouter);
app.use("/api/forms", formRouter);

// Public product/category listing (legacy REST)
app.use(productsRouter);

// Debug routes – only in development
if (process.env.NODE_ENV !== "production") {
  app.use("/debug", debugRouter);
}

// Health check endpoints (liveness, readiness, db)
app.get("/", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/health", asyncHandler(healthRoutes.healthCheck));
app.get("/health/db", asyncHandler(healthRoutes.healthCheckDatabase));
app.get("/health/ready", asyncHandler(healthRoutes.readinessCheck));

// Security.txt endpoint (RFC 9116)
app.get("/.well-known/security.txt", (_req, res) => {
  res.type("text/plain").send(`# Security Policy
Contact: security@example.com
Policy: https://example.com/security-policy
Preferred-Languages: en, vi
Expires: 2027-01-31T00:00:00.000Z
`);
});

// Sitemap.xml – generated from products and categories (SEO)
app.get("/sitemap.xml", asyncHandler(sitemapController.getSitemap));

// Error handler middleware (must be last)
app.use(errorHandler);

import { initRedis } from "./config/redis";

async function start() {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] start() called, binding port...");
  }
  const PORT = Number(process.env.PORT) || 4000;
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`[Server] Proxy/Vite có thể gọi http://127.0.0.1:${PORT}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Server] Port ${PORT} đã được dùng. Tắt process đang chiếm port hoặc đổi PORT.`);
    }
    console.error("[Server] listen error:", err.message);
    process.exit(1);
  });

  // Warm-up cache: chạy sau khi DB connect VÀ chạy thêm một lần sau 1.5s (như trước) để cache đầy sớm khi DB đã sẵn sàng
  const runWarmup = async () => {
    try {
      const [{ getProductsList }, { getPromotionsList }, { getCategoriesList }, { cache }] = await Promise.all([
        import("./services/products-list.service"),
        import("./services/promotions.service"),
        import("./services/categories.service"),
        import("./utils/cache"),
      ]);
      await Promise.all([
        getProductsList().then((data) => { cache.set("products:list", data, 600); }),
        getPromotionsList().then((data) => { cache.set("promotions:list", data, 600); }),
        getCategoriesList().then((data) => { cache.set("categories:list", data, 900); }),
      ]);
      console.log("[warmup] Product / category / promotion cache warmed");
    } catch (err) {
      console.warn("[warmup] Cache warm-up failed:", (err as Error)?.message ?? err);
      setTimeout(runWarmup, 2000);
    }
  };

  // Giữ hành vi cũ: warmup sau 1.5s (trước đây 800ms, tăng chút để DB kịp connect)
  setTimeout(runWarmup, 1500);

  prisma
    .$connect()
    .then(() => {
      console.log("Database connected");
      setTimeout(runWarmup, 300);
    })
    .catch((err) => {
      console.error("Database connection error:", err);
      setTimeout(runWarmup, 2000);
    });

  // Load cron jobs sau khi server đã listen (tránh treo khi import jobs + prisma/pool)
  Promise.all([
    import("./jobs/refresh-variant-sold-count.job"),
    import("./jobs/refresh-product-sold-30d.job"),
    import("./jobs/reset-customer-tier-cycle.job"),
  ]).then(
    () => console.log("[Jobs] Cron jobs loaded"),
    (err) => console.warn("[Jobs] Failed to load some cron jobs:", err?.message ?? err)
  );

  // Redis: init trong nền (optional)
  initRedis()
    .then((redisConnected) => {
      if (redisConnected) {
        console.log("✅ Redis connected - using distributed caching");
      } else {
        console.log("⚠️  Redis not available - using in-memory fallback");
      }
    })
    .catch((err) => {
      console.warn("⚠️  Redis init failed:", err?.message ?? err);
    });

  // Database connection + warmup sau khi connect
  // (phần prisma.$connect đã gọi ở trên trong runWarmup)
}

start();
