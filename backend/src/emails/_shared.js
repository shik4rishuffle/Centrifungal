/** Shared email helpers. */

export const formatPrice = (pence) => `£${((Number(pence) || 0) / 100).toFixed(2)}`;

/** Render order line items as table rows. items: [{ name, quantity, price }]. */
export function itemRows(items = []) {
  return items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('');
}

/** Render a shippingAddress group as multi-line HTML. */
export function addressLines(addr = {}) {
  return [addr.line1, addr.line2, addr.city, addr.county, addr.postcode]
    .filter(Boolean)
    .join('<br>');
}

/** Wrap body HTML in a simple branded container. */
export function shell(inner) {
  return `<div style="max-width:560px;margin:0 auto;font-family:sans-serif;color:#333;">${inner}</div>`.trim();
}
