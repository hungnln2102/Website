import cron from 'node-cron';
import { productSoldCountService } from '../../modules/analytics/product-sold-count.service';
import logger from '../../shared/utils/logger';

/**
 * Refresh product sold count materialized view
 * Runs every 15 minutes
 */
cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('🔄 Refreshing product sold count...');
    await productSoldCountService.refreshSoldCount();
  } catch (error) {
    logger.error('Failed to refresh sold count', { error });
  }
});

console.log('✅ Product sold count cron job started (every 15 minutes)');
