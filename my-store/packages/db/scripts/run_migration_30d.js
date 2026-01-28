import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../apps/server/.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration: create_product_sold_30d_view...\n');
    
    // Read SQL file
    const sqlPath = join(__dirname, '../prisma/migrations/create_product_sold_30d_view.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Remove comments and empty lines for cleaner execution
    const cleanSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');
    
    // Execute the entire SQL file
    // The DO block will handle pg_cron gracefully
    try {
      await client.query('BEGIN');
      await client.query(cleanSql);
      await client.query('COMMIT');
      
      console.log('   ✅ Materialized view created');
      console.log('   ✅ Indexes created');
      console.log('   ✅ Function created');
      console.log('   ✅ Materialized view refreshed');
      console.log('   ✅ Permissions granted');
      console.log('   📅 Cron job setup attempted (may skip if pg_cron not available)');
      
    } catch (err) {
      await client.query('ROLLBACK');
      
      // Check if it's a pg_cron related error
      if (err.message.includes('pg_cron') || err.message.includes('extension')) {
        console.log('   ⚠️  pg_cron extension not available - this is OK');
        console.log('   ℹ️  Materialized view created but auto-refresh disabled');
        console.log('   ℹ️  You can manually refresh using: REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;');
        
        // Try to run migration without the DO block
        const sqlWithoutCron = cleanSql
          .split(/DO \$\$[\s\S]*?\$\$;/)
          .join('')
          .trim();
        
        if (sqlWithoutCron.length > 0) {
          console.log('\n   🔄 Retrying migration without cron job setup...');
          await client.query('BEGIN');
          await client.query(sqlWithoutCron);
          await client.query('COMMIT');
          console.log('   ✅ Migration completed successfully (without cron job)');
        }
      } else {
        throw err;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verification:');
    console.log('   Run this query to check the view:');
    console.log('   SELECT * FROM product.product_sold_30d ORDER BY sold_count_30d DESC LIMIT 10;');
    console.log('\n💡 Note: If pg_cron is not available, refresh manually:');
    console.log('   REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
