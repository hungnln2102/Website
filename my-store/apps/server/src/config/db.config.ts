/**
 * Database Schema Configuration
 *
 * Central registry of all database schemas, tables, and column mappings.
 * Organized by domain (product, orders, identity, customer, etc.).
 *
 * Usage:
 *   import { DB_SCHEMA, TABLES } from "./db.config";
 *   const { SCHEMA, TABLE, COLS } = DB_SCHEMA.PRODUCT;
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TableConfig = {
  SCHEMA: string;
  TABLE: string;
  COLS: Record<string, string>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema Resolution
// ─────────────────────────────────────────────────────────────────────────────

/** Pick the first non-empty value from env vars, with a fallback default. */
const pickSchema = (...candidates: Array<string | undefined | null>) =>
  candidates.find((value) => value && value.trim()) ?? "";

export const SCHEMA_PRODUCT       = pickSchema(process.env.DB_SCHEMA_PRODUCT,       process.env.SCHEMA_PRODUCT,       "product");
const        SCHEMA_PARTNER       = pickSchema(process.env.DB_SCHEMA_PARTNER,       process.env.SCHEMA_PARTNER,       "partner");
export const SCHEMA_SUPPLIER      = pickSchema(process.env.DB_SCHEMA_SUPPLIER,      process.env.SCHEMA_SUPPLIER,      SCHEMA_PARTNER, SCHEMA_PRODUCT);
export const SCHEMA_SUPPLIER_COST = pickSchema(process.env.DB_SCHEMA_SUPPLIER_COST, process.env.SCHEMA_SUPPLIER_COST, SCHEMA_PRODUCT, SCHEMA_PARTNER);
export const SCHEMA_ORDERS        = pickSchema(process.env.DB_SCHEMA_ORDERS,        process.env.SCHEMA_ORDERS,        "orders");
export const SCHEMA_IDENTITY      = pickSchema(process.env.DB_SCHEMA_IDENTITY,      process.env.SCHEMA_IDENTITY,      "identity");
export const SCHEMA_CUSTOMER      = pickSchema(process.env.DB_SCHEMA_CUSTOMER,      process.env.SCHEMA_CUSTOMER,      "customer");
export const SCHEMA_CART          = pickSchema(process.env.DB_SCHEMA_CART,           process.env.SCHEMA_CART,           "cart");
export const SCHEMA_WALLET        = pickSchema(process.env.DB_SCHEMA_WALLET,        process.env.SCHEMA_WALLET,        "wallet");
export const SCHEMA_REVIEW        = pickSchema(process.env.DB_SCHEMA_REVIEW,        process.env.SCHEMA_REVIEW,        "review");
export const SCHEMA_AUDIT         = pickSchema(process.env.DB_SCHEMA_AUDIT,         process.env.SCHEMA_AUDIT,         "audit");
export const SCHEMA_FORM_DESC     = pickSchema(process.env.DB_SCHEMA_FORM_DESC,     process.env.SCHEMA_FORM_DESC,     "form_desc");
export const SCHEMA_CYCLES       = pickSchema(process.env.DB_SCHEMA_CYCLES,        process.env.SCHEMA_CYCLES,        "cycles");
export const SCHEMA_ADMIN       = pickSchema(process.env.DB_SCHEMA_ADMIN,        process.env.SCHEMA_ADMIN,        "admin");
export const SCHEMA_FINANCE     = pickSchema(process.env.DB_SCHEMA_FINANCE,      process.env.SCHEMA_FINANCE,      "finance");
export const SCHEMA_PROMOTION   = pickSchema(process.env.DB_SCHEMA_PROMOTION,    process.env.SCHEMA_PROMOTION,    "promotion");
// ─────────────────────────────────────────────────────────────────────────────
// Table & Column Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const DB_SCHEMA: Record<string, TableConfig> = {

  // ── Product ───────────────────────────────────────────────────────────────

  PRODUCT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "product",
    COLS: {
      ID: "id",
      CATEGORY_ID: "category_id",
      PACKAGE_NAME: "package_name",
      IMAGE_URL: "image_url",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
      IS_ACTIVE: "is_active",
    },
  },

  DESC_VARIANT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "desc_variant",
    COLS: {
      ID: "id",
      RULES: "rules",
      DESCRIPTION: "description",
      SHORT_DESC: "short_desc",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },

  VARIANT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "variant",
    COLS: {
      ID: "id",
      PRODUCT_ID: "product_id",
      VARIANT_NAME: "variant_name",
      DISPLAY_NAME: "display_name",
      FORM_ID: "form_id",
      IS_ACTIVE: "is_active",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
      DESC_VARIANT_ID: "id_desc",
      IMAGE_URL: "image_url",
      BASE_PRICE: "base_price",
      /** Legacy: margin nằm ở variant_margin + pricing_tier (admin_orderlist), không còn cột trên variant. */
      PCT_CTV: "pct_ctv",
      PCT_KHACH: "pct_khach",
      PCT_PROMO: "pct_promo",
      PCT_STU: "pct_stu",
    },
  },

  /** Bậc giá (ctv, customer, promo, student, …) — đồng bộ admin_orderlist */
  PRICING_TIER: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "pricing_tier",
    COLS: {
      ID: "id",
      KEY: "key",
      PREFIX: "prefix",
      LABEL: "label",
      PRICING_RULE: "pricing_rule",
      BASE_TIER_KEY: "base_tier_key",
      SORT_ORDER: "sort_order",
      IS_ACTIVE: "is_active",
      CREATED_AT: "created_at",
    },
  },

  /** Biên độ margin theo từng variant + tier */
  VARIANT_MARGIN: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "variant_margin",
    COLS: {
      VARIANT_ID: "variant_id",
      TIER_ID: "tier_id",
      MARGIN_RATIO: "margin_ratio",
    },
  },

  CATEGORY: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "category",
    COLS: {
      ID: "id",
      NAME: "name",
      COLOR: "color",
      CREATED_AT: "created_at",
    },
  },

  PRODUCT_CATEGORY: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "product_category",
    COLS: {
      PRODUCT_ID: "product_id",
      CATEGORY_ID: "category_id",
    },
  },

  SUPPLIER_COST: {
    SCHEMA: SCHEMA_SUPPLIER_COST,
    TABLE: "supplier_cost",
    COLS: {
      ID: "id",
      VARIANT_ID: "variant_id",
      SUPPLIER_ID: "supplier_id",
      PRICE: "price",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },

  /** Materialized view: thống kê bán 30 ngày theo product_id */
  PRODUCT_SOLD_30D: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "product_sold_30d",
    COLS: {
      PRODUCT_ID: "product_id",
      PACKAGE_NAME: "package_name",
      SOLD_COUNT_30D: "sold_count_30d",
      REVENUE_30D: "revenue_30d",
      UPDATED_AT: "updated_at",
    },
  },

  /**
   * Alias bảng product.desc_variant (nội dung mô tả dùng chung; variant.id_desc → desc_variant.id).
   */
  PRODUCT_DESC: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "desc_variant",
    COLS: {
      ID: "id",
      DESCRIPTION: "description",
      SHORT_DESC: "short_desc",
      RULES: "rules",
      UPDATED_AT: "updated_at",
    },
  },

  /** Materialized view: tổng số đã bán theo package */
  PRODUCT_SOLD_COUNT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "product_sold_count",
    COLS: {
      PRODUCT_ID: "product_id",
      PACKAGE_NAME: "package_name",
      TOTAL_SALES_COUNT: "total_sales_count",
      UPDATED_AT: "updated_at",
    },
  },

  /** Materialized view: số đã bán theo từng variant */
  VARIANT_SOLD_COUNT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "variant_sold_count",
    COLS: {
      VARIANT_DISPLAY_NAME: "variant_display_name",
      VARIANT_ID: "variant_id",
      PRODUCT_ID: "product_id",
      SALES_COUNT: "sales_count",
      UPDATED_AT: "updated_at",
    },
  },

  /** Bảng thanh toán theo product_id (amount, promotion_percent). product_id = PK, is_active = true mới hiển thị. */
  PRODUCTID_PAYMENT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "productid_payment",
    COLS: {
      PRODUCT_ID: "product_id",
      AMOUNT: "amount",
      PROMOTION_PERCENT: "promotion_percent",
      IS_ACTIVE: "is_active",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },

  /** Tồn kho sản phẩm (admin_orderlist) */
  PRODUCT_STOCK: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "product_stocks",
    COLS: {
      ID: "id",
      PRODUCT_TYPE: "product_type",
      ACCOUNT_USERNAME: "account_username",
      BACKUP_EMAIL: "backup_email",
      PASSWORD_ENCRYPTED: "password_encrypted",
      TWO_FA_ENCRYPTED: "two_fa_encrypted",
      STATUS: "status",
      EXPIRES_AT: "expires_at",
      IS_VERIFIED: "is_verified",
      NOTE: "note",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },

  /** Gói sản phẩm (admin_orderlist) */
  PACKAGE_PRODUCT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "package_product",
    COLS: {
      ID: "id",
      PACKAGE_ID: "package_id",
      SUPPLIER: "supplier",
      COST: "cost",
      SLOT: "slot",
      MATCH: "match",
      STOCK_ID: "stock_id",
      STORAGE_ID: "storage_id",
      STORAGE_TOTAL: "storage_total",
    },
  },

  // ── Partner / Supplier (admin_orderlist) ───────────────────────────────────

  SUPPLIER: {
    SCHEMA: SCHEMA_PARTNER,
    TABLE: "supplier",
    COLS: {
      ID: "id",
      SUPPLIER_NAME: "supplier_name",
      NUMBER_BANK: "number_bank",
      BIN_BANK: "bin_bank",
      ACTIVE_SUPPLY: "active_supply",
    },
  },

  SUPPLIER_PAYMENTS: {
    SCHEMA: SCHEMA_PARTNER,
    TABLE: "supplier_payments",
    COLS: {
      ID: "id",
      SOURCE_ID: "supplier_id",
      IMPORT_VALUE: "total_amount",
      ROUND: "payment_period",
      STATUS: "payment_status",
      PAID: "amount_paid",
    },
  },

  // ── Admin (admin_orderlist) ────────────────────────────────────────────────

  ADMIN_USERS: {
    SCHEMA: SCHEMA_ADMIN,
    TABLE: "users",
    COLS: {
      ID: "userid",
      USERNAME: "username",
      PASSWORD: "passwordhash",
      ROLE: "role",
      CREATED_AT: "createdat",
    },
  },

  // ── Finance (admin_orderlist) ───────────────────────────────────────────────

  MASTER_WALLET_TYPES: {
    SCHEMA: SCHEMA_FINANCE,
    TABLE: "master_wallettypes",
    COLS: {
      ID: "id",
      WALLET_NAME: "wallet_name",
      NOTE: "note",
      ASSET_CODE: "asset_code",
      IS_INVESTMENT: "is_investment",
      LINKED_WALLET_ID: "linked_wallet_id",
    },
  },

  TRANS_DAILY_BALANCES: {
    SCHEMA: SCHEMA_FINANCE,
    TABLE: "trans_dailybalances",
    COLS: {
      ID: "id",
      RECORD_DATE: "record_date",
      WALLET_ID: "wallet_id",
      AMOUNT: "amount",
    },
  },

  SAVING_GOALS: {
    SCHEMA: SCHEMA_FINANCE,
    TABLE: "saving_goals",
    COLS: {
      ID: "id",
      GOAL_NAME: "goal_name",
      TARGET_AMOUNT: "target_amount",
      PRIORITY: "priority",
      CREATED_AT: "created_at",
    },
  },

  // ── Promotion (admin_orderlist) ─────────────────────────────────────────────

  ACCOUNT_PROMOTIONS: {
    SCHEMA: SCHEMA_PROMOTION,
    TABLE: "account_promotions",
    COLS: {
      ID: "id",
      ACCOUNT_ID: "account_id",
      PROMOTION_ID: "promotion_id",
      STATUS: "status",
      ASSIGNED_AT: "assigned_at",
      USED_AT: "used_at",
      USAGE_LIMIT_PER_USER: "usage_limit_per_user",
    },
  },

  PROMOTION_CODES: {
    SCHEMA: SCHEMA_PROMOTION,
    TABLE: "promotion_codes",
    COLS: {
      ID: "id",
      CODE: "code",
      DISCOUNT_PERCENT: "discount_percent",
      MAX_DISCOUNT_AMOUNT: "max_discount_amount",
      MIN_ORDER_AMOUNT: "min_order_amount",
      DESCRIPTION: "description",
      STATUS: "status",
      IS_PUBLIC: "is_public",
      USAGE_LIMIT: "usage_limit",
      USED_COUNT: "used_count",
      START_AT: "start_at",
      END_AT: "end_at",
      CREATED_AT: "created_at",
    },
  },

  // ── Form Desc ─────────────────────────────────────────────────────────────

  FORM_NAME: {
    SCHEMA: SCHEMA_FORM_DESC,
    TABLE: "form_name",
    COLS: {
      ID: "id",
      NAME: "name",
      DESCRIPTION: "description",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },

  FORM_INPUT: {
    SCHEMA: SCHEMA_FORM_DESC,
    TABLE: "form_input",
    COLS: {
      ID: "id",
      FORM_ID: "form_id",
      INPUT_ID: "input_id",
      SORT_ORDER: "sort_order",
    },
  },

  INPUTS: {
    SCHEMA: SCHEMA_FORM_DESC,
    TABLE: "inputs",
    COLS: {
      ID: "id",
      INPUT_NAME: "input_name",
      INPUT_TYPE: "input_type",
      CREATED_AT: "created_at",
    },
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  // order_list (đồng bộ admin_orderlist): id_product = varchar — thường là
  // product.variant.variant_name (MV sales join theo tên); có thể lưu chuỗi số id khi migrate từ hệ cũ.

  ORDER_LIST: {
    SCHEMA: SCHEMA_ORDERS,
    TABLE: "order_list",
    COLS: {
      ID: "id",
      ID_ORDER: "id_order",
      ID_PRODUCT: "id_product",       // varchar — variant_name hoặc id dạng text
      INFORMATION_ORDER: "information_order",
      CUSTOMER: "customer",
      CONTACT: "contact",
      SLOT: "slot",
      ORDER_DATE: "order_date",       // date
      DAYS: "days",                   // int4 — số ngày gói
      EXPIRED_AT: "expired_at",        // date, ngày hết hạn
      SUPPLY_ID: "supply_id",         // int4, id của partner.supplier
      COST: "cost",                   // numeric
      PRICE: "price",                 // numeric
      NOTE: "note",
      STATUS: "status",
      REFUND: "refund",               // numeric
      CANCELED_AT: "canceled_at",     // timestamptz
    },
  },

  PAYMENT_RECEIPT: {
    SCHEMA: SCHEMA_ORDERS,
    TABLE: "payment_receipt",
    COLS: {
      ID: "id",
      ORDER_CODE: "id_order",
      PAID_DATE: "payment_date",
      AMOUNT: "amount",
      RECEIVER: "receiver",
      NOTE: "note",
      SENDER: "sender",
    },
  },

  REFUND: {
    SCHEMA: SCHEMA_ORDERS,
    TABLE: "refund",
    COLS: {
      ID: "id",
      ORDER_CODE: "ma_don_hang",
      PAID_DATE: "ngay_thanh_toan",
      AMOUNT: "so_tien",
    },
  },

  ORDER_CUSTOMER: {
    SCHEMA: SCHEMA_ORDERS,
    TABLE: "order_customer",
    COLS: {
      ID_ORDER: "id_order",
      ACCOUNT_ID: "account_id",
      STATUS: "status",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
      PAYMENT_ID: "payment_id",
    },
  },

  // ── Identity ──────────────────────────────────────────────────────────────

  ACCOUNT: {
    SCHEMA: SCHEMA_IDENTITY,
    TABLE: "accounts",
    COLS: {
      ID: "id",
      USERNAME: "username",
      EMAIL: "email",
      PASSWORD_HASH: "password_hash",
      IS_ACTIVE: "is_active",
      SUSPENDED_UNTIL: "suspended_until",
      BAN_REASON: "ban_reason",
      UPDATED_AT: "updated_at",
      CREATED_AT: "created_at",
      ROLE_ID: "role_id",
      MAIL_BACKUP_ID: "mail_backup_id",
    },
  },

  /** Vai trò tài khoản: cột code (MAVC, MAVL, …) — bảng phổ biến `identity.roles`. */
  ROLES: {
    SCHEMA: SCHEMA_IDENTITY,
    TABLE: "roles",
    COLS: {
      ID: "id",
      CODE: "code",
      NAME: "name",
    },
  },


  PASSWORD_HISTORY: {
    SCHEMA: SCHEMA_IDENTITY,
    TABLE: "password_history",
    COLS: {
      ID: "id",
      USER_ID: "user_id",
      PASSWORD_HASH: "password_hash",
      CREATED_AT: "created_at",
    },
  },

  REFRESH_TOKEN: {
    SCHEMA: SCHEMA_IDENTITY,
    TABLE: "refresh_tokens",
    COLS: {
      ID: "id",
      USER_ID: "user_id",
      TOKEN_HASH: "token_hash",
      DEVICE_INFO: "device_info",
      IP_ADDRESS: "ip_address",
      EXPIRES_AT: "expires_at",
      CREATED_AT: "created_at",
      REVOKED_AT: "revoked_at",
    },
  },

  // ── Customer ──────────────────────────────────────────────────────────────

  CUSTOMER_PROFILES: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "customer_profiles",
    COLS: {
      ID: "id",
      ACCOUNT_ID: "account_id",
      TIER_ID: "tier_id",
      FIRST_NAME: "first_name",
      LAST_NAME: "last_name",
      DATE_OF_BIRTH: "date_of_birth",
      DATE_OF_BIRTH_CHANGED_AT: "date_of_birth_changed_at",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },

  /** Thống kê tổng chi tiêu và chi tiêu 6 tháng của tài khoản */
  CUSTOMER_SPEND_STATS: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "customer_spend_stats",
    COLS: {
      ACCOUNT_ID: "account_id",
      LIFETIME_SPEND: "lifetime_spend",
      SPEND_6M: "spend_6m",
      UPDATED_AT: "updated_at",
    },
  },

  CUSTOMER_TYPE_HISTORY: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "customer_type_history",
    COLS: {
      ID: "id",
      ACCOUNT_ID: "account_id",
      PERIOD_START: "period_start",
      PERIOD_END: "period_end",
      PREVIOUS_TYPE: "previous_type",
      NEW_TYPE: "new_type",
      TOTAL_SPEND: "total_spend",
      EVALUATED_AT: "evaluated_at",
    },
  },

  CUSTOMER_TIERS: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "customer_tiers",
    COLS: {
      ID: "id",
      NAME: "name",
      MIN_TOTAL_SPEND: "min_total_spend",
    },
  },

  // ── Cycles (chu kỳ tier — dùng chung cho mọi account) ─────────────────────────

  /** Chu kỳ: start_at, end_at. Thời gian hiện tại nằm trong [start_at, end_at] của bản ghi nào thì đó là chu kỳ hiện tại. */
  TIER_CYCLES: {
    SCHEMA: SCHEMA_CYCLES,
    TABLE: "tier_cycles",
    COLS: {
      ID: "id",
      CYCLE_START_AT: "cycle_start_at",
      CYCLE_END_AT: "cycle_end_at",
      STATUS: "status",
      CREATED_AT: "created_at",
    },
  },

  // ── Cart ───────────────────────────────────────────────────────────────────
  // cart.cart_items: id (int PK, SERIAL/IDENTITY auto-generated), account_id (int4 FK), variant_id (text/int FK),
  // quantity (int4), extra_info (jsonb), created_at, updated_at, price_type (varchar: retail|promo|ctv).
  // UNIQUE(account_id, variant_id) cho INSERT ... ON CONFLICT.
  CART_ITEMS: {
    SCHEMA: SCHEMA_CART,
    TABLE: "cart_items",
    COLS: {
      ID: "id",
      ACCOUNT_ID: "account_id",
      VARIANT_ID: "variant_id",
      QUANTITY: "quantity",
      EXTRA_INFO: "extra_info",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
      PRICE_TYPE: "price_type",
    },
  },

  // ── Wallet ─────────────────────────────────────────────────────────────────

  WALLET: {
    SCHEMA: SCHEMA_WALLET,
    TABLE: "wallets",
    COLS: {
      ACCOUNT_ID: "account_id",
      BALANCE: "balance",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },

  WALLET_TRANSACTION: {
    SCHEMA: SCHEMA_WALLET,
    TABLE: "wallet_transactions",
    COLS: {
      ID: "id",
      TRANSACTION_ID: "transaction_id",
      ACCOUNT_ID: "account_id",
      TYPE: "type",
      DIRECTION: "direction",
      AMOUNT: "amount",
      BALANCE_BEFORE: "balance_before",
      BALANCE_AFTER: "balance_after",
      PROMO_CODE: "promo_code",
      PROMOTION_ID: "promotion_id",
      BONUS_APPLIED: "bonus_applied",
      CREATED_AT: "created_at",
      METHOD: "method",
    },
  },

  // ── Review ─────────────────────────────────────────────────────────────────

  REVIEW: {
    SCHEMA: SCHEMA_REVIEW,
    TABLE: "reviews",
    COLS: {
      ID: "id",
      ACCOUNT_ID: "account_id",
      PRODUCT_ID: "product_id",
      RATING: "rating",
      COMMENT: "comment",
      CREATED_AT: "created_at",
    },
  },

  // ── Audit ──────────────────────────────────────────────────────────────────

  AUDIT_LOG: {
    SCHEMA: SCHEMA_AUDIT,
    TABLE: "audit_logs",
    COLS: {
      ID: "id",
      USER_ID: "user_id",
      ACTION: "action",
      RESOURCE_TYPE: "resource_type",
      RESOURCE_ID: "resource_id",
      IP_ADDRESS: "ip_address",
      USER_AGENT: "user_agent",
      DETAILS: "details",
      STATUS: "status",
      CREATED_AT: "created_at",
    },
  },

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Shorthand Table Identifiers  (schema.table)
// ─────────────────────────────────────────────────────────────────────────────

const t = (key: string) => `${DB_SCHEMA[key]!.SCHEMA}.${DB_SCHEMA[key]!.TABLE}`;

export const TABLES = {
  // Product
  PRODUCT:            t("PRODUCT"),
  DESC_VARIANT:       t("DESC_VARIANT"),
  VARIANT:            t("VARIANT"),
  PRICING_TIER:       t("PRICING_TIER"),
  VARIANT_MARGIN:   t("VARIANT_MARGIN"),
  CATEGORY:           t("CATEGORY"),
  PRODUCT_CATEGORY:   t("PRODUCT_CATEGORY"),
  SUPPLIER_COST:      t("SUPPLIER_COST"),
  PRODUCT_SOLD_30D:   t("PRODUCT_SOLD_30D"),
  PRODUCT_SOLD_COUNT: t("PRODUCT_SOLD_COUNT"),
  VARIANT_SOLD_COUNT: t("VARIANT_SOLD_COUNT"),
  PRODUCT_DESC:       t("PRODUCT_DESC"),
  PRODUCTID_PAYMENT:  t("PRODUCTID_PAYMENT"),
  PRODUCT_STOCK:      t("PRODUCT_STOCK"),
  PACKAGE_PRODUCT:    t("PACKAGE_PRODUCT"),
  // Partner / Supplier
  SUPPLIER:           t("SUPPLIER"),
  SUPPLIER_PAYMENTS:  t("SUPPLIER_PAYMENTS"),
  // Orders
  ORDER_LIST:         t("ORDER_LIST"),
  ORDER_CUSTOMER:     t("ORDER_CUSTOMER"),
  PAYMENT_RECEIPT:    t("PAYMENT_RECEIPT"),
  REFUND:             t("REFUND"),
  // Admin
  ADMIN_USERS:        t("ADMIN_USERS"),
  // Finance
  MASTER_WALLET_TYPES:  t("MASTER_WALLET_TYPES"),
  TRANS_DAILY_BALANCES: t("TRANS_DAILY_BALANCES"),
  SAVING_GOALS:       t("SAVING_GOALS"),
  // Promotion
  ACCOUNT_PROMOTIONS: t("ACCOUNT_PROMOTIONS"),
  PROMOTION_CODES:    t("PROMOTION_CODES"),
  // Form Desc
  FORM_NAME:          t("FORM_NAME"),
  FORM_INPUT:         t("FORM_INPUT"),
  INPUTS:             t("INPUTS"),
  // Identity
  ACCOUNT:            t("ACCOUNT"),
  ROLES:              t("ROLES"),
  PASSWORD_HISTORY:   t("PASSWORD_HISTORY"),
  REFRESH_TOKEN:      t("REFRESH_TOKEN"),
  // Customer
  CUSTOMER_PROFILES:      t("CUSTOMER_PROFILES"),
  CUSTOMER_SPEND_STATS:   t("CUSTOMER_SPEND_STATS"),
  CUSTOMER_TYPE_HISTORY:  t("CUSTOMER_TYPE_HISTORY"),
  CUSTOMER_TIERS:         t("CUSTOMER_TIERS"),
  // Cycles
  TIER_CYCLES:        t("TIER_CYCLES"),
  // Cart
  CART_ITEMS:         t("CART_ITEMS"),
  // Wallet
  WALLET:             t("WALLET"),
  WALLET_TRANSACTION: t("WALLET_TRANSACTION"),
  // Review
  REVIEW:             t("REVIEW"),
  // Audit
  AUDIT_LOG:          t("AUDIT_LOG"),
} as const;
