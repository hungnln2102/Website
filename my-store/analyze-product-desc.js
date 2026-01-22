import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: '110.172.28.206',
  port: 5432,
  database: 'mydtbmav',
  user: 'admin',
  password: 'ZAQ!xsw21122',
});

async function analyzeProductDesc() {
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Check product_desc structure
    console.log('📊 Analyzing product_desc table...\n');

    // Sample data
    const sample = await client.query(`
      SELECT product_id, description 
      FROM product.product_desc 
      LIMIT 10
    `);
    
    console.log('Sample product_desc data:');
    sample.rows.forEach(row => {
      console.log(`  ${row.product_id}: ${row.description?.substring(0, 50)}...`);
    });

    console.log('\n');

    // Check variant table
    const variantSample = await client.query(`
      SELECT id, display_name, variant_name, product_id
      FROM product.variant
      LIMIT 10
    `);
    
    console.log('Sample variant data:');
    variantSample.rows.forEach(row => {
      console.log(`  ID: ${row.id}`);
      console.log(`    display_name: ${row.display_name}`);
      console.log(`    variant_name: ${row.variant_name}`);
      console.log(`    product_id: ${row.product_id}`);
      console.log('');
    });

    // Check if product_desc.product_id matches variant.display_name or variant.variant_name
    console.log('🔍 Checking matches...\n');

    const matchDisplayName = await client.query(`
      SELECT COUNT(*) as count
      FROM product.product_desc pd
      JOIN product.variant v ON TRIM(pd.product_id::text) = TRIM(v.display_name::text)
    `);

    const matchVariantName = await client.query(`
      SELECT COUNT(*) as count
      FROM product.product_desc pd
      JOIN product.variant v ON TRIM(pd.product_id::text) = TRIM(v.variant_name::text)
    `);

    const totalProductDesc = await client.query(`
      SELECT COUNT(*) as count FROM product.product_desc
    `);

    console.log('Match Analysis:');
    console.log(`  Total product_desc rows: ${totalProductDesc.rows[0].count}`);
    console.log(`  Matches with variant.display_name: ${matchDisplayName.rows[0].count}`);
    console.log(`  Matches with variant.variant_name: ${matchVariantName.rows[0].count}`);

    console.log('\n');

    // Show examples of matches
    console.log('📝 Example matches with display_name:');
    const exampleDisplayName = await client.query(`
      SELECT 
        pd.product_id,
        v.display_name,
        v.variant_name,
        LEFT(pd.description, 50) as desc_preview
      FROM product.product_desc pd
      JOIN product.variant v ON TRIM(pd.product_id::text) = TRIM(v.display_name::text)
      LIMIT 5
    `);
    
    exampleDisplayName.rows.forEach(row => {
      console.log(`  product_id: ${row.product_id}`);
      console.log(`    → display_name: ${row.display_name}`);
      console.log(`    → variant_name: ${row.variant_name}`);
      console.log(`    → description: ${row.desc_preview}...`);
      console.log('');
    });

    // Recommendation
    console.log('\n📌 RECOMMENDATION:');
    if (matchDisplayName.rows[0].count > matchVariantName.rows[0].count) {
      console.log('  ✅ Use display_name for matching');
      console.log(`  Reason: ${matchDisplayName.rows[0].count} matches vs ${matchVariantName.rows[0].count} matches`);
    } else if (matchVariantName.rows[0].count > matchDisplayName.rows[0].count) {
      console.log('  ✅ Use variant_name for matching');
      console.log(`  Reason: ${matchVariantName.rows[0].count} matches vs ${matchDisplayName.rows[0].count} matches`);
    } else {
      console.log('  ⚠️  Both have same number of matches');
      console.log('  Need to check data quality');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

analyzeProductDesc();
