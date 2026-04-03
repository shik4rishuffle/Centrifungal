/**
 * Centrifungal - Product Detail Page
 * Fetches product data by slug, renders detail view with gallery,
 * variant selector, quantity stepper, and add-to-cart integration.
 */

import { addItem } from './cart.js';

function getApiUrl() { return window.__CENTRIFUNGAL.getApiUrl(); }

const CATEGORY_ICONS = {
  'grow-logs': '\u{1F344}',
  'colonised-dowels': '\u{1FAB5}',
  'diy-kits': '\u{1F4E6}',
  'tinctures': '\u{1F9EA}'
};

const CATEGORY_DISPLAY_NAMES = {
  'grow-logs': 'Grow Logs',
  'colonised-dowels': 'Colonised Dowels',
  'diy-kits': 'DIY Kits',
  'tinctures': 'Tinctures'
};

/** Format pence as a display price string. */
function formatPrice(pence) {
  return `\u00a3${(pence / 100).toFixed(2)}`;
}

/** Extract the product slug from the URL. Supports ?slug=x and /product/x. */
function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('slug')) {
    return params.get('slug');
  }

  const match = window.location.pathname.match(/\/product\/([^/]+)/);
  if (match) {
    return match[1];
  }

  return null;
}

/** Show a toast notification. */
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

// -- State --
let currentProduct = null;
let selectedVariantIndex = 0;
let quantity = 1;

// -- Rendering --

function renderLoading() {
  const main = document.getElementById('product-main');
  if (!main) return;

  main.innerHTML = `
    <div class="product-loading">
      <div class="product-loading__spinner" aria-label="Loading product"></div>
      <p>Loading product...</p>
    </div>
  `;
}

function renderError(message) {
  const main = document.getElementById('product-main');
  if (!main) return;

  main.innerHTML = `
    <div class="product-error">
      <p class="product-error__message">${message}</p>
      <a href="/shop.html" class="btn btn-outline">Back to Shop</a>
    </div>
  `;
}

function renderBreadcrumb(product) {
  const el = document.getElementById('product-breadcrumb');
  if (!el) return;

  el.innerHTML = `
    <a href="/">Home</a>
    <span class="product-breadcrumb__separator" aria-hidden="true">/</span>
    <a href="/shop.html">Shop</a>
    <span class="product-breadcrumb__separator" aria-hidden="true">/</span>
    <span class="product-breadcrumb__current" aria-current="page">${product.name}</span>
  `;
}

function renderGallery(product) {
  const icon = CATEGORY_ICONS[product.category] || '\u{1F344}';
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: null, alt: product.name }];

  const mainImage = images[0];
  const mainContent = mainImage.url
    ? `<img src="${mainImage.url}" alt="${mainImage.alt}" id="gallery-main-img" width="600" height="600" decoding="async">`
    : `<div class="img-placeholder" aria-hidden="true" id="gallery-main-img">${icon}</div>`;

  let thumbsHtml = '';
  if (images.length > 1) {
    thumbsHtml = `
      <div class="product-gallery__thumbs" role="listbox" aria-label="Product image thumbnails">
        ${images.map((img, i) => {
          const activeClass = i === 0 ? ' product-gallery__thumb--active' : '';
          const thumbContent = img.url
            ? `<img src="${img.url}" alt="${img.alt}" width="100" height="100" loading="lazy" decoding="async">`
            : `<div class="img-placeholder" aria-hidden="true">${icon}</div>`;
          return `
            <button class="product-gallery__thumb${activeClass}"
              role="option"
              aria-selected="${i === 0}"
              aria-label="View image ${i + 1}"
              data-gallery-index="${i}">
              ${thumbContent}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  return `
    <div class="product-gallery">
      <div class="product-gallery__main">${mainContent}</div>
      ${thumbsHtml}
    </div>
  `;
}

function renderVariants(product) {
  const variants = product.variants;
  if (!variants || variants.length <= 1) return '';

  const options = variants.map((v, i) => {
    const outOfStockClass = !v.in_stock ? ' product-variants__option--out-of-stock' : '';
    const checked = i === selectedVariantIndex ? ' checked' : '';
    const disabled = !v.in_stock ? ' disabled' : '';

    return `
      <div class="product-variants__option${outOfStockClass}">
        <input type="radio" name="variant" id="variant-${i}"
          value="${i}"${checked}${disabled}
          aria-label="${v.name}${!v.in_stock ? ' - Out of stock' : ''}">
        <label for="variant-${i}">${v.name}</label>
      </div>
    `;
  }).join('');

  return `
    <fieldset class="product-variants">
      <legend class="product-variants__label">Size</legend>
      <div class="product-variants__options">
        ${options}
      </div>
    </fieldset>
  `;
}

function renderProductInfo(product) {
  const variant = product.variants[selectedVariantIndex];
  const hasVariants = product.variants.length > 1;
  const anyInStock = product.variants.some(v => v.in_stock);
  const selectedInStock = variant.in_stock;

  return `
    <div class="product-info">
      <span class="product-info__category">${CATEGORY_DISPLAY_NAMES[product.category] || product.category}</span>
      <h1 class="product-info__title">${product.name}</h1>
      <div class="product-info__price" id="product-price">${formatPrice(variant.price_pence)}</div>
      <p class="product-info__description">${product.description}</p>

      ${renderVariants(product)}

      <div class="product-add-to-cart">
        <div class="qty-selector" data-qty-selector>
          <button class="qty-selector__btn" data-qty-dec aria-label="Decrease quantity" ${quantity <= 1 ? 'disabled' : ''}>-</button>
          <input class="qty-selector__input" type="number" data-qty-input
            value="${quantity}" min="1" max="99"
            aria-label="Quantity">
          <button class="qty-selector__btn" data-qty-inc aria-label="Increase quantity" ${quantity >= 99 ? 'disabled' : ''}>+</button>
        </div>
        <button class="btn btn-primary btn-lg product-add-to-cart__btn" id="add-to-cart-btn"
          ${!selectedInStock ? 'disabled' : ''}>
          ${selectedInStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
}

function renderLongDescription(product) {
  const el = document.getElementById('product-long-description');
  if (!el) return;

  // Use long_description if available, otherwise a fallback
  const longDesc = product.long_description;
  if (!longDesc) {
    el.style.display = 'none';
    return;
  }

  el.innerHTML = `
    <div class="product-long-description__inner">
      <h2 class="product-long-description__title">About this product</h2>
      <div class="product-long-description__body">${longDesc}</div>
    </div>
  `;
}

function renderProduct(product) {
  const main = document.getElementById('product-main');
  if (!main) return;

  document.title = `${product.name} - Centrifungal`;

  renderBreadcrumb(product);

  main.innerHTML = `
    <div class="product-detail">
      ${renderGallery(product)}
      ${renderProductInfo(product)}
    </div>
  `;

  renderLongDescription(product);
  bindProductEvents();
}

// -- Events --

function bindProductEvents() {
  // Variant selection
  document.querySelectorAll('input[name="variant"]').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedVariantIndex = parseInt(radio.value, 10);
      updatePriceAndButton();
    });
  });

  // Quantity stepper
  const qtyInput = document.querySelector('[data-qty-input]');
  const decBtn = document.querySelector('[data-qty-dec]');
  const incBtn = document.querySelector('[data-qty-inc]');

  if (qtyInput && decBtn && incBtn) {
    decBtn.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        qtyInput.value = quantity;
        updateQtyButtons();
      }
    });

    incBtn.addEventListener('click', () => {
      if (quantity < 99) {
        quantity++;
        qtyInput.value = quantity;
        updateQtyButtons();
      }
    });

    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 99) val = 99;
      quantity = val;
      qtyInput.value = quantity;
      updateQtyButtons();
    });
  }

  // Gallery thumbnails
  document.querySelectorAll('[data-gallery-index]').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const index = parseInt(thumb.dataset.galleryIndex, 10);
      swapMainImage(index);
    });
  });

  // Add to cart
  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddToCart);
  }
}

function updatePriceAndButton() {
  if (!currentProduct) return;

  const variant = currentProduct.variants[selectedVariantIndex];
  const priceEl = document.getElementById('product-price');
  const addBtn = document.getElementById('add-to-cart-btn');

  if (priceEl) {
    priceEl.textContent = formatPrice(variant.price_pence);
  }

  if (addBtn) {
    if (variant.in_stock) {
      addBtn.disabled = false;
      addBtn.textContent = 'Add to Cart';
    } else {
      addBtn.disabled = true;
      addBtn.textContent = 'Out of Stock';
    }
  }
}

function updateQtyButtons() {
  const decBtn = document.querySelector('[data-qty-dec]');
  const incBtn = document.querySelector('[data-qty-inc]');
  if (decBtn) decBtn.disabled = quantity <= 1;
  if (incBtn) incBtn.disabled = quantity >= 99;
}

function swapMainImage(index) {
  if (!currentProduct) return;

  const images = currentProduct.images && currentProduct.images.length > 0
    ? currentProduct.images
    : [{ url: null, alt: currentProduct.name }];

  const image = images[index];
  if (!image) return;

  const mainContainer = document.querySelector('.product-gallery__main');
  if (!mainContainer) return;

  const icon = CATEGORY_ICONS[currentProduct.category] || '\u{1F344}';

  if (image.url) {
    mainContainer.innerHTML = `<img src="${image.url}" alt="${image.alt}" id="gallery-main-img" width="600" height="600" decoding="async">`;
  } else {
    mainContainer.innerHTML = `<div class="img-placeholder" aria-hidden="true" id="gallery-main-img">${icon}</div>`;
  }

  // Update active thumbnail
  document.querySelectorAll('.product-gallery__thumb').forEach((thumb, i) => {
    const isActive = i === index;
    thumb.classList.toggle('product-gallery__thumb--active', isActive);
    thumb.setAttribute('aria-selected', isActive);
  });
}

function handleAddToCart() {
  if (!currentProduct) return;

  const variant = currentProduct.variants[selectedVariantIndex];
  if (!variant || !variant.in_stock) return;

  const productData = {
    id: currentProduct.id,
    name: currentProduct.name,
    slug: currentProduct.slug,
    image: currentProduct.images?.[0]?.url || null
  };

  const variantData = {
    id: variant.id,
    name: variant.name,
    price: variant.price_pence / 100
  };

  addItem(productData, variantData, quantity);

  showToast(
    'success',
    'Added to cart',
    `${currentProduct.name}${currentProduct.variants.length > 1 ? ` (${variant.name})` : ''} x${quantity} added to your cart.`
  );

  // Dispatch cart-updated so the header badge refreshes
  window.dispatchEvent(new CustomEvent('cart-updated'));
}

// -- Init --

async function init() {
  renderLoading();

  const slug = getSlugFromUrl();
  if (!slug) {
    renderError('No product specified. Please select a product from the shop.');
    return;
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/products/${encodeURIComponent(slug)}`);
    if (response.status === 404) {
      renderError('Product not found. It may have been removed or the link is incorrect.');
      return;
    }
    if (!response.ok) {
      throw new Error(`Failed to load product (${response.status})`);
    }

    const json = await response.json();
    const product = json.data;

    if (!product) {
      renderError('Product not found. It may have been removed or the link is incorrect.');
      return;
    }

    // Default to first in-stock variant if available
    const firstInStockIndex = product.variants.findIndex(v => v.in_stock);
    selectedVariantIndex = firstInStockIndex >= 0 ? firstInStockIndex : 0;

    currentProduct = product;
    renderProduct(product);
  } catch (error) {
    console.error('Product: failed to fetch product data:', error);
    renderError('Unable to load product details. Please try again later.');
  }
}

document.addEventListener('DOMContentLoaded', init);
