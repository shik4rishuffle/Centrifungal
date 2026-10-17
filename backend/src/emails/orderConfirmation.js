import { formatPrice, itemRows, addressLines, shell } from './_shared.js';

/**
 * Customer order confirmation. Copy ported from the original Statamic/Laravel
 * order-confirmation template.
 *
 * @param {Object} order - { orderRef, customerName, customerEmail, items,
 *   subtotalPence, shippingPence, totalPence, shippingAddress }
 * @returns {{ to, subject, html }}
 */
export function orderConfirmation(order) {
  const html = shell(`
  <h1 style="font-size:22px;margin-bottom:4px;">Order Confirmation</h1>
  <p>Thank you for your order!</p>
  <p><strong>Order Number:</strong> ${order.orderRef}</p>

  <h2 style="font-size:16px;margin-top:24px;">Items</h2>
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

  <table style="width:100%;margin:8px 0;">
    <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;padding:4px 0;">${formatPrice(order.subtotalPence)}</td></tr>
    <tr><td style="padding:4px 0;">Shipping</td><td style="text-align:right;padding:4px 0;">${order.shippingPence === 0 ? 'Free' : formatPrice(order.shippingPence)}</td></tr>
    <tr style="border-top:2px solid #333;font-weight:bold;"><td style="padding:8px 0;">Total</td><td style="text-align:right;padding:8px 0;">${formatPrice(order.totalPence)}</td></tr>
  </table>

  <h2 style="font-size:16px;margin-top:24px;">Shipping Address</h2>
  <p style="line-height:1.6;">${addressLines(order.shippingAddress)}</p>
  `);

  return {
    to: order.customerEmail,
    subject: `Order Confirmation - ${order.orderRef}`,
    html,
  };
}
