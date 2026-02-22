const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const listRes = await pool.query("SELECT * FROM orders.order_list LIMIT 5");
    console.log("--- order_list ---");
    console.log(listRes.rows);

    const custRes = await pool.query("SELECT * FROM orders.order_customer LIMIT 5");
    console.log("--- order_customer ---");
    console.log(custRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
