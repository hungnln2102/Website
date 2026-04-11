/**
 * Kiểm tra schema / MV phục vụ GET /products và /promotions (mục 1.1 backlog).
 */
import prisma from "@my-store/db";
import { TABLES } from "../../config/db.config";

export type CatalogCheckItem = {
  id: string;
  qualified: string;
  kind: "base_table" | "matview" | "function";
  ok: boolean;
  note?: string;
};

function splitQualified(qualified: string): { schema: string; name: string } {
  const parts = qualified.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid qualified identifier: ${qualified}`);
  }
  return { schema: parts[0], name: parts[1] };
}

async function existsBaseTable(schema: string, name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM information_schema.tables
    WHERE table_schema = ${schema}
      AND table_name = ${name}
      AND table_type = 'BASE TABLE'
  `;
  return Number(rows[0]?.c ?? 0) > 0;
}

async function existsMatview(schema: string, name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM pg_matviews
    WHERE schemaname = ${schema}
      AND matviewname = ${name}
  `;
  return Number(rows[0]?.c ?? 0) > 0;
}

async function existsFunction(schema: string, name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = ${schema}
      AND p.proname = ${name}
  `;
  return Number(rows[0]?.c ?? 0) > 0;
}

async function countRows(qualified: string): Promise<number | null> {
  try {
    const { schema, name } = splitQualified(qualified);
    const rows = await prisma.$queryRawUnsafe<{ n: string }[]>(
      `SELECT COUNT(*)::text AS n FROM "${schema}"."${name}"`,
    );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return null;
  }
}

/**
 * Danh sách đối tượng bắt buộc cho pipeline giá + catalog (khớp products-list / promotions SQL).
 */
export async function getCatalogSchemaReport(): Promise<{
  catalogReady: boolean;
  items: CatalogCheckItem[];
  rowCounts: Record<string, number | null>;
  refreshFunctions: CatalogCheckItem[];
}> {
  const baseTables: { id: string; qualified: string }[] = [
    { id: "pricing_tier", qualified: TABLES.PRICING_TIER },
    { id: "variant_margin", qualified: TABLES.VARIANT_MARGIN },
    { id: "supplier_cost", qualified: TABLES.SUPPLIER_COST },
  ];

  const matviews: { id: string; qualified: string }[] = [
    { id: "variant_sold_count", qualified: TABLES.VARIANT_SOLD_COUNT },
    { id: "product_sold_count", qualified: TABLES.PRODUCT_SOLD_COUNT },
    { id: "product_sold_30d", qualified: TABLES.PRODUCT_SOLD_30D },
  ];

  const items: CatalogCheckItem[] = [];

  for (const { id, qualified } of baseTables) {
    const { schema, name } = splitQualified(qualified);
    const ok = await existsBaseTable(schema, name);
    items.push({
      id,
      qualified,
      kind: "base_table",
      ok,
      note: ok ? undefined : "Thiếu bảng — chạy migration / đồng bộ schema admin_orderlist",
    });
  }

  for (const { id, qualified } of matviews) {
    const { schema, name } = splitQualified(qualified);
    const ok = await existsMatview(schema, name);
    items.push({
      id,
      qualified,
      kind: "matview",
      ok,
      note: ok ? undefined : "Thiếu materialized view — chạy all_migrations.sql và REFRESH",
    });
  }

  const refreshFunctions: CatalogCheckItem[] = [
    {
      id: "refresh_variant_sold_count",
      qualified: "product.refresh_variant_sold_count",
      kind: "function",
      ok: await existsFunction("product", "refresh_variant_sold_count"),
      note: "Gọi định kỳ để cập nhật variant_sold_count + product_sold_count",
    },
    {
      id: "refresh_product_sold_30d",
      qualified: "product.refresh_product_sold_30d",
      kind: "function",
      ok: await existsFunction("product", "refresh_product_sold_30d"),
      note: "Gọi định kỳ cho product_sold_30d",
    },
  ];

  const catalogReady =
    items.every((i) => i.ok) && refreshFunctions.every((f) => f.ok);

  const rowCounts: Record<string, number | null> = {};
  const pt = splitQualified(TABLES.PRICING_TIER);
  if (await existsBaseTable(pt.schema, pt.name)) {
    rowCounts.pricing_tier = await countRows(TABLES.PRICING_TIER);
  }
  const vm = splitQualified(TABLES.VARIANT_MARGIN);
  if (await existsBaseTable(vm.schema, vm.name)) {
    rowCounts.variant_margin = await countRows(TABLES.VARIANT_MARGIN);
  }

  return { catalogReady, items, rowCounts, refreshFunctions };
}
