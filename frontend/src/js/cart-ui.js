/**
 * Centrifungal - Cart Page UI
 * Renders cart contents, handles quantity changes, and manages interactions.
 */

import { getCart, getCartCount, getCartTotal, updateQuantity, removeItem, clearCart } from './cart.js';
import { initiateCheckout } from './checkout.js';

function formatPrice(pounds) {
  return `\u00a3${pounds.toFixed(2)}`;
}

function showToast(type, title, message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast__icon">${type === 'success' ? '\u2713' : '\u2717'}</span>
    <div class="toast__content">
      <div class="toast__title">${title}</div>
      ${message}
    </div>
    <button class="toast__close" aria-label="Dismiss">&times;</button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast__close');
  function dismiss() {
    toast.classList.add('toast--exiting');
    toast.addEventListener('animationend', () => toast.remove());
  }

  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, 3000);
}

function renderCartItem(item) {
  const lineTotal = item.price * item.quantity;

  return `
    <div class="cart-item" data-item-id="${item.itemId}">
      <div class="cart-item__image">
        <div class="img-placeholder" aria-hidden="true">\u{1F344}</div>
      </div>
      <div class="cart-item__details">
        <div class="cart-item__info">
          <h3 class="cart-item__name">
            <a href="/product/${item.productSlug}">${item.productName}</a>
          </h3>
          <p class="cart-item__variant">${item.variantName}</p>
          <p class="cart-item__unit-price">${formatPrice(item.price)} each</p>
        </div>
        <div class="cart-item__actions">
          <div class="qty-selector" data-qty-selector>
            <button class="qty-selector__btn" data-qty-dec aria-label="Decrease quantity">-</button>
            <input class="qty-selector__input" type="number" data-qty-input
              value="${item.quantity}" min="1" max="99"
              aria-label="Quantity for ${item.productName}">
            <button class="qty-selector__btn" data-qty-inc aria-label="Increase quantity">+</button>
          </div>
          <div class="cart-item__line-total">${formatPrice(lineTotal)}</div>
          <button class="cart-item__remove" data-remove-item="${item.itemId}" aria-label="Remove ${item.productName} from cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div class="cart-empty">
      <div class="cart-empty__icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      </div>
      <h2 class="cart-empty__title">Your cart is empty</h2>
      <p class="cart-empty__text">Looks like you haven't added anything yet. Browse our collection and find something you love.</p>
      <a href="/shop.html" class="btn btn-primary btn-lg">Start Shopping</a>
    </div>
  `;
}

function renderCartSummary(items) {
  const subtotal = getCartTotal();
  const itemCount = getCartCount();

  return `
    <div class="cart-summary">
      <h2 class="cart-summary__title">Order Summary</h2>
      <div class="cart-summary__rows">
        <div class="cart-summary__row">
          <span>Subtotal (${itemCount} item${itemCount !== 1 ? 's' : ''})</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="cart-summary__row cart-summary__row--muted">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div class="cart-summary__divider"></div>
        <div class="cart-summary__row cart-summary__row--total">
          <span>Total</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
      </div>
      <div class="cart-summary__actions">
        <button type="button" class="btn btn-primary btn-lg cart-summary__checkout" id="checkout-btn">Proceed to Checkout</button>
        <a href="/shop.html" class="btn btn-ghost">Continue Shopping</a>
      </div>
    </div>
  `;
}

function renderCart() {
  const container = document.getElementById('cart-content');
  if (!container) return;

  const items = getCart();

  if (items.length === 0) {
    container.innerHTML = renderEmptyState();
    return;
  }

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        <div class="cart-items__header">
          <h2 class="cart-items__title">Your Cart</h2>
          <button class="btn btn-ghost btn-sm" id="clear-cart-btn">Clear Cart</button>
        </div>
        <div class="cart-items__list">
          ${items.map(renderCartItem).join('')}
        </div>
      </div>
      <aside class="cart-aside">
        ${renderCartSummary(items)}
      </aside>
    </div>
  `;

  bindCartEvents();
}

function bindCartEvents() {
  // Quantity steppers
  document.querySelectorAll('[data-qty-selector]').forEach(selector => {
    const input = selector.querySelector('[data-qty-input]');
    const decBtn = selector.querySelector('[data-qty-dec]');
    const incBtn = selector.querySelector('[data-qty-inc]');
    const cartItem = selector.closest('.cart-item');
    const itemId = cartItem?.dataset.itemId;
    if (!itemId) return;

    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 99;

    function updateButtons() {
      const val = parseInt(input.value) || min;
      decBtn.disabled = val <= min;
      incBtn.disabled = val >= max;
    }

    decBtn.addEventListener('click', () => {
      const val = parseInt(input.value) || min;
      if (val > min) {
        const newVal = val - 1;
        input.value = newVal;
        updateQuantity(itemId, newVal);
        renderCart();
      }
    });

    incBtn.addEventListener('click', () => {
      const val = parseInt(input.value) || min;
      if (val < max) {
        const newVal = val + 1;
        input.value = newVal;
        updateQuantity(itemId, newVal);
        renderCart();
      }
    });

    input.addEventListener('change', () => {
      let val = parseInt(input.value);
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;
      input.value = val;
      updateQuantity(itemId, val);
      renderCart();
    });

    updateButtons();
  });

  // Remove buttons
  document.querySelectorAll('[data-remove-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.removeItem;
      const itemEl = btn.closest('.cart-item');
      const name = itemEl?.querySelector('.cart-item__name a')?.textContent || 'Item';

      removeItem(itemId);
      showToast('success', 'Removed', `${name} has been removed from your cart.`);
      renderCart();
    });
  });

  // Clear cart
  const clearBtn = document.getElementById('clear-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearCart();
      showToast('success', 'Cart cleared', 'All items have been removed.');
      renderCart();
    });
  }

  // Checkout
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing...';

      const error = await initiateCheckout();

      if (error) {
        showToast('error', 'Checkout failed', error);
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceed to Checkout';
      }
      // On success, initiateCheckout redirects - no need to re-enable.
    });
  }
}

function updateHeaderCartCount() {
  const badge = document.getElementById('header-cart-count');
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function init() {
  renderCart();
  updateHeaderCartCount();

  // Listen for cart changes (from other tabs or add-to-cart on other pages)
  window.addEventListener('cart-updated', () => {
    updateHeaderCartCount();
  });
}

document.addEventListener('DOMContentLoaded', init);
