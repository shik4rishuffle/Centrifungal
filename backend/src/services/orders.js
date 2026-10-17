import { findOrderByStripeSession, createOrder, getGlobal } from './payload.js';
import { sendEmail } from './resend.js';
import { orderConfirmation } from '../emails/orderConfirmation.js';
import { orderNotification } from '../emails/orderNotification.js';
import * as orderRef from '../utils/orderRef.js';
import config from '../config.js';

/** Map a Stripe address object onto our order's shippingAddress group. */
function mapAddress(a = {}) {
  return {
    line1: a.line1 || '',
    line2: a.line2 || '',
    city: a.city || '',
    county: a.state || '',
    postcode: a.postal_code || '',
  };
}

/** Resolve the owner alert recipient: env override, else CMS SiteSettings. */
async function resolveOwnerEmail() {
  if (config.contactRecipient) return config.contactRecipient;
  const site = await getGlobal('site-settings').catch(() => ({}));
  return site.contactEmail || '';
}

/**
 * Create a Payload order from a completed Stripe Checkout Session.
 * Idempotent by stripeSessionId. Shared by the webhook and the reconcile cron.
 *
 * @param {Object} session - Stripe Checkout Session
 * @param {Object} [opts]
 * @param {boolean} [opts.sendEmails=true] - send confirmation + owner alert
 * @returns {Promise<{created: boolean, order: Object}>}
 */
export async function createOrderFromSession(session, { sendEmails = true } = {}) {
  const existing = await findOrderByStripeSession(session.id);
  if (existing) return { created: false, order: existing };

  let items = [];
  try {
    items = JSON.parse(session.metadata?.items || '[]');
  } catch {
    console.error('[Orders] Could not parse items metadata for session', session.id);
  }
  const weightGrams = parseInt(session.metadata?.weight || '0', 10) || 0;

  const shipping =
    session.shipping_details || session.collected_information?.shipping_details || null;
  const address = mapAddress(shipping?.address || session.customer_details?.address || {});

  const subtotalPence = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalPence = session.amount_total ?? subtotalPence;
  const shippingPence = Math.max(0, totalPence - subtotalPence);

  const orderData = {
    orderRef: orderRef.generate(),
    customerName: shipping?.name || session.customer_details?.name || '',
    customerEmail: session.customer_details?.email || '',
    items,
    subtotalPence,
    shippingPence,
    totalPence,
    weightGrams,
    shippingAddress: address,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string' ? session.payment_intent : '',
    stripePaymentStatus: session.payment_status || 'paid',
    fulfilmentStatus: 'paid',
  };

  const order = await createOrder(orderData);

  if (sendEmails) {
    try {
      if (orderData.customerEmail) await sendEmail(orderConfirmation(orderData));
    } catch (e) {
      console.error('[Orders] confirmation email failed:', e.message);
    }
    try {
      const owner = await resolveOwnerEmail();
      if (owner) await sendEmail(orderNotification(orderData, owner));
    } catch (e) {
      console.error('[Orders] owner notification email failed:', e.message);
    }
  }

  return { created: true, order };
}
