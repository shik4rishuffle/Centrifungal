import { Router } from 'express';
import config from '../config.js';

const router = Router();

/** GET /api/shop-config: the free-shipping threshold the cart page shows. */
router.get('/shop-config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({ freeShippingThresholdPence: config.freeShippingThresholdPence });
});

export default router;
