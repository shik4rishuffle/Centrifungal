import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addItem,
  removeItem,
  updateQuantity,
  getCart,
  getCartCount,
  getCartTotal,
  clearCart,
} from '../cart.js';

// -- Fixtures ----------------------------------------------------------------

function makeProduct(overrides = {}) {
  return {
    id: 1,
    name: 'Lions Mane Tincture',
    slug: 'lions-mane-tincture',
    image: '/images/lions-mane.jpg',
    ...overrides,
  };
}

function makeVariant(overrides = {}) {
  return {
    id: 10,
    name: '30 ml',
    price: 1500,
    ...overrides,
  };
}

// -- Mocks -------------------------------------------------------------------

const store = {};

const localStorageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = value; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};

const dispatchedEvents = [];

beforeEach(() => {
  // Reset store
  Object.keys(store).forEach((k) => delete store[k]);

  // Reset spies
  vi.restoreAllMocks();
  dispatchedEvents.length = 0;

  // Stub globals
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('window', {
    dispatchEvent: vi.fn((event) => { dispatchedEvents.push(event); }),
  });
  vi.stubGlobal('CustomEvent', class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail ?? null;
    }
  });
});

// -- Tests -------------------------------------------------------------------

describe('cart.js', () => {
  // ---- addItem -------------------------------------------------------------

  describe('addItem', () => {
    it('adds an item with correct product, variant, and quantity', () => {
      const product = makeProduct();
      const variant = makeVariant();

      const items = addItem(product, variant, 1);

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.image,
        variantId: variant.id,
        variantName: variant.name,
        price: variant.price,
        quantity: 1,
      });
    });

    it('increments quantity when the same item is added again', () => {
      const product = makeProduct();
      const variant = makeVariant();

      addItem(product, variant, 2);
      const items = addItem(product, variant, 3);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('treats different variants as separate items', () => {
      const product = makeProduct();
      const v1 = makeVariant({ id: 10, name: '30 ml' });
      const v2 = makeVariant({ id: 20, name: '60 ml', price: 2500 });

      addItem(product, v1, 1);
      const items = addItem(product, v2, 1);

      expect(items).toHaveLength(2);
    });
  });

  // ---- updateQuantity (increment / decrement) ------------------------------

  describe('updateQuantity', () => {
    it('updates quantity and totals reflect the change', () => {
      const product = makeProduct();
      const variant = makeVariant({ price: 1000 });
      addItem(product, variant, 2);

      const itemId = `${product.id}__${variant.id}`;
      const items = updateQuantity(itemId, 5);

      expect(items[0].quantity).toBe(5);
      // Verify totals via helper
      expect(getCartTotal()).toBe(5000);
    });

    it('removes item when quantity is set to zero', () => {
      const product = makeProduct();
      const variant = makeVariant();
      addItem(product, variant, 1);

      const itemId = `${product.id}__${variant.id}`;
      const items = updateQuantity(itemId, 0);

      expect(items).toHaveLength(0);
    });
  });

  // ---- removeItem ----------------------------------------------------------

  describe('removeItem', () => {
    it('removes the item and updates totals', () => {
      const product = makeProduct();
      const v1 = makeVariant({ id: 10, price: 1000 });
      const v2 = makeVariant({ id: 20, price: 2000 });

      addItem(product, v1, 1);
      addItem(product, v2, 1);

      const itemId = `${product.id}__${v1.id}`;
      const items = removeItem(itemId);

      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe(20);
      expect(getCartTotal()).toBe(2000);
    });

    it('results in an empty cart when the last item is removed', () => {
      const product = makeProduct();
      const variant = makeVariant();
      addItem(product, variant, 1);

      const itemId = `${product.id}__${variant.id}`;
      const items = removeItem(itemId);

      expect(items).toHaveLength(0);
      expect(getCart()).toEqual([]);
      expect(getCartCount()).toBe(0);
      expect(getCartTotal()).toBe(0);
    });
  });

  // ---- getCartCount --------------------------------------------------------

  describe('getCartCount', () => {
    it('returns total item count across all line items', () => {
      const product = makeProduct();
      addItem(product, makeVariant({ id: 10 }), 3);
      addItem(product, makeVariant({ id: 20 }), 2);

      expect(getCartCount()).toBe(5);
    });

    it('returns 0 for an empty cart', () => {
      expect(getCartCount()).toBe(0);
    });
  });

  // ---- getCartTotal --------------------------------------------------------

  describe('getCartTotal', () => {
    it('returns the correct total in pence', () => {
      const product = makeProduct();
      addItem(product, makeVariant({ id: 10, price: 1500 }), 2);
      addItem(product, makeVariant({ id: 20, price: 800 }), 1);

      // (1500 * 2) + (800 * 1) = 3800
      expect(getCartTotal()).toBe(3800);
    });
  });

  // ---- clearCart ------------------------------------------------------------

  describe('clearCart', () => {
    it('empties all items from the cart', () => {
      addItem(makeProduct(), makeVariant(), 3);

      clearCart();

      expect(getCart()).toEqual([]);
      expect(getCartCount()).toBe(0);
      expect(getCartTotal()).toBe(0);
    });
  });

  // ---- cart-updated event --------------------------------------------------

  describe('cart-updated event', () => {
    it('fires a cart-updated CustomEvent on addItem', () => {
      addItem(makeProduct(), makeVariant(), 1);

      const event = dispatchedEvents.at(-1);
      expect(event.type).toBe('cart-updated');
      expect(event.detail.items).toHaveLength(1);
    });

    it('fires on removeItem', () => {
      addItem(makeProduct(), makeVariant(), 1);
      dispatchedEvents.length = 0;

      removeItem(`${makeProduct().id}__${makeVariant().id}`);

      expect(dispatchedEvents).toHaveLength(1);
      expect(dispatchedEvents[0].type).toBe('cart-updated');
    });

    it('fires on updateQuantity', () => {
      addItem(makeProduct(), makeVariant(), 1);
      dispatchedEvents.length = 0;

      updateQuantity(`${makeProduct().id}__${makeVariant().id}`, 5);

      expect(dispatchedEvents).toHaveLength(1);
      expect(dispatchedEvents[0].type).toBe('cart-updated');
    });

    it('fires on clearCart', () => {
      addItem(makeProduct(), makeVariant(), 1);
      dispatchedEvents.length = 0;

      clearCart();

      expect(dispatchedEvents).toHaveLength(1);
      expect(dispatchedEvents[0].type).toBe('cart-updated');
    });
  });

  // ---- localStorage persistence --------------------------------------------

  describe('localStorage persistence', () => {
    it('saves to localStorage on every mutation', () => {
      addItem(makeProduct(), makeVariant(), 1);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'centrifungal_cart',
        expect.any(String)
      );

      const saved = JSON.parse(store['centrifungal_cart']);
      expect(saved).toHaveLength(1);
      expect(saved[0].quantity).toBe(1);
    });

    it('loads cart from localStorage on init', () => {
      const seeded = [{
        itemId: '1__10',
        productId: 1,
        productName: 'Lions Mane Tincture',
        productSlug: 'lions-mane-tincture',
        productImage: '/images/lions-mane.jpg',
        variantId: 10,
        variantName: '30 ml',
        price: 1500,
        quantity: 2,
      }];

      store['centrifungal_cart'] = JSON.stringify(seeded);

      const items = getCart();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
      expect(items[0].productName).toBe('Lions Mane Tincture');
    });
  });
});
