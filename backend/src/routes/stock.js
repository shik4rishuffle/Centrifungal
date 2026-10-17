import { Router } from 'express';
import { effectiveSoldOut } from '../services/stock.js';
import { setSoldOut, clearOverride, getOverrides, listOrders } from '../services/db.js';
import { loadCatalogue, catalogueLoadedAt } from '../services/catalogue.js';
import config from '../config.js';

const router = Router();

/**
 * GET /api/stock
 * Public. The static pages call this after load to grey out anything sold since the last build.
 */
router.get('/stock', async (req, res, next) => {
  try {
    const { soldOut, updatedAt } = await effectiveSoldOut();
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json({ soldOut, updatedAt, catalogueLoadedAt: catalogueLoadedAt() });
  } catch (err) {
    next(err);
  }
});

function requireAdmin(req, res, next) {
  if (!config.adminToken) return res.status(404).json({ error: 'not_found' });
  const header = req.headers.authorization || '';
  if (header !== `Bearer ${config.adminToken}`) return res.status(401).json({ error: 'unauthorised' });
  next();
}

/** POST /api/admin/stock { slug, sku, soldOut, note? } or { slug, sku, clear: true } */
router.post('/admin/stock', requireAdmin, (req, res) => {
  const { slug, sku, soldOut, clear, note } = req.body || {};
  if (!slug || !sku) return res.status(400).json({ error: 'slug and sku are required' });
  if (clear) clearOverride(slug, sku);
  else setSoldOut(slug, sku, Boolean(soldOut), typeof note === 'string' ? note : '');
  res.json({ overrides: getOverrides() });
});

router.get('/admin/stock', requireAdmin, (req, res) => res.json({ overrides: getOverrides() }));
router.get('/admin/orders', requireAdmin, (req, res) => res.json({ orders: listOrders(parseInt(req.query.limit || '50', 10)) }));
router.post('/admin/catalogue/refresh', requireAdmin, async (req, res, next) => {
  try {
    const c = await loadCatalogue({ force: true });
    res.json({ products: c.products.length, generatedAt: c.generatedAt, loadedAt: catalogueLoadedAt() });
  } catch (err) {
    next(err);
  }
});

export default router;
