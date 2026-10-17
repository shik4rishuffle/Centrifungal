import { Router } from 'express';
import { verifyWebhookSignature } from '../services/stripe.js';
import { createOrderFromSession } from '../services/orders.js';

const router = Router();

/**
 * POST /api/webhooks/stripe
 * Raw body supplied by index.js. On checkout.session.completed, create the
 * Payload order (idempotent) and send emails. Always 200 after signature
 * verification so Stripe stops retrying; a missed one is caught by the
 * hourly reconcile cron.
 */
router.post('/webhooks/stripe', async (req, res) => {
  let event;
  try {
    event = verifyWebhookSignature(req.body, req.headers['stripe-signature']);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  try {
    await createOrderFromSession(event.data.object, { sendEmails: true });
  } catch (err) {
    console.error('[Webhook] Error handling checkout.session.completed:', err.message);
  }

  res.status(200).json({ received: true });
});

export default router;
