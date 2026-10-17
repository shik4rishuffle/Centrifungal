import { shell } from './_shared.js';

/**
 * Contact-form relay to the shop owner. Copy ported from the original
 * contact-form template ("New Contact Form Submission").
 *
 * @param {Object} data - { name, email, message }
 * @param {string} ownerEmail
 * @returns {{ to, subject, html, replyTo }}
 */
export function contactRelay(data, ownerEmail) {
  const escaped = String(data.message || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const html = shell(`
  <h1 style="font-size:22px;margin-bottom:12px;">New Contact Form Submission</h1>
  <p><strong>Name:</strong> ${data.name}</p>
  <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
  <h2 style="font-size:16px;margin-top:16px;">Message</h2>
  <p style="line-height:1.6;white-space:pre-wrap;">${escaped}</p>
  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
  <p style="color:#666;font-size:13px;">Reply directly to this email to respond to ${data.name}.</p>
  `);

  return {
    to: ownerEmail,
    subject: 'New Contact Form Submission',
    html,
    replyTo: data.email,
  };
}
