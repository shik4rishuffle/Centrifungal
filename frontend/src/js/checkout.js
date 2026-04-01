/**
 * Centrifungal - Checkout Module
 * Handles Stripe checkout initiation and post-checkout return flow.
 */

import { getCart, clearCart } from './cart.js';

const CART_TOKEN_KEY = 'centrifungal_cart_token';

/**
 * Get the server-side cart token from localStorage.
 * This is set by the cart API when items are synced to the backend.
 * @returns {string|null}
 */
function getCartToken() {
  return localStorage.getItem(CART_TOKEN_KEY);
}

/**
 * Initiate checkout by posting the cart to the backend.
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

  const cartToken = getCartToken();
  if (!cartToken) {
    return 'No cart session found. Please add items to your cart and try again.';
  }

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cart-Token': cartToken,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const message = data?.message || data?.error;

      if (response.status === 401) {
        return 'Your cart session has expired. Please add items again.';
      }
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
 * Clears the local cart and cart token so the user starts fresh.
 */
export function handleCheckoutReturn() {
  clearCart();
  localStorage.removeItem(CART_TOKEN_KEY);
}
