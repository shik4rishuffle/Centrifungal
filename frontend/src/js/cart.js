/**
 * Centrifungal - Cart State Module
 * Client-side cart using localStorage with custom event dispatch.
 */

const STORAGE_KEY = 'centrifungal_cart';
const CART_EVENT = 'cart-updated';

function loadCart() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to load cart from localStorage:', e);
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save cart to localStorage:', e);
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { items } }));
}

function generateItemId(productId, variantId) {
  return `${productId}__${variantId}`;
}

/**
 * Add an item to the cart or increment its quantity.
 * @param {Object} product - { id, name, slug, image }
 * @param {Object} variant - { id, name, price }
 * @param {number} quantity - quantity to add (default 1)
 */
export function addItem(product, variant, quantity = 1) {
  const items = loadCart();
  const itemId = generateItemId(product.id, variant.id);
  const existing = items.find(item => item.itemId === itemId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      itemId,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.image || null,
      variantId: variant.id,
      variantName: variant.name,
      price: variant.price,
      quantity
    });
  }

  saveCart(items);
  return items;
}

/**
 * Remove an item entirely from the cart.
 * @param {string} itemId
 */
export function removeItem(itemId) {
  let items = loadCart();
  items = items.filter(item => item.itemId !== itemId);
  saveCart(items);
  return items;
}

/**
 * Update the quantity of an item. Removes if quantity <= 0.
 * @param {string} itemId
 * @param {number} quantity
 */
export function updateQuantity(itemId, quantity) {
  let items = loadCart();
  if (quantity <= 0) {
    items = items.filter(item => item.itemId !== itemId);
  } else {
    const existing = items.find(item => item.itemId === itemId);
    if (existing) {
      existing.quantity = quantity;
    }
  }
  saveCart(items);
  return items;
}

/**
 * Get all cart items.
 * @returns {Array}
 */
export function getCart() {
  return loadCart();
}

/**
 * Get total number of items in the cart.
 * @returns {number}
 */
export function getCartCount() {
  return loadCart().reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get the cart total price.
 * @returns {number}
 */
export function getCartTotal() {
  return loadCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Clear the entire cart.
 */
export function clearCart() {
  saveCart([]);
}
