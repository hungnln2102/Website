import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: '110.172.28.206',
  port: 5432,
  database: 'mydtbmav',
  user: 'admin',
  password: 'ZAQ!xsw21122',
});

async function checkOrderExpired() {
  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Check order_expired count
    const expiredCount = await client.query('SELECT COUNT(*) FROM orders.order_expired');
    console.log(`📊 Total orders in order_expired: ${expiredCount.rows[0].count}`);

    // Check order_list count
    const listCount = await client.query('SELECT COUNT(*) FROM orders.order_list');
    console.log(`📊 Total orders in order_list: ${listCount.rows[0].count}\n`);

    // Sample data from order_expired
    const expiredSample = await client.query('SELECT id_product, COUNT(*) as count FROM orders.order_expired WHERE id_product IS NOT NULL GROUP BY id_product LIMIT 5');
    console.log('📋 Sample from order_expired (grouped by id_product):');
    expiredSample.rows.forEach(row => {
      console.log(`  ${row.id_product}: ${row.count} orders`);
    });

    console.log('\n');

    // Sample data from order_list
    const listSample = await client.query('SELECT id_product, COUNT(*) as count FROM orders.order_list WHERE id_product IS NOT NULL GROUP BY id_product LIMIT 5');
    console.log('📋 Sample from order_list (grouped by id_product):');
    listSample.rows.forEach(row => {
      console.log(`  ${row.id_product}: ${row.count} orders`);
    });

    console.log('\n');

    // Check variant_sold_count view
    const viewSample = await client.query('SELECT variant_display_name, sales_count FROM product.variant_sold_count WHERE sales_count > 0 ORDER BY sales_count DESC LIMIT 5');
    console.log('📊 Top 5 variants by sold count (from VIEW):');
    viewSample.rows.forEach(row => {
      console.log(`  ${row.variant_display_name}: ${row.sales_count} sold`);
    });

    console.log('\n');

    // Manual calculation for one variant
    const testVariant = viewSample.rows[0]?.variant_display_name;
    if (testVariant) {
      console.log(`🔍 Manual check for variant: ${testVariant}`);
      
      const listCountManual = await client.query(
        'SELECT COUNT(*) FROM orders.order_list WHERE TRIM(id_product::text) = $1',
        [testVariant]
      );
      
      const expiredCountManual = await client.query(
        'SELECT COUNT(*) FROM orders.order_expired WHERE TRIM(id_product::text) = $1',
        [testVariant]
      );
      
      const totalManual = parseInt(listCountManual.rows[0].count) + parseInt(expiredCountManual.rows[0].count);
      
      console.log(`  order_list: ${listCountManual.rows[0].count}`);
      console.log(`  order_expired: ${expiredCountManual.rows[0].count}`);
      console.log(`  Total (manual): ${totalManual}`);
      console.log(`  VIEW shows: ${viewSample.rows[0].sales_count}`);
      
      if (totalManual === parseInt(viewSample.rows[0].sales_count)) {
        console.log('  ✅ MATCH! View is correct.');
      } else {
        console.log('  ❌ MISMATCH! View might need refresh.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrderExpired();
