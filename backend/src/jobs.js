import { isConfigured, pushOrder, getTrackingStatus } from './services/royalmail.js';
import { findOrdersByStatus, updateOrder, findOrderBySession } from './services/db.js';
import { stripe } from './services/stripe.js';
import { createOrderFromSession } from './services/orders.js';
import { sendEmail } from './services/resend.js';
import { shippingNotification } from './emails/shippingNotification.js';

const CIRCUIT_BREAK = 5;

/**
 * Royal Mail dispatch + tracking (runs every 15 min).
 * 1. Auto-dispatch: push 'paid' orders with no royalMailOrderId to Click & Drop.
 * 2. Poll 'fulfilled'/'shipped' orders; on ship, notify the customer once.
 * Ported from the original PollRoyalMailTracking command.
 */
export async function pollRoyalMailTracking() {
  if (!isConfigured()) {
    console.warn('[RoyalMail] not configured; skipping dispatch/tracking poll');
    return;
  }

  // 1. Auto-dispatch paid, not-yet-dispatched orders.
  const paid = findOrdersByStatus('paid');
  for (const order of paid) {
    if (order.royalMailOrderId) continue;
    const result = await pushOrder(order);
    if (result.ok) {
      updateOrder(order.stripeSessionId, { royalMailOrderId: result.orderReference, fulfilmentStatus: 'fulfilled' });
      console.log(`[RoyalMail] dispatched ${order.orderRef} -> ${result.orderReference}`);
    } else {
      console.error(`[RoyalMail] dispatch failed for ${order.orderRef}: ${result.error}`);
    }
  }

  // 2. Poll tracking for dispatched orders.
  const fulfilled = findOrdersByStatus('fulfilled');
  const shipped = findOrdersByStatus('shipped');
  let consecutiveErrors = 0;

  for (const order of [...fulfilled, ...shipped]) {
    if (consecutiveErrors >= CIRCUIT_BREAK) {
      console.warn('[RoyalMail] circuit breaker: 5 consecutive errors, stopping poll');
      break;
    }
    if (!order.royalMailOrderId) continue;

    try {
      const t = await getTrackingStatus(order.royalMailOrderId);
      if (t.status === 'error') {
        consecutiveErrors++;
        continue;
      }
      consecutiveErrors = 0;

      if (t.status === 'shipped' && order.fulfilmentStatus !== 'shipped') {
        updateOrder(order.stripeSessionId, {
          fulfilmentStatus: 'shipped',
          trackingNumber: t.trackingNumber,
          trackingUrl: t.trackingUrl,
          shippedAt: new Date().toISOString(),
        });
        try {
          if (order.customerEmail) {
            await sendEmail(
              shippingNotification({
                ...order,
                trackingNumber: t.trackingNumber,
                trackingUrl: t.trackingUrl,
              })
            );
          }
        } catch (e) {
          console.error('[RoyalMail] shipping email failed:', e.message);
        }
        console.log(`[RoyalMail] ${order.orderRef} -> shipped`);
      } else if (t.status === 'delivered' && order.fulfilmentStatus !== 'delivered') {
        updateOrder(order.stripeSessionId, {
          fulfilmentStatus: 'delivered',
          trackingNumber: t.trackingNumber,
          trackingUrl: t.trackingUrl,
          deliveredAt: new Date().toISOString(),
        });
        console.log(`[RoyalMail] ${order.orderRef} -> delivered`);
      }
    } catch (e) {
      consecutiveErrors++;
      console.error(`[RoyalMail] tracking poll failed for ${order.orderRef}:`, e.message);
    }
  }
}

/**
 * Stripe reconcile (runs hourly). Safety net for webhooks Stripe never
 * delivered: record completed sessions the ledger has not seen.
 * No emails (avoids late/duplicate sends). Ported from ReconcileStripePayments.
 */
export async function reconcileStripePayments() {
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 50, status: 'complete' });
    let reconciled = 0;

    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue;
      const existing = findOrderBySession(session.id);
      if (existing) continue;

      const { created } = await createOrderFromSession(session, { sendEmails: false });
      if (created) reconciled++;
    }

    if (reconciled > 0) {
      console.log(`[Reconcile] ${reconciled} missed order(s) reconciled`);
    }
  } catch (e) {
    console.error('[Reconcile] failed:', e.message);
  }
}
