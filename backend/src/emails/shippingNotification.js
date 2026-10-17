import { itemRows, addressLines, shell } from './_shared.js';

/**
 * Customer shipping notification, sent when an order is marked shipped (tracking
 * available). Copy ported verbatim from the original shipping-notification
 * template. Sent by the Royal Mail tracking cron.
 *
 * @param {Object} order - { orderRef, customerName, items, shippingAddress,
 *   trackingNumber, trackingUrl, customerEmail }
 * @returns {{ to, subject, html }}
 */
export function shippingNotification(order) {
  const trackingBlock = order.trackingNumber
    ? `
  <h2 style="font-size:16px;margin-top:24px;">Tracking Information</h2>
  <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
  ${order.trackingUrl ? `<p><strong>Track your parcel:</strong> <a href="${order.trackingUrl}">${order.trackingUrl}</a></p>` : ''}
  <p>Estimated delivery is typically 1-3 working days from dispatch.</p>`
    : `<p>Estimated delivery is typically 1-3 working days from dispatch.</p>`;

  const html = shell(`
  <h1 style="font-size:22px;margin-bottom:4px;">Your Order Has Shipped!</h1>
  <p>Great news, ${order.customerName || 'there'}! Your Centrifungal order is on its way.</p>
  <p><strong>Order Number:</strong> ${order.orderRef}</p>
  ${trackingBlock}

  <h2 style="font-size:16px;margin-top:24px;">Items Shipped</h2>
  <table style="width:100%;border-collapse:collapse;margin:8px 0;">
    <thead>
      <tr style="border-bottom:2px solid #333;">
        <th style="text-align:left;padding:8px 0;">Item</th>
        <th style="text-align:center;padding:8px 0;">Qty</th>
        <th style="text-align:right;padding:8px 0;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows(order.items)}</tbody>
  </table>

  <h2 style="font-size:16px;margin-top:24px;">Shipping Address</h2>
  <p style="line-height:1.6;">${addressLines(order.shippingAddress)}</p>

  <p style="margin-top:24px;">Thank you for shopping with Centrifungal!</p>
  `);

  return {
    to: order.customerEmail,
    subject: `Your Order Has Shipped - ${order.orderRef}`,
    html,
  };
}
