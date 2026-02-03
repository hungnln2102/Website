// Database schema constants. Add connection settings/ORM config separately when ready.

type TableConfig = {
  SCHEMA: string;
  TABLE: string;
  COLS: Record<string, string>;
};

const pickSchema = (...candidates: Array<string | undefined | null>) =>
  candidates.find((value) => value && value.trim()) ?? "";

export const SCHEMA_PRODUCT = pickSchema(
  process.env.DB_SCHEMA_PRODUCT,
  process.env.SCHEMA_PRODUCT,
  "product",
);

const SCHEMA_PARTNER = pickSchema(
  process.env.DB_SCHEMA_PARTNER,
  process.env.SCHEMA_PARTNER,
  "partner",
);

export const SCHEMA_SUPPLIER = pickSchema(
  process.env.DB_SCHEMA_SUPPLIER,
  process.env.SCHEMA_SUPPLIER,
  SCHEMA_PARTNER,
  SCHEMA_PRODUCT,
);

export const SCHEMA_SUPPLIER_COST = pickSchema(
  process.env.DB_SCHEMA_SUPPLIER_COST,
  process.env.SCHEMA_SUPPLIER_COST,
  SCHEMA_PRODUCT,
  SCHEMA_PARTNER,
);

export const SCHEMA_ORDERS = pickSchema(
  process.env.DB_SCHEMA_ORDERS,
  process.env.SCHEMA_ORDERS,
  "orders",
);

export const SCHEMA_CUSTOMER = pickSchema(
  process.env.DB_SCHEMA_CUSTOMER,
  process.env.SCHEMA_CUSTOMER,
  "customer",
);

export const DB_SCHEMA: Record<string, TableConfig> = {
  PRODUCT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "product",
    COLS: {
      ID: "id",
      CATEGORY_ID: "category_id",
      PACKAGE_NAME: "package_name",
    },
  },
  VARIANT: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "variant",
    COLS: {
      ID: "id",
      PRODUCT_ID: "product_id",
      VARIANT_NAME: "variant_name",
      IS_ACTIVE: "is_active",
      DISPLAY_NAME: "display_name",
    },
  },
  PRICE_CONFIG: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "price_config",
    COLS: {
      ID: "id",
      VARIANT_ID: "variant_id",
      PCT_CTV: "pct_ctv",
      PCT_KHACH: "pct_khach",
      PCT_PROMO: "pct_promo",
      UPDATED_AT: "updated_at",
    },
  },
  PRODUCT_DESC: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "product_desc",
    COLS: {
      ID: "id",
      PRODUCT_ID: "product_id",
      RULES: "rules",
      DESCRIPTION: "description",
      IMAGE_URL: "image_url",
    },
  },
  CATEGORY: {
    SCHEMA: SCHEMA_PRODUCT,
    TABLE: "category",
    COLS: {
      ID: "id",
      NAME: "name",
      CREATED_AT: "created_at",
      COLOR: "color",
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
      PRODUCT_ID: "product_id",
      SUPPLIER_ID: "supplier_id",
      PRICE: "price",
    },
  },
  ORDER_LIST: {
    SCHEMA: SCHEMA_ORDERS,
    TABLE: "order_list",
    COLS: {
      ID: "id",
      ID_PRODUCT: "id_product",
    },
  },
  ORDER_EXPIRED: {
    SCHEMA: SCHEMA_ORDERS,
    TABLE: "order_expired",
    COLS: {
      ID: "id",
      ID_PRODUCT: "id_product",
    },
  },
  ACCOUNT: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "accounts",
    COLS: {
      ID: "id",
      USERNAME: "username",
      EMAIL: "email",
      PASSWORD_HASH: "password_hash",
      FIRST_NAME: "first_name",
      LAST_NAME: "last_name",
      IS_ACTIVE: "is_active",
      CREATED_AT: "created_at",
    },
  },
  REVIEW: {
    SCHEMA: SCHEMA_CUSTOMER,
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
  REFRESH_TOKEN: {
    SCHEMA: SCHEMA_CUSTOMER,
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
  AUDIT_LOG: {
    SCHEMA: SCHEMA_CUSTOMER,
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
  /**
   * Password History Table
   * Stores hashed passwords to prevent reuse
   * 
   * SQL:
   * CREATE TABLE customer.password_history (
   *   id SERIAL PRIMARY KEY,
   *   user_id INTEGER NOT NULL REFERENCES customer.accounts(id) ON DELETE CASCADE,
   *   password_hash VARCHAR(255) NOT NULL,
   *   created_at TIMESTAMP DEFAULT NOW()
   * );
   * CREATE INDEX idx_password_history_user_id ON customer.password_history(user_id);
   */
  PASSWORD_HISTORY: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "password_history",
    COLS: {
      ID: "id",
      USER_ID: "user_id",
      PASSWORD_HASH: "password_hash",
      CREATED_AT: "created_at",
    },
  },
  /**
   * Wallet Table
   * Stores customer balance
   * 
   * SQL:
   * CREATE TABLE customer.wallets (
   *   account_id INTEGER PRIMARY KEY REFERENCES customer.accounts(id) ON DELETE CASCADE,
   *   balance BIGINT NOT NULL DEFAULT 0,
   *   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
   *   updated_at TIMESTAMP NOT NULL DEFAULT NOW()
   * );
   */
  WALLET: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "wallets",
    COLS: {
      ACCOUNT_ID: "account_id",
      BALANCE: "balance",
      CREATED_AT: "created_at",
      UPDATED_AT: "updated_at",
    },
  },
  /**
   * Wallet Transactions Table
   * Stores balance change history (topup, purchase, refund, adjust)
   * 
   * SQL:
   * CREATE TABLE customer.wallet_transactions (
   *   id TEXT PRIMARY KEY,
   *   account_id INTEGER NOT NULL REFERENCES customer.accounts(id) ON DELETE CASCADE,
   *   type VARCHAR(20) NOT NULL,        -- TOPUP | PURCHASE | REFUND | ADJUST
   *   direction VARCHAR(10) NOT NULL,   -- CREDIT | DEBIT
   *   amount BIGINT NOT NULL,
   *   balance_before BIGINT NOT NULL,
   *   balance_after BIGINT NOT NULL,
   *   ref_type VARCHAR(30),
   *   ref_id TEXT,
   *   description TEXT,
   *   created_at TIMESTAMP NOT NULL DEFAULT NOW()
   * );
   * CREATE INDEX idx_wallet_tx_account ON customer.wallet_transactions(account_id);
   */
  WALLET_TRANSACTION: {
    SCHEMA: SCHEMA_CUSTOMER,
    TABLE: "wallet_transactions",
    COLS: {
      ID: "id",
      ACCOUNT_ID: "account_id",
      TYPE: "type",
      DIRECTION: "direction",
      AMOUNT: "amount",
      BALANCE_BEFORE: "balance_before",
      BALANCE_AFTER: "balance_after",
      REF_TYPE: "ref_type",
      REF_ID: "ref_id",
      DESCRIPTION: "description",
      CREATED_AT: "created_at",
    },
  },
} as const;
