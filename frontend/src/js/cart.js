/**
 * Centrifungal - Cart State Module
 * Client-side cart in localStorage. Items are keyed by product slug + variant
 * SKU (the stable keys the backend checkout expects). Prices are in PENCE.
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

function generateItemId(slug, sku) {
  return `${slug}__${sku}`;
}

/**
 * Add an item or increment its quantity.
 * @param {Object} product - { name, slug, image }
 * @param {Object} variant - { sku, variantName, pricePence }
 * @param {number} quantity
 */
export function addItem(product, variant, quantity = 1) {
  const items = loadCart();
  const itemId = generateItemId(product.slug, variant.sku);
  const existing = items.find((item) => item.itemId === itemId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      itemId,
      slug: product.slug,
      name: product.name,
      image: product.image || null,
      sku: variant.sku,
      variantName: variant.variantName,
      pricePence: variant.pricePence,
      quantity,
    });
  }

  saveCart(items);
  return items;
}

export function removeItem(itemId) {
  let items = loadCart();
  items = items.filter((item) => item.itemId !== itemId);
  saveCart(items);
  return items;
}

export function updateQuantity(itemId, quantity) {
  let items = loadCart();
  if (quantity <= 0) {
    items = items.filter((item) => item.itemId !== itemId);
  } else {
    const existing = items.find((item) => item.itemId === itemId);
    if (existing) existing.quantity = quantity;
  }
  saveCart(items);
  return items;
}

export function getCart() {
  return loadCart();
}

export function getCartCount() {
  return loadCart().reduce((sum, item) => sum + item.quantity, 0);
}

/** Cart subtotal in PENCE. */
export function getCartTotal() {
  return loadCart().reduce((sum, item) => sum + item.pricePence * item.quantity, 0);
}

export function clearCart() {
  saveCart([]);
}
