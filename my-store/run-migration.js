import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const client = new Client({
  host: '110.172.28.206',
  port: 5432,
  database: 'mydtbmav',
  user: 'admin',
  password: 'ZAQ!xsw21122',
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Read migration file
    const migrationPath = path.join(__dirname, 'packages', 'db', 'prisma', 'migrations', 'create_variant_sold_count_view.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running migration...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify views created
    console.log('\n📊 Verifying views...');
    const result = await client.query(`
      SELECT schemaname, matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'product'
    `);
    
    console.log('Created views:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.schemaname}.${row.matviewname}`);
    });
    
    // Check row counts
    const variantCount = await client.query('SELECT COUNT(*) FROM product.variant_sold_count');
    const productCount = await client.query('SELECT COUNT(*) FROM product.product_sold_count');
    
    console.log('\n📈 Row counts:');
    console.log(`  variant_sold_count: ${variantCount.rows[0].count} rows`);
    console.log(`  product_sold_count: ${productCount.rows[0].count} rows`);
    
    console.log('\n🎉 All done! Next steps:');
    console.log('1. Add this line to apps/server/src/index.ts:');
    console.log("   import './jobs/refresh-variant-sold-count.job';");
    console.log('2. Restart the server: npm run dev');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
