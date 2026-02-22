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

import { errorHandler } from "./middleware/errorHandler";
import { requestLogger, responseTimeLogger } from "./middleware/logger";
import { generalLimiter } from "./middleware/rateLimiter";
import {
  apiSecurityMiddleware,
  limitPayloadSize,
} from "./middleware/api-security";
import { csrfProtection } from "./middleware/csrf";
import paymentRouter from "./routes/payment.route";
import variantDetailRouter from "./routes/variant-detail.route";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import cartRouter from "./routes/cart.route";
import topupRouter from "./routes/topup.route";
import formRouter from "./routes/form.route";
import productsRouter from "./routes/products.route";
import debugRouter from "./routes/debug.route";

// Import cron job for auto-refresh materialized views
import "./jobs/refresh-variant-sold-count.job";
import "./jobs/refresh-product-sold-30d.job";

// Import cron job for customer tier cycle reset (23:59 on Jun 30 & Dec 31)
import "./jobs/reset-customer-tier-cycle.job";

const app = express();

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

// Health check endpoint
app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

// Security.txt endpoint (RFC 9116)
app.get("/.well-known/security.txt", (_req, res) => {
  res.type("text/plain").send(`# Security Policy
Contact: security@example.com
Policy: https://example.com/security-policy
Preferred-Languages: en, vi
Expires: 2027-01-31T00:00:00.000Z
`);
});

// Error handler middleware (must be last)
app.use(errorHandler);

import { initRedis } from "./config/redis";

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  // Initialize Redis (optional - falls back to in-memory if not available)
  const redisConnected = await initRedis();
  if (redisConnected) {
    console.log("✅ Redis connected - using distributed caching");
  } else {
    console.log("⚠️  Redis not available - using in-memory fallback");
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  prisma
    .$connect()
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.error("Database connection error:", err);
    });
}

start();
