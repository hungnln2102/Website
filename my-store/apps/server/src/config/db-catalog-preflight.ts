/**
 * Kiểm tra nhanh catalog storefront (product.category, product.supplier_cost) khi boot.
 * Sai DATABASE_URL / DB chưa restore → log hướng dẫn thay vì chỉ có lỗi warmup lặp.
 */
import pool from "./database";

export async function warnIfProductCatalogIncomplete(): Promise<void> {
  try {
    const db = await pool.query<{ d: string }>("SELECT current_database() AS d");
    const name = db.rows[0]?.d ?? "?";
    const chk = await pool.query<{
      product_schema: boolean;
      category: boolean;
      supplier_cost: boolean;
    }>(`
      SELECT
        EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'product') AS product_schema,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'product' AND table_name = 'category'
        ) AS category,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'product' AND table_name = 'supplier_cost'
        ) AS supplier_cost
    `);
    const r = chk.rows[0];
    if (!r) return;

    if (r.product_schema && r.category && r.supplier_cost) {
      console.log(`[catalog] PostgreSQL OK (database="${name}"): có product.category, product.supplier_cost`);
      return;
    }

    console.error(`[catalog] ⚠ DATABASE_URL đang vào database "${name}" nhưng thiếu bảng/schema catalog storefront.`);

    if (!r.product_schema) {
      console.error(
        `  → Chưa có schema "product". Restore chuẩn từ admin_orderlist: database/migrations/000_consolidated_schema.sql`,
      );
    } else {
      if (!r.category) console.error(`  → Thiếu bảng product.category`);
      if (!r.supplier_cost) console.error(`  → Thiếu bảng product.supplier_cost`);
      console.error(
        `  → Schema chưa đồng bộ storefront: trong Website/my-store chạy: npm run db:migrate:all -w @my-store/db`,
      );
    }

    console.error(
      `  → Kiểm tra Beekeeper/DBeaver: đang mở ĐÚNG database "${name}" trong DATABASE_URL và có schema product; sửa apps/server/.env cho khớp.`,
    );
  } catch (e) {
    console.warn("[catalog] Preflight không kiểm tra được:", (e as Error)?.message ?? e);
  }
}
