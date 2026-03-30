import cron from 'node-cron';
import prisma from '@my-store/db';

/**
 * Refresh product sold count (30 days) materialized view
 * Runs every 5 minutes
 */
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🔄 Refreshing product sold count (30 days)...');
    await prisma.$executeRaw`SELECT product.refresh_product_sold_30d()`;
    console.log('✅ Product sold count (30 days) refreshed');
  } catch (error) {
    console.error('❌ Failed to refresh product sold count (30 days):', error);
  }
});

console.log('✅ Product sold count (30 days) cron job started (every 5 minutes)');
