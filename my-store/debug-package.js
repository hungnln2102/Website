import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: '110.172.28.206',
  port: 5432,
  database: 'mydtbmav',
  user: 'admin',
  password: 'ZAQ!xsw21122',
});

async function checkProductPackage() {
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Check what /products endpoint returns
    console.log('📊 Checking product.package values:\n');
    
    const products = await client.query(`
      SELECT 
        p.id,
        p.package_name,
        v.display_name,
        SPLIT_PART(v.display_name, '--', 1) as base_name
      FROM product.product p
      JOIN product.variant v ON v.product_id = p.id
      WHERE p.package_name LIKE '%Adobe%'
      LIMIT 10
    `);

    products.rows.forEach(row => {
      console.log(`Product ID: ${row.id}`);
      console.log(`  package_name: ${row.package_name}`);
      console.log(`  display_name: ${row.display_name}`);
      console.log(`  base_name: ${row.base_name}`);
      console.log('');
    });

    // Check if product_desc has matching entries
    console.log('\n📋 Checking product_desc matches:\n');
    
    const descCheck = await client.query(`
      SELECT DISTINCT
        pd.product_id,
        COUNT(*) as variant_count
      FROM product.product_desc pd
      JOIN product.variant v ON SPLIT_PART(v.display_name, '--', 1) = pd.product_id
      WHERE pd.product_id LIKE '%Adobe%'
      GROUP BY pd.product_id
    `);

    descCheck.rows.forEach(row => {
      console.log(`${row.product_id}: ${row.variant_count} variants`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkProductPackage();
