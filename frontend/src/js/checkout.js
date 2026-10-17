/**
 * Centrifungal - Checkout Module
 * Posts the cart to the Node backend, which validates against Payload and
 * returns a Stripe Checkout Session URL to redirect to.
 */

import { getCart, clearCart } from './cart.js';

function getApiUrl() {
  return window.__CENTRIFUNGAL ? window.__CENTRIFUNGAL.getApiUrl() : '';
}

/**
 * Start checkout. Redirects to Stripe on success; returns an error string on failure.
 * @returns {Promise<string|undefined>}
 */
export async function initiateCheckout() {
  const items = getCart();
  if (items.length === 0) {
    return 'Your cart is empty.';
  }

  const payload = {
    items: items.map((item) => ({ slug: item.slug, sku: item.sku, quantity: item.quantity })),
  };

  try {
    const response = await fetch(getApiUrl() + '/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      if (response.status === 409) {
        return 'Some items are no longer available. Please review your cart and try again.';
      }
      const message = data && (data.message || data.error);
      return message || 'Something went wrong. Please try again.';
    }

    const data = await response.json();
    if (!data.sessionUrl) {
      return 'Unable to start checkout. Please try again.';
    }

    window.location.href = data.sessionUrl;
    return undefined;
  } catch (error) {
    console.error('Checkout: network error:', error);
    return 'Unable to reach the server. Please check your connection and try again.';
  }
}

/** Clear the local cart on return from a successful checkout. */
export function handleCheckoutReturn() {
  clearCart();
}
