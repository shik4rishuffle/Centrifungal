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
// Cart is keyed by product slug + variant SKU; prices are in pence.

function makeProduct(overrides = {}) {
  return {
    name: 'Lions Mane Tincture',
    slug: 'lions-mane-tincture',
    image: '/images/lions-mane.jpg',
    ...overrides,
  };
}

function makeVariant(overrides = {}) {
  return {
    sku: 'lm-30',
    variantName: '30 ml',
    pricePence: 1500,
    ...overrides,
  };
}

const itemId = (product, variant) => `${product.slug}__${variant.sku}`;

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
  Object.keys(store).forEach((k) => delete store[k]);
  vi.restoreAllMocks();
  dispatchedEvents.length = 0;

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
  describe('addItem', () => {
    it('adds an item with the correct product, variant, and quantity', () => {
      const product = makeProduct();
      const variant = makeVariant();

      const items = addItem(product, variant, 1);

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        itemId: itemId(product, variant),
        slug: product.slug,
        name: product.name,
        image: product.image,
        sku: variant.sku,
        variantName: variant.variantName,
        pricePence: variant.pricePence,
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

    it('treats different variants (SKUs) as separate items', () => {
      const product = makeProduct();
      const v1 = makeVariant({ sku: 'lm-30', variantName: '30 ml' });
      const v2 = makeVariant({ sku: 'lm-60', variantName: '60 ml', pricePence: 2500 });

      addItem(product, v1, 1);
      const items = addItem(product, v2, 1);

      expect(items).toHaveLength(2);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity and totals reflect the change (pence)', () => {
      const product = makeProduct();
      const variant = makeVariant({ pricePence: 1000 });
      addItem(product, variant, 2);

      const items = updateQuantity(itemId(product, variant), 5);

      expect(items[0].quantity).toBe(5);
      expect(getCartTotal()).toBe(5000);
    });

    it('removes the item when quantity is set to zero', () => {
      const product = makeProduct();
      const variant = makeVariant();
      addItem(product, variant, 1);

      const items = updateQuantity(itemId(product, variant), 0);

      expect(items).toHaveLength(0);
    });
  });

  describe('removeItem', () => {
    it('removes the item and updates totals', () => {
      const product = makeProduct();
      const v1 = makeVariant({ sku: 'lm-30', pricePence: 1000 });
      const v2 = makeVariant({ sku: 'lm-60', pricePence: 2000 });

      addItem(product, v1, 1);
      addItem(product, v2, 1);

      const items = removeItem(itemId(product, v1));

      expect(items).toHaveLength(1);
      expect(items[0].sku).toBe('lm-60');
      expect(getCartTotal()).toBe(2000);
    });

    it('results in an empty cart when the last item is removed', () => {
      const product = makeProduct();
      const variant = makeVariant();
      addItem(product, variant, 1);

      const items = removeItem(itemId(product, variant));

      expect(items).toHaveLength(0);
      expect(getCart()).toEqual([]);
      expect(getCartCount()).toBe(0);
      expect(getCartTotal()).toBe(0);
    });
  });

  describe('getCartCount', () => {
    it('returns total item count across all line items', () => {
      const product = makeProduct();
      addItem(product, makeVariant({ sku: 'lm-30' }), 3);
      addItem(product, makeVariant({ sku: 'lm-60' }), 2);

      expect(getCartCount()).toBe(5);
    });

    it('returns 0 for an empty cart', () => {
      expect(getCartCount()).toBe(0);
    });
  });

  describe('getCartTotal', () => {
    it('returns the correct total in pence', () => {
      const product = makeProduct();
      addItem(product, makeVariant({ sku: 'lm-30', pricePence: 1500 }), 2);
      addItem(product, makeVariant({ sku: 'lm-60', pricePence: 800 }), 1);

      // (1500 * 2) + (800 * 1) = 3800
      expect(getCartTotal()).toBe(3800);
    });
  });

  describe('clearCart', () => {
    it('empties all items from the cart', () => {
      addItem(makeProduct(), makeVariant(), 3);

      clearCart();

      expect(getCart()).toEqual([]);
      expect(getCartCount()).toBe(0);
      expect(getCartTotal()).toBe(0);
    });
  });

  describe('cart-updated event', () => {
    it('fires a cart-updated CustomEvent on addItem', () => {
      addItem(makeProduct(), makeVariant(), 1);

      const event = dispatchedEvents.at(-1);
      expect(event.type).toBe('cart-updated');
      expect(event.detail.items).toHaveLength(1);
    });

    it('fires on removeItem', () => {
      const product = makeProduct();
      const variant = makeVariant();
      addItem(product, variant, 1);
      dispatchedEvents.length = 0;

      removeItem(itemId(product, variant));

      expect(dispatchedEvents).toHaveLength(1);
      expect(dispatchedEvents[0].type).toBe('cart-updated');
    });

    it('fires on updateQuantity', () => {
      const product = makeProduct();
      const variant = makeVariant();
      addItem(product, variant, 1);
      dispatchedEvents.length = 0;

      updateQuantity(itemId(product, variant), 5);

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
        itemId: 'lions-mane-tincture__lm-30',
        slug: 'lions-mane-tincture',
        name: 'Lions Mane Tincture',
        image: '/images/lions-mane.jpg',
        sku: 'lm-30',
        variantName: '30 ml',
        pricePence: 1500,
        quantity: 2,
      }];

      store['centrifungal_cart'] = JSON.stringify(seeded);

      const items = getCart();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
      expect(items[0].name).toBe('Lions Mane Tincture');
    });
  });
});
