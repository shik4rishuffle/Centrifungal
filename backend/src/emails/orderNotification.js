import { formatPrice, itemRows, addressLines, shell } from './_shared.js';

/**
 * New-order alert for the shop owner (so they know to fulfil). Not in the
 * original template set - added so orders don't go unnoticed in the admin.
 *
 * @param {Object} order
 * @param {string} ownerEmail
 * @returns {{ to, subject, html }}
 */
export function orderNotification(order, ownerEmail) {
  const html = shell(`
  <h1 style="font-size:22px;margin-bottom:4px;">New order received</h1>
  <p style="color:#666;margin-top:0;">Reference: <strong>${order.orderRef}</strong></p>

  <h2 style="font-size:16px;">Customer</h2>
  <p>${order.customerName || ''}<br>
     <a href="mailto:${order.customerEmail}">${order.customerEmail}</a></p>

  <h2 style="font-size:16px;">Items</h2>
  <table style="width:100%;border-collapse:collapse;margin:8px 0;">
    <thead>
      <tr style="border-bottom:2px solid #333;">
        <th style="text-align:left;padding:6px 0;">Item</th>
        <th style="text-align:center;padding:6px 0;">Qty</th>
        <th style="text-align:right;padding:6px 0;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows(order.items)}</tbody>
  </table>

  <p>Shipping: ${order.shippingPence === 0 ? 'Free' : formatPrice(order.shippingPence)}<br>
     <strong>Total: ${formatPrice(order.totalPence)}</strong></p>

  <h2 style="font-size:16px;">Shipping Address</h2>
  <p style="line-height:1.6;">${addressLines(order.shippingAddress)}</p>
  `);

  return {
    to: ownerEmail,
    subject: `New order - ${order.orderRef}`,
    html,
  };
}
