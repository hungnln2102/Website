import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: '110.172.28.206',
  port: 5432,
  database: 'mydtbmav',
  user: 'admin',
  password: 'ZAQ!xsw21122',
});

async function testProductDetailQuery() {
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Test query: Get variant with product_desc info
    const query = `
      SELECT 
        v.id as variant_id,
        v.display_name,
        v.variant_name,
        v.product_id,
        SPLIT_PART(v.display_name, '--', 1) as base_name,
        SPLIT_PART(v.display_name, '--', 2) as duration,
        pd.product_id as desc_product_id,
        pd.description,
        pd.image_url
      FROM product.variant v
      LEFT JOIN product.product_desc pd 
        ON SPLIT_PART(v.display_name, '--', 1) = pd.product_id
      WHERE v.display_name LIKE '%Adobe%'
      LIMIT 5
    `;

    console.log('📊 Testing variant + product_desc JOIN:\n');
    const result = await client.query(query);
    
    result.rows.forEach(row => {
      console.log('─────────────────────────────────────');
      console.log(`Variant ID: ${row.variant_id}`);
      console.log(`Display Name: ${row.display_name}`);
      console.log(`Variant Name: ${row.variant_name}`);
      console.log(`Base Name: ${row.base_name}`);
      console.log(`Duration: ${row.duration}`);
      console.log(`Has Description: ${row.description ? 'YES ✅' : 'NO ❌'}`);
      console.log(`Has Image: ${row.image_url ? 'YES ✅' : 'NO ❌'}`);
      if (row.description) {
        console.log(`Description Preview: ${row.description.substring(0, 80)}...`);
      }
      console.log('');
    });

    // Check coverage
    console.log('\n📈 Coverage Analysis:\n');
    
    const coverage = await client.query(`
      SELECT 
        COUNT(*) as total_variants,
        COUNT(pd.product_id) as variants_with_desc,
        COUNT(*) - COUNT(pd.product_id) as variants_without_desc
      FROM product.variant v
      LEFT JOIN product.product_desc pd 
        ON SPLIT_PART(v.display_name, '--', 1) = pd.product_id
    `);

    const stats = coverage.rows[0];
    console.log(`Total Variants: ${stats.total_variants}`);
    console.log(`With Description: ${stats.variants_with_desc} (${Math.round(stats.variants_with_desc / stats.total_variants * 100)}%)`);
    console.log(`Without Description: ${stats.variants_without_desc} (${Math.round(stats.variants_without_desc / stats.total_variants * 100)}%)`);

    // Show variants without description
    console.log('\n⚠️  Variants WITHOUT description:\n');
    const missing = await client.query(`
      SELECT 
        v.display_name,
        v.variant_name,
        SPLIT_PART(v.display_name, '--', 1) as base_name
      FROM product.variant v
      LEFT JOIN product.product_desc pd 
        ON SPLIT_PART(v.display_name, '--', 1) = pd.product_id
      WHERE pd.product_id IS NULL
      LIMIT 10
    `);

    missing.rows.forEach(row => {
      console.log(`  ${row.display_name} (${row.variant_name})`);
      console.log(`    → Missing: ${row.base_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testProductDetailQuery();
