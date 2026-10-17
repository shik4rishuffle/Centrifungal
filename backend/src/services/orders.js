import { findOrderBySession, insertOrder } from './db.js';
import { stripe } from './stripe.js';
import { sendEmail } from './resend.js';
import { orderConfirmation } from '../emails/orderConfirmation.js';
import { orderNotification } from '../emails/orderNotification.js';
import * as orderRef from '../utils/orderRef.js';
import config from '../config.js';

function mapAddress(a = {}) {
  return { line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', county: a.state || '', postcode: a.postal_code || '' };
}

/**
 * Items come from Stripe's own line items (with the slug and sku we put on each product's
 * metadata at checkout), not from a size-capped metadata blob. Shipping is the line flagged
 * kind=shipping.
 */
async function lineItemsFor(session) {
  const res = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ['data.price.product'] });
  const items = [];
  let shippingPence = 0;
  for (const line of res.data) {
    const meta = line.price?.product?.metadata || {};
    if (meta.kind === 'shipping') {
      shippingPence += line.amount_subtotal ?? 0;
      continue;
    }
    items.push({ slug: meta.slug || '', sku: meta.sku || '', name: line.description || meta.name || 'Item', quantity: line.quantity || 1, price: line.price?.unit_amount ?? 0 });
  }
  return { items, shippingPence };
}

/**
 * Record a completed Checkout Session in the ledger and send the emails.
 * Idempotent by Stripe session id. Shared by the webhook and the reconcile cron.
 */
export async function createOrderFromSession(session, { sendEmails = true } = {}) {
  const existing = findOrderBySession(session.id);
  if (existing) return { created: false, order: existing };

  const { items, shippingPence } = await lineItemsFor(session);
  const weightGrams = parseInt(session.metadata?.weight || '0', 10) || 0;
  const shipping = session.shipping_details || session.collected_information?.shipping_details || null;
  const subtotalPence = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalPence = session.amount_total ?? subtotalPence + shippingPence;

  const orderData = {
    orderRef: orderRef.generate(),
    customerName: shipping?.name || session.customer_details?.name || '',
    customerEmail: session.customer_details?.email || '',
    items,
    subtotalPence,
    shippingPence,
    totalPence,
    weightGrams,
    shippingAddress: mapAddress(shipping?.address || session.customer_details?.address || {}),
    stripeSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : '',
    stripePaymentStatus: session.payment_status || 'paid',
    fulfilmentStatus: 'paid',
  };

  const order = insertOrder(orderData);

  if (sendEmails) {
    try {
      if (orderData.customerEmail) await sendEmail(orderConfirmation(orderData));
    } catch (e) {
      console.error('[Orders] confirmation email failed:', e.message);
    }
    try {
      await sendEmail(orderNotification(orderData, config.contactRecipient));
    } catch (e) {
      console.error('[Orders] owner notification email failed:', e.message);
    }
  }
  return { created: true, order };
}
