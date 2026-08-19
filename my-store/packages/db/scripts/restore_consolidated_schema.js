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

function splitSql(sql) {
  const statements = [];
  let currentStatement = '';
  let inDollarQuote = null;
  let inSingleQuote = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    currentStatement += char;
    
    if (inDollarQuote) {
      if (sql.substring(i, i + inDollarQuote.length) === inDollarQuote) {
        currentStatement += sql.substring(i + 1, i + inDollarQuote.length);
        i += inDollarQuote.length - 1;
        inDollarQuote = null;
      }
    } else if (inSingleQuote) {
      if (char === "'") {
        if (sql[i + 1] === "'") {
          currentStatement += "'";
          i++;
        } else {
          inSingleQuote = false;
        }
      }
    } else {
      if (char === "'") {
        inSingleQuote = true;
      } else {
        const match = sql.substring(i).match(/^(\$[a-zA-Z0-9_]*\$)/);
        if (match) {
          inDollarQuote = match[1];
          currentStatement += match[1].substring(1);
          i += inDollarQuote.length - 1;
        } else if (char === ';') {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }
  }
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  return statements;
}

async function run() {
  const client = await pool.connect();
  try {
    const sqlPath = 'E:/Project/admin_store/admin_orderlist/database/migrations/000_consolidated_schema.sql';
    console.log('Reading schema from:', sqlPath);
    const sql = readFileSync(sqlPath, 'utf-8');
    
    console.log('Splitting SQL into separate statements...');
    const statements = splitSql(sql);
    console.log(`Found ${statements.length} SQL statements. Executing statement-by-statement...`);
    
    let executedCount = 0;
    let skippedCount = 0;
    
    for (const stmt of statements) {
      if (!stmt) continue;
      try {
        await client.query(stmt);
        executedCount++;
      } catch (err) {
        // Ignore "already exists" errors (duplicate_table, duplicate_object, etc.)
        const isAlreadyExists = 
          err.code === '42P07' || 
          err.code === '42710' || 
          err.code === '42723' || 
          err.code === '42P06' || 
          err.code === '42P16' || // invalid_table_definition (multiple primary keys)
          err.message.includes('already exists') ||
          err.message.includes('multiple primary keys') ||
          err.message.includes('already a member');
          
        if (isAlreadyExists) {
          skippedCount++;
        } else {
          console.error(`❌ Statement failed:\n${stmt}\nError: ${err.message}`);
          throw err;
        }
      }
    }
    
    console.log(`✅ Restore completed. Executed: ${executedCount}, Skipped (already exists): ${skippedCount}`);
  } catch (err) {
    console.error('❌ Restore failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
