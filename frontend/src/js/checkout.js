/**
 * Centrifungal - Checkout Module
 * Handles Stripe checkout initiation and post-checkout return flow.
 */

import { getCart, clearCart } from './cart.js';

function getApiUrl() { return window.__CENTRIFUNGAL.getApiUrl(); }

/**
 * Initiate checkout by posting cart items to the backend.
 * On success, redirects the browser to the Stripe checkout URL.
 * On failure, returns an error message string.
 *
 * @returns {Promise<string|undefined>} Error message on failure, undefined on redirect.
 */
export async function initiateCheckout() {
  const items = getCart();
  if (items.length === 0) {
    return 'Your cart is empty.';
  }

  var payload = {
    items: items.map(function (item) {
      return { variantId: item.variantId, quantity: item.quantity };
    })
  };

  try {
    const response = await fetch(getApiUrl() + '/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const message = data?.message || data?.error;

      if (response.status === 422) {
        return message || 'There was a problem with your cart. Please review your items.';
      }
      return message || 'Something went wrong. Please try again.';
    }

    const data = await response.json();

    if (!data.checkout_url) {
      return 'Unable to start checkout. Please try again.';
    }

    window.location.href = data.checkout_url;
    return undefined;
  } catch (error) {
    console.error('Checkout: network error:', error);
    return 'Unable to reach the server. Please check your connection and try again.';
  }
}

/**
 * Handle return from Stripe checkout (success page).
 * Clears the local cart so the user starts fresh.
 */
export function handleCheckoutReturn() {
  clearCart();
}
