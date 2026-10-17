import { Router } from 'express';
import { validateCheckoutBody } from '../utils/validate.js';
import { getProductBySlug, getGlobal } from '../services/payload.js';
import { createCheckoutSession } from '../services/stripe.js';
import { computeShippingPence } from '../utils/shipping.js';
import config from '../config.js';

const router = Router();

/**
 * POST /api/checkout
 * Body: { items: [{ slug, sku, quantity }] }
 * Resolves each product + variant from Payload, checks in/out stock, prices by
 * variant (priceOverride ?? base), computes weight-based shipping, then creates
 * a Stripe Checkout Session (Stripe collects the shipping address).
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

    const { items } = req.body;
    const unavailable = [];
    const priced = [];

    for (const item of items) {
      let product;
      try {
        product = await getProductBySlug(item.slug);
      } catch (err) {
        // A transient Payload/network error must not masquerade as out-of-stock;
        // let it propagate to a retryable 5xx instead.
        if (err && err.type === 'payload') throw err;
        unavailable.push({ slug: item.slug, sku: item.sku, reason: 'not_found' });
        continue;
      }

      if (!product || product.inStock === false) {
        unavailable.push({ slug: item.slug, sku: item.sku, reason: 'unavailable' });
        continue;
      }

      const variant = (product.variants || []).find((v) => v.sku === item.sku);
      if (!variant || variant.inStock === false) {
        unavailable.push({ slug: item.slug, sku: item.sku, reason: 'out_of_stock' });
        continue;
      }

      const unitAmount = variant.priceOverride || product.price;
      priced.push({
        slug: product.slug,
        sku: variant.sku,
        name: `${product.name} - ${variant.variantName}`,
        unitAmount,
        quantity: item.quantity,
        weightGrams: product.weightGrams || 0,
      });
    }

    if (unavailable.length > 0) {
      return res.status(409).json({ error: 'out_of_stock', items: unavailable });
    }

    const subtotal = priced.reduce((sum, p) => sum + p.unitAmount * p.quantity, 0);
    const totalWeight = priced.reduce((sum, p) => sum + p.weightGrams * p.quantity, 0);

    const shopSettings = await getGlobal('shop-settings').catch(() => ({}));
    const shippingPence = computeShippingPence(totalWeight, subtotal, shopSettings);

    const lineItems = priced.map((p) => ({
      name: p.name,
      unitAmount: p.unitAmount,
      quantity: p.quantity,
    }));
    if (shippingPence > 0) {
      lineItems.push({ name: 'Shipping (Royal Mail)', unitAmount: shippingPence, quantity: 1 });
    }

    // Compact snapshot for the webhook to build the order + emails.
    const snapshot = priced.map((p) => ({
      sku: p.sku,
      name: p.name,
      quantity: p.quantity,
      price: p.unitAmount,
    }));
    const itemsMeta = JSON.stringify(snapshot);
    if (itemsMeta.length > 500) {
      // Stripe caps metadata values at 500 chars. Fail clearly rather than let
      // Stripe reject the session with a cryptic 400 (-> generic 502).
      return res.status(422).json({
        error: 'Your cart has too many different items to check out at once. Please remove a few and try again, or contact us to place the order.',
      });
    }

    const { url } = await createCheckoutSession({
      lineItems,
      metadata: { items: itemsMeta, weight: String(totalWeight) },
      successUrl: `${config.siteUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.siteUrl}/cart`,
    });

    res.json({ sessionUrl: url });
  } catch (err) {
    next(err);
  }
});

export default router;
