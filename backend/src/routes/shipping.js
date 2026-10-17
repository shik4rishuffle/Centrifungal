import { Router } from 'express';
import { getGlobal } from '../services/payload.js';

const router = Router();

/**
 * GET /api/shop-config
 * Public-safe shop config, proxied from the auth-only ShopSettings global so the
 * storefront can show the announcement banner and free-shipping threshold
 * without exposing the whole global.
 */
router.get('/shop-config', async (req, res, next) => {
  try {
    const shop = await getGlobal('shop-settings').catch(() => ({}));
    res.json({
      announcement: shop.shopAnnouncementText || '',
      freeShippingThresholdPence: shop.freeShippingThresholdPence || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
