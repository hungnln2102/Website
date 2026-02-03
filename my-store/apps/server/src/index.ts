import { createContext } from "@my-store/api/context";
import { appRouter } from "@my-store/api/routers/index";
import prisma from "@my-store/db";
import pool from "./config/database";
import { env } from "@my-store/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { DB_SCHEMA } from "./config/db.config";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger, responseTimeLogger } from "./middleware/logger";
import { generalLimiter, strictLimiter } from "./middleware/rateLimiter";
import {
  apiSecurityMiddleware,
  limitPayloadSize,
} from "./middleware/apiSecurity";
import { csrfProtection } from "./middleware/csrf";
import paymentRouter from "./routes/payment.route";
import variantDetailRouter from "./routes/variant-detail.route";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import cartRouter from "./routes/cart.route";
import topupRouter from "./routes/topup.route";

// Import cron job for auto-refresh materialized views
import "./jobs/refresh-variant-sold-count.job";
import "./jobs/refresh-product-sold-30d.job";

const app = express();

type RawProductRow = {
  id: number | bigint;
  id_product: string | number | bigint | null;
  package: string | null;
  package_product: string | null;
  pct_ctv: string | null;
  pct_khach: string | null;
  pct_promo: string | null;
  has_promo: boolean;
  is_active: boolean;
  price_max: string | null;
  sale_price: string | null;
  promo_price: string | null;
  package_count: number | bigint | null;
  sales_count: number | bigint | null;
  description: string | null;
  image_url: string | null;
};

type CategoryRow = {
  id: number;
  name: string;
  created_at: Date | string | null;
  color: string | null;
  product_ids: Array<number | bigint> | null;
};

type PackageProductRow = {
  id: number | bigint;
  package: string | null;
  package_product: string | null;
  id_product: string | null;
  cost: string | null;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripHtml = (value: string | null) => {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

const toNumber = (value: unknown) => {
  if (typeof value === "bigint") return Number(value);
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const resolveImageUrl = (url: string | null): string => {
  if (!url) return "https://placehold.co/600x400?text=No+Image";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = process.env.IMAGE_BASE_URL || "";
  if (base) return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
  return url;
};

// const withSchema = (key: keyof typeof DB_SCHEMA) =>
//   Prisma.raw(`${DB_SCHEMA[key].SCHEMA}.${DB_SCHEMA[key].TABLE}`);

const TABLES = {
  SUPPLIER_COST: `${DB_SCHEMA.SUPPLIER_COST.SCHEMA}.${DB_SCHEMA.SUPPLIER_COST.TABLE}`,
  PRICE_CONFIG: `${DB_SCHEMA.PRICE_CONFIG.SCHEMA}.${DB_SCHEMA.PRICE_CONFIG.TABLE}`,
  PRODUCT_DESC: `${DB_SCHEMA.PRODUCT_DESC.SCHEMA}.${DB_SCHEMA.PRODUCT_DESC.TABLE}`,
  CATEGORY: `${DB_SCHEMA.CATEGORY.SCHEMA}.${DB_SCHEMA.CATEGORY.TABLE}`,
  PRODUCT_CATEGORY: `${DB_SCHEMA.PRODUCT_CATEGORY.SCHEMA}.${DB_SCHEMA.PRODUCT_CATEGORY.TABLE}`,
  VARIANT: `${DB_SCHEMA.VARIANT.SCHEMA}.${DB_SCHEMA.VARIANT.TABLE}`,
  PRODUCT: `${DB_SCHEMA.PRODUCT.SCHEMA}.${DB_SCHEMA.PRODUCT.TABLE}`,
  ORDER_LIST: `${DB_SCHEMA.ORDER_LIST.SCHEMA}.${DB_SCHEMA.ORDER_LIST.TABLE}`,
  ORDER_EXPIRED: `${DB_SCHEMA.ORDER_EXPIRED.SCHEMA}.${DB_SCHEMA.ORDER_EXPIRED.TABLE}`,
} as const;

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

/*
// Response compression
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression
  }),
);
*/

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

app.get("/products", async (_req, res) => {
  try {
    const startedAt = Date.now();
    const query = `
      WITH supply_max AS (
        SELECT sc.product_id, MAX(sc.price::numeric) AS price_max
        FROM ${TABLES.SUPPLIER_COST} sc
        GROUP BY sc.product_id
      ),
      priced AS (
        SELECT
          p.id AS id,
          v.display_name AS id_product,
          p.package_name AS package,
          v.variant_name AS package_product,
          v.is_active AS is_active,
          COALESCE(pc.pct_ctv, 0) AS pct_ctv,
          COALESCE(pc.pct_khach, 0) AS pct_khach,
          pc.pct_promo AS pct_promo,
          (pc.pct_promo IS NOT NULL) AS has_promo,
          COALESCE(sm.price_max, 0) AS price_max,
          COALESCE(vsc.sales_count, 0) AS sales_count,
          pd.description,
          p.image_url AS image_url,
          p.created_at AS created_at
        FROM ${TABLES.VARIANT} v
        LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
        LEFT JOIN LATERAL (
          SELECT
            pc.pct_ctv,
            pc.pct_khach,
            pc.pct_promo
          FROM ${TABLES.PRICE_CONFIG} pc
          WHERE pc.variant_id = v.id
          ORDER BY pc.updated_at DESC NULLS LAST
          LIMIT 1
        ) pc ON TRUE
        LEFT JOIN supply_max sm ON sm.product_id = v.id
        LEFT JOIN product.variant_sold_count vsc
          ON vsc.variant_id = v.id
        LEFT JOIN ${TABLES.PRODUCT_DESC} pd
          ON TRIM(pd.product_id::text) = TRIM(SPLIT_PART(v.display_name::text, '--', 1))
        WHERE p.package_name IS NOT NULL
      ),
      ranked AS (
        SELECT
          priced.*,
          (COALESCE(priced.pct_ctv::numeric, 0) * priced.price_max * COALESCE(priced.pct_khach::numeric, 0))
            AS sale_price,
          (COALESCE(priced.pct_ctv::numeric, 0) * priced.price_max * COALESCE(priced.pct_khach::numeric, 0))
            * (1 - COALESCE(priced.pct_promo::numeric, 0)) AS promo_price,
          COALESCE(psc.total_sales_count, 0) AS package_sales_count,
          COALESCE(p30d.sold_count_30d, 0) AS sold_count_30d,
          ROW_NUMBER() OVER (
            PARTITION BY priced.package
            ORDER BY (COALESCE(priced.pct_ctv::numeric, 0) * priced.price_max * COALESCE(priced.pct_khach::numeric, 0)) ASC
          ) AS rn,
          COUNT(*) OVER (PARTITION BY priced.package) AS package_count,
          -- Check if ANY variant in this package is active (product is in stock if at least one variant is active)
          BOOL_OR(priced.is_active) OVER (PARTITION BY priced.package) AS has_active_variant
        FROM priced
        LEFT JOIN product.product_sold_count psc
          ON psc.package_name = priced.package
        LEFT JOIN product.product_sold_30d p30d
          ON p30d.product_id = priced.id
      )
      SELECT
        id,
        id_product,
        package,
        package_product,
        pct_ctv,
        pct_khach,
        pct_promo,
        has_promo,
        has_active_variant AS is_active,
        price_max,
        sale_price,
        promo_price,
        package_count,
        package_sales_count AS sales_count,
        sold_count_30d,
        description,
        image_url,
        created_at
      FROM ranked
      WHERE rn = 1
      ORDER BY package;
    `;
    const { rows } = await pool.query<RawProductRow>(query);
    console.log(`[products] rows=${rows.length} duration=${Date.now() - startedAt}ms`);
    console.log(`[products] promo_count=${rows.filter(r => r.has_promo).length}`);

    const products = rows.map((row) => {
      const name = row.package ?? row.id_product ?? "San pham";
      const basePrice = toNumber(row.sale_price);
      const discountPctRaw = toNumber(row.pct_promo);
      const discountPct = discountPctRaw > 1 ? discountPctRaw : discountPctRaw * 100;
      const packageCount = toNumber(row.package_count) || 1;
      const hasPromo = row.has_promo === true;

      return {
        id: toNumber(row.id),
        slug: slugify(name || `${row.id_product ?? row.id}`),
        name,
        package: row.package ?? "",
        package_product: row.package_product ?? null,
        description: stripHtml(row.description) || "Chưa có mô tả",
        image_url: resolveImageUrl(row.image_url),
        base_price: basePrice,
        discount_percentage: discountPct,
        has_promo: hasPromo,
        is_active: row.is_active !== false,
        sales_count: toNumber(row.sales_count),
        sold_count_30d: toNumber((row as any).sold_count_30d || 0),
        average_rating: 0,
        package_count: packageCount,
        created_at: (row as any).created_at || null,
      };
    });

    res.json({ data: products });
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/promotions", async (_req, res) => {
  try {
    const startedAt = Date.now();
    const query = `
      WITH supply_max AS (
        SELECT sc.product_id, MAX(sc.price::numeric) AS price_max
        FROM ${TABLES.SUPPLIER_COST} sc
        GROUP BY sc.product_id
      ),
      priced AS (
        SELECT
          p.id AS product_id,
          p.package_name AS package,
          v.id AS variant_id,
          v.variant_name AS package_product,
          v.display_name AS id_product,
          v.is_active AS is_active,
          COALESCE(pc.pct_ctv, 0) AS pct_ctv,
          COALESCE(pc.pct_khach, 0) AS pct_khach,
          pc.pct_promo AS pct_promo,
          COALESCE(sm.price_max, 0) AS price_max,
          COALESCE(vsc.sales_count, 0) AS sales_count,
          pd.description,
          p.image_url AS image_url
        FROM ${TABLES.VARIANT} v
        LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
        INNER JOIN LATERAL (
          SELECT
            pc.pct_ctv,
            pc.pct_khach,
            pc.pct_promo
          FROM ${TABLES.PRICE_CONFIG} pc
          WHERE pc.variant_id = v.id AND pc.pct_promo IS NOT NULL AND pc.pct_promo > 0
          ORDER BY pc.updated_at DESC NULLS LAST
          LIMIT 1
        ) pc ON TRUE
        LEFT JOIN supply_max sm ON sm.product_id = v.id
        LEFT JOIN product.variant_sold_count vsc ON vsc.variant_id = v.id
        LEFT JOIN ${TABLES.PRODUCT_DESC} pd ON TRIM(pd.product_id::text) = TRIM(SPLIT_PART(v.display_name::text, '--', 1))
        WHERE v.is_active = true
    )
    SELECT
      product_id,
      variant_id,
      package,
      package_product,
      id_product,
      pct_ctv,
      pct_khach,
      pct_promo,
      (COALESCE(pct_ctv::numeric, 0) * price_max * COALESCE(pct_khach::numeric, 0)) AS sale_price,
      (COALESCE(pct_ctv::numeric, 0) * price_max * COALESCE(pct_khach::numeric, 0)) * (1 - COALESCE(pct_promo::numeric, 0)) AS promo_price,
      sales_count,
      description,
      image_url
    FROM priced
    ORDER BY pct_promo DESC;
    `;
    const { rows } = await pool.query<any>(query);
    console.log(`[promotions] rows=${rows.length} duration=${Date.now() - startedAt}ms`);

    const promotions = rows.map((rowSummary: any) => {
      const name = rowSummary.package_product || rowSummary.package || "Khuyen mai";
      const basePrice = toNumber(rowSummary.sale_price);
      const discountPctRaw = toNumber(rowSummary.pct_promo);
      const discountPct = discountPctRaw > 1 ? discountPctRaw : discountPctRaw * 100;

      return {
        id: toNumber(rowSummary.product_id),
        variant_id: toNumber(rowSummary.variant_id),
        slug: slugify(rowSummary.package || String(rowSummary.product_id)),
        name,
        package: rowSummary.package ?? "",
        id_product: rowSummary.id_product,
        description: stripHtml(rowSummary.description) || "Khuyến mãi đặc biệt",
        image_url: resolveImageUrl(rowSummary.image_url),
        base_price: basePrice,
        discount_percentage: discountPct,
        has_promo: true,
        sales_count: toNumber(rowSummary.sales_count),
        average_rating: 0,
      };
    });

    res.json({ data: promotions });
  } catch (err) {
    console.error("Fetch promotions error:", err);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

app.get("/categories", async (_req, res) => {
  try {
    const startedAt = Date.now();
    const query = `
      SELECT
        c.id,
        c.name,
        c.created_at,
        c.color,
        COALESCE(
          ARRAY_AGG(DISTINCT p.id ORDER BY p.id)
            FILTER (WHERE p.package_name IS NOT NULL),
          ARRAY[]::int[]
        ) AS product_ids
      FROM ${TABLES.CATEGORY} c
      LEFT JOIN ${TABLES.PRODUCT_CATEGORY} pc ON pc.category_id = c.id
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = pc.product_id
      GROUP BY c.id, c.name, c.created_at, c.color
      ORDER BY c.id;
    `;

    const { rows } = await pool.query<CategoryRow>(query);
    console.log(`[categories] rows=${rows.length} duration=${Date.now() - startedAt}ms`);
    res.json({ data: rows });
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

const productPackagesHandler = async (req: express.Request, res: express.Response) => {
  const packageParam = (req.params.package as string | undefined)?.trim();
  const packageQuery = (req.query.package as string | undefined)?.trim();
  const packageName = packageParam || packageQuery;
  if (!packageName) {
    return res.status(400).json({ error: "Missing package parameter" });
  }

  try {
    const rows = await prisma.$queryRaw<any[]>`
      WITH supply_max AS (
        SELECT sc.product_id, MAX(sc.price::numeric) AS price_max
        FROM product.supplier_cost sc
        GROUP BY sc.product_id
      ),
      priced AS (
        SELECT
          v.id,
          p.package_name AS package,
          v.variant_name AS package_product,
          v.display_name AS id_product,
          v.created_at AS created_at,
          v.is_active AS is_active,
          COALESCE(pc.pct_ctv, 0) AS pct_ctv,
          COALESCE(pc.pct_khach, 0) AS pct_khach,
          pc.pct_promo,
          COALESCE(sm.price_max, 0) AS price_max,
          COALESCE(vsc.sales_count, 0) AS sold_count_30d,
          pd.description,
          pd.image_url,
          pd.rules as purchase_rules
        FROM product.variant v
        LEFT JOIN product.product p ON p.id = v.product_id
        LEFT JOIN LATERAL (
          SELECT pc.pct_ctv, pc.pct_khach, pc.pct_promo
          FROM product.price_config pc
          WHERE pc.variant_id = v.id
          ORDER BY pc.updated_at DESC NULLS LAST
          LIMIT 1
        ) pc ON TRUE
        LEFT JOIN supply_max sm ON sm.product_id = v.id
        LEFT JOIN product.variant_sold_count vsc ON vsc.variant_id = v.id
        LEFT JOIN product.product_desc pd ON 
          TRIM(pd.product_id::text) = TRIM(v.display_name::text)
          OR TRIM(pd.product_id::text) = TRIM(SPLIT_PART(v.display_name::text, '--', 1))
        WHERE p.package_name ILIKE ${packageName}
      )
      SELECT
        *,
        (COALESCE(pct_ctv::numeric, 0) * price_max * COALESCE(pct_khach::numeric, 0)) AS cost
      FROM priced
      WHERE package_product IS NOT NULL;
    `;

    // Deduplicate exact duplicates while keeping distinct duration variants.
    const dedup = new Map<string, PackageProductRow>();
    rows.forEach((row) => {
      const packageProductKey = (row.package_product ?? "").trim().toLowerCase();
      const idProductKey = (row.id_product ?? "").trim().toLowerCase();
      const costValue = toNumber(row.cost);
      const key = `${packageProductKey}-${idProductKey}-${costValue}`;
      if (!dedup.has(key)) {
        dedup.set(key, { 
          ...row, 
          cost: String(costValue),
          created_at: row.created_at || null,
          sold_count_30d: toNumber(row.sold_count_30d || 0),
          pct_promo: toNumber(row.pct_promo || 0),
          is_active: row.is_active !== false,
        });
      }
    });

    res.json({ data: Array.from(dedup.values()) });
  } catch (err) {
    console.error("Fetch product-packages error:", err);
    res.status(500).json({ error: "Failed to fetch product packages" });
  }
};

app.get("/product-packages/:package", strictLimiter, productPackagesHandler);
app.get("/product-packages", strictLimiter, productPackagesHandler);

// Debug endpoints - ONLY available in development mode
if (process.env.NODE_ENV !== 'production') {
  // Debug endpoint to test database connection
  app.get("/debug/db", async (_req, res) => {
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      res.json({ status: "ok", result });
    } catch (err) {
      console.error("Database test error:", err);
      res.status(500).json({ status: "error", error: String(err) });
    }
  });

  // Simple categories test without aggregation
  app.get("/debug/categories-simple", async (_req, res) => {
    try {
      const rows = await prisma.$queryRaw<CategoryRow[]>`
        SELECT c.id, c.name, c.created_at, c.color
        FROM product.category c
        ORDER BY c.id
        LIMIT 10;
      `;
      res.json({ status: "ok", count: rows.length, data: rows });
    } catch (err) {
      console.error("Simple categories test error:", err);
      res.status(500).json({ status: "error", error: String(err) });
    }
  });

  // Check database connections
  app.get("/debug/connections", async (_req, res) => {
    try {
      const connections = await prisma.$queryRaw<any[]>`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database();
      `;
      res.json({ status: "ok", data: connections[0] });
    } catch (err) {
      console.error("Check connections error:", err);
      res.status(500).json({ status: "error", error: String(err) });
    }
  });

  // Check table locks
  app.get("/debug/locks", async (_req, res) => {
    try {
      const locks = await prisma.$queryRaw<any[]>`
        SELECT 
          l.locktype,
          l.relation::regclass as table_name,
          l.mode,
          l.granted,
          a.usename,
          a.query,
          a.state
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.relation IS NOT NULL
        ORDER BY l.granted, l.relation
        LIMIT 20;
      `;
      res.json({ status: "ok", count: locks.length, data: locks });
    } catch (err) {
      console.error("Check locks error:", err);
      res.status(500).json({ status: "error", error: String(err) });
    }
  });
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
