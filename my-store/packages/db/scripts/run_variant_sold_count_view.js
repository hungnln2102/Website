/**
 * Tạo materialized views: product.variant_sold_count, product.product_sold_count
 * Cần chạy khi deploy mới hoặc khi view chưa tồn tại (lỗi: relation "product.variant_sold_count" does not exist)
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env từ apps/server (scripts nằm trong packages/db/scripts)
const envPaths = [
  join(__dirname, '../../../apps/server/.env'),
  join(__dirname, '../../apps/server/.env'),
  join(process.cwd(), 'apps/server/.env'),
];
for (const p of envPaths) {
  const r = dotenv.config({ path: p });
  if (r.parsed && Object.keys(r.parsed).length > 0) break;
}

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('❌ DATABASE_URL không tìm thấy. Kiểm tra apps/server/.env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: connStr });

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating materialized views: variant_sold_count, product_sold_count\n');

    const sqlPath = join(__dirname, '../prisma/migrations/create_variant_sold_count_view.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('   ✅ variant_sold_count created');
    console.log('   ✅ product_sold_count created');
    console.log('   ✅ Indexes created');
    console.log('   ✅ refresh_variant_sold_count() function created');
    console.log('   ✅ Permissions granted');
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Refresh manually when needed:');
    console.log('   SELECT product.refresh_variant_sold_count();');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
