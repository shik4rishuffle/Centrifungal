import { Resend } from 'resend';
import config from '../config.js';

const resend = new Resend(config.resendApiKey);

/**
 * Send an email via Resend.
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.replyTo]
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  try {
    const payload = { from: config.fromEmail, to, subject, html };
    if (replyTo) payload.replyTo = replyTo;

    const { error } = await resend.emails.send(payload);
    if (error) {
      console.error('[Resend] API returned error:', error);
      const wrapped = new Error('Email send failed');
      wrapped.type = 'email';
      wrapped.statusCode = 502;
      throw wrapped;
    }
  } catch (err) {
    if (err.type === 'email') throw err;
    console.error('[Resend] Failed to send email:', err.message);
    const wrapped = new Error('Email send failed');
    wrapped.type = 'email';
    wrapped.statusCode = 502;
    throw wrapped;
  }
}
