import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/server/.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const tables = ['product.product', 'product.variant', 'product.price_config', 'product.product_desc', 'product.supplier_cost'];
    
    for (const table of tables) {
      console.log(`\nColumns for table: ${table}`);
      const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema || '.' || table_name = $1`, [table]);
      console.log(res.rows.map(r => r.column_name).join(', '));
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
