/**
 * Chạy migration thêm updated_at, is_active (product); updated_at (variant, product_desc);
 * created_at, updated_at (supplier_cost); UNIQUE(product_id, display_name) trên variant.
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPaths = [
  join(__dirname, '../../../apps/server/.env'),
  join(__dirname, '../../apps/server/.env'),
  join(process.cwd(), 'apps/server/.env'),
];
for (const p of envPaths) {
  const r = dotenv.config({ path: p });
  if (r.parsed && Object.keys(r.parsed).length > 0) break;
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL không tìm thấy.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const sqlPath = join(__dirname, '../prisma/migrations/add_schema_updates_product_variant_supplier.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    await client.query(sql);
    console.log('✅ Schema updates applied (product, variant, product_desc, supplier_cost)');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
