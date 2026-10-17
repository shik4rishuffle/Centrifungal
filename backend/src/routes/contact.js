import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validateContactBody, sanitiseString } from '../utils/validate.js';
import { sendEmail } from '../services/resend.js';
import { contactRelay } from '../emails/contactRelay.js';
import config from '../config.js';

const router = Router();
const rateLimiter = createRateLimiter(3, 15 * 60 * 1000);

/**
 * POST /api/contact
 * Rate-limited + honeypot. Relays the message to the shop owner.
 */
router.post('/contact', rateLimiter, async (req, res, next) => {
  try {
    // Honeypot: silently succeed if the hidden field is filled (bot). Accept the
    // form's field name (phone_confirm) or a generic _honeypot.
    const honeypot = req.body.phone_confirm || req.body._honeypot || req.body.botcheck;
    if (honeypot && honeypot !== '') {
      return res.json({ success: true });
    }

    const { valid, errors } = validateContactBody(req.body);
    if (!valid) {
      const err = new Error('Validation error');
      err.type = 'validation';
      err.details = errors;
      throw err;
    }

    const name = sanitiseString(req.body.name);
    const email = sanitiseString(req.body.email);
    const message = sanitiseString(req.body.message);

    await sendEmail(contactRelay({ name, email, message }, config.contactRecipient));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
