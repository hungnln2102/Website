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
} as const;
