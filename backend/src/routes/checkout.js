import { Router } from 'express';
import { validateCheckoutBody } from '../utils/validate.js';
import { resolveLine } from '../services/catalogue.js';
import { isSoldOut } from '../services/stock.js';
import { createCheckoutSession } from '../services/stripe.js';
import { computeShippingPence } from '../utils/shipping.js';
import config from '../config.js';

const router = Router();

/**
 * POST /api/checkout
 * Body: { items: [{ slug, sku, quantity }] }
 * Prices every line from the published catalogue (never from the client), refuses anything the
 * catalogue or the sold-out ledger says is unavailable, adds weight-based shipping, and creates a
 * Stripe Checkout Session. Each Stripe product carries slug and sku in its metadata so the webhook
 * can rebuild the order from line items.
 */
router.post('/checkout', async (req, res, next) => {
  try {
    const { valid, errors } = validateCheckoutBody(req.body);
    if (!valid) {
      const err = new Error('Validation error');
      err.type = 'validation';
      err.details = errors;
      throw err;
    }

    const unavailable = [];
    const priced = [];
    for (const item of req.body.items) {
      const line = await resolveLine(item.slug, item.sku);
      if (!line) {
        unavailable.push({ slug: item.slug, sku: item.sku, reason: 'not_found' });
        continue;
      }
      if (!line.inStock || (await isSoldOut(item.slug, item.sku))) {
        unavailable.push({ slug: item.slug, sku: item.sku, reason: 'out_of_stock' });
        continue;
      }
      priced.push({ ...line, quantity: item.quantity });
    }
    if (unavailable.length > 0) return res.status(409).json({ error: 'out_of_stock', items: unavailable });

    const subtotal = priced.reduce((sum, p) => sum + p.unitAmount * p.quantity, 0);
    const totalWeight = priced.reduce((sum, p) => sum + p.weightGrams * p.quantity, 0);
    const shippingPence = computeShippingPence(totalWeight, subtotal, { freeShippingThresholdPence: config.freeShippingThresholdPence });

    const lineItems = priced.map((p) => ({ name: p.name, unitAmount: p.unitAmount, quantity: p.quantity, metadata: { slug: p.slug, sku: p.sku } }));
    if (shippingPence > 0) lineItems.push({ name: 'Shipping (Royal Mail)', unitAmount: shippingPence, quantity: 1, metadata: { kind: 'shipping' } });

    const { url } = await createCheckoutSession({
      lineItems,
      metadata: { weight: String(totalWeight), lines: String(priced.length) },
      successUrl: `${config.siteUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.siteUrl}/cart`,
    });
    res.json({ sessionUrl: url });
  } catch (err) {
    next(err);
  }
});

export default router;
