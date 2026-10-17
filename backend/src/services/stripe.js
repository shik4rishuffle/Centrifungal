import Stripe from 'stripe';
import config from '../config.js';

const stripe = new Stripe(config.stripeSecretKey);

/**
 * Create a Stripe Checkout Session (payment mode).
 *
 * @param {Object} options
 * @param {Array} options.lineItems - [{ name, unitAmount (pence), quantity }]
 * @param {Object} options.metadata - string key/value pairs
 * @param {string} options.successUrl
 * @param {string} options.cancelUrl
 * @returns {Promise<{url: string, id: string}>}
 */
export async function createCheckoutSession({ lineItems, metadata, successUrl, cancelUrl }) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map((item) => ({
        price_data: {
          currency: 'gbp',
          product_data: { name: item.name },
          unit_amount: item.unitAmount,
        },
        quantity: item.quantity,
      })),
      metadata,
      shipping_address_collection: { allowed_countries: ['GB'] },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { url: session.url, id: session.id };
  } catch (err) {
    console.error('[Stripe] Failed to create checkout session:', err.message);
    const wrapped = new Error('Failed to create checkout session');
    wrapped.type = 'stripe';
    wrapped.statusCode = 502;
    throw wrapped;
  }
}

/** Verify a Stripe webhook signature and return the parsed event. */
export function verifyWebhookSignature(rawBody, signature) {
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err.message);
    const wrapped = new Error('Invalid webhook signature');
    wrapped.type = 'webhook_signature';
    wrapped.statusCode = 400;
    throw wrapped;
  }
}

/** Retrieve a Checkout Session (used by the reconcile cron). */
export async function retrieveCheckoutSession(sessionId) {
  return stripe.checkout.sessions.retrieve(sessionId);
}

export { stripe };
