import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/server/.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Checking columns for product.variant...");
    const res = await pool.query("SELECT * FROM product.variant LIMIT 1");
    if (res.rows.length > 0) {
      console.log("Columns found in variant:", Object.keys(res.rows[0]).join(', '));
      console.log("Sample row:", JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log("No rows in variant, trying to get schema info...");
      const schemaRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'variant'");
      console.log("Columns in schema:", schemaRes.rows.map(r => r.column_name).join(', '));
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
