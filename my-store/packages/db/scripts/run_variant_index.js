/**
 * Chạy migration tạo index idx_variant_product_active trên product.variant (product_id, is_active).
 * Giúp tối ưu GET /products, GET /promotions và truy vấn variant theo product.
 * Chạy: npm run db:migrate:variant-index (từ repo root) hoặc node scripts/run_variant_index.js (từ packages/db)
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../apps/server/.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    const sqlPath = join(__dirname, '../prisma/migrations/add_variant_product_active_index.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    await client.query(sql);
    console.log('✅ Index idx_variant_product_active đã được tạo (hoặc đã tồn tại).');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
