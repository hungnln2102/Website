import cron from 'node-cron';
import prisma from '@my-store/db';

/**
 * Refresh variant sold count materialized view
 * Runs every 10 minutes
 */
cron.schedule('*/10 * * * *', async () => {
  try {
    console.log('🔄 Refreshing variant sold count...');
    await prisma.$executeRaw`SELECT product.refresh_variant_sold_count()`;
    console.log('✅ Variant sold count refreshed');
  } catch (error) {
    console.error('❌ Failed to refresh variant sold count:', error);
  }
});

console.log('✅ Variant sold count cron job started (every 10 minutes)');
