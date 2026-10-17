import cron from 'node-cron';
import config from './config.js';
import { pollRoyalMailTracking, reconcileStripePayments } from './jobs.js';

/**
 * Start background jobs (ported from the original Laravel scheduler):
 *  - Royal Mail dispatch + tracking poll: every 15 minutes
 *  - Stripe reconcile (missed-webhook safety net): hourly
 */
export function startSchedulers() {
  if (config.nodeEnv === 'test') return;

  cron.schedule('*/15 * * * *', () => {
    pollRoyalMailTracking().catch((e) => console.error('[Cron] tracking poll error:', e.message));
  });

  cron.schedule('0 * * * *', () => {
    reconcileStripePayments().catch((e) => console.error('[Cron] reconcile error:', e.message));
  });

  console.log('[Scheduler] Royal Mail dispatch/tracking (15m) + Stripe reconcile (1h) scheduled');
}
