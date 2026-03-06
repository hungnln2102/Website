/**
 * Rename order_list.order_expired -> expired_at (loại bỏ tên order_expired hoàn toàn)
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
    const sqlPath = join(__dirname, '../prisma/migrations/rename_order_expired_to_expired_at.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    await client.query(sql);
    console.log('✅ Đã đổi tên order_list.order_expired -> expired_at');
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      console.log('ℹ️  Cột order_expired không tồn tại (có thể đã đổi tên rồi).');
    } else {
      console.error('❌ Lỗi:', err.message);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run();
