/**
 * Centrifungal - Product Detail Page
 * Fetches a product by slug from Payload, renders gallery + variant selector +
 * quantity stepper + add-to-cart. Variants are keyed by SKU; prices are pence.
 */

import { addItem } from './cart.js';

const FALLBACK_ICON = '\u{1F344}';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textToParagraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map(function (p) { return p.trim(); })
    .filter(Boolean)
    .map(function (p) { return '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>'; })
    .join('');
}

function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('slug')) return params.get('slug');
  const match = window.location.pathname.match(/\/product\/([^/]+)/);
  return match ? match[1] : null;
}

function categoryOf(product) {
  return product && product.category && typeof product.category === 'object' ? product.category : null;
}

function categoryIcon(product) {
  const cat = categoryOf(product);
  return (cat && cat.icon) || FALLBACK_ICON;
}

function variantAvailable(product, variant) {
  return product.inStock !== false && variant && variant.inStock !== false;
}

// -- State --
let currentProduct = null;
let selectedVariantIndex = 0;
let quantity = 1;

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
    <span class="toast__icon">${type === 'success' ? '✓' : '✗'}</span>
    <div class="toast__content">
      <div class="toast__title">${escapeHtml(title)}</div>
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

function renderLoading() {
  const main = document.getElementById('product-main');
  if (main) main.innerHTML = '<div class="product-loading"><div class="product-loading__spinner" aria-label="Loading product"></div><p>Loading product...</p></div>';
}

function renderError(message) {
  const main = document.getElementById('product-main');
  if (main) main.innerHTML = `<div class="product-error"><p class="product-error__message">${escapeHtml(message)}</p><a href="/shop.html" class="btn btn-outline">Back to Shop</a></div>`;
}

function renderBreadcrumb(product) {
  const el = document.getElementById('product-breadcrumb');
  if (!el) return;
  el.innerHTML = `
    <a href="/">Home</a>
    <span class="product-breadcrumb__separator" aria-hidden="true">/</span>
    <a href="/shop.html">Shop</a>
    <span class="product-breadcrumb__separator" aria-hidden="true">/</span>
    <span class="product-breadcrumb__current" aria-current="page">${escapeHtml(product.name)}</span>
  `;
}

function renderGallery(product) {
  const icon = categoryIcon(product);
  const images = product.images && product.images.length > 0 ? product.images : [null];

  const mainSrc = CMS.imageURL(images[0]);
  const mainAlt = escapeHtml(CMS.imageAlt(images[0], product.name));
  const mainContent = mainSrc
    ? `<img src="${mainSrc}" alt="${mainAlt}" id="gallery-main-img" width="600" height="600" decoding="async">`
    : `<div class="img-placeholder" aria-hidden="true" id="gallery-main-img">${icon}</div>`;

  let thumbsHtml = '';
  if (images.length > 1) {
    thumbsHtml = `
      <div class="product-gallery__thumbs" role="listbox" aria-label="Product image thumbnails">
        ${images.map((img, i) => {
          const activeClass = i === 0 ? ' product-gallery__thumb--active' : '';
          const src = CMS.imageURL(img);
          const alt = escapeHtml(CMS.imageAlt(img, product.name));
          const thumbContent = src
            ? `<img src="${src}" alt="${alt}" width="100" height="100" loading="lazy" decoding="async">`
            : `<div class="img-placeholder" aria-hidden="true">${icon}</div>`;
          return `<button class="product-gallery__thumb${activeClass}" role="option" aria-selected="${i === 0}" aria-label="View image ${i + 1}" data-gallery-index="${i}">${thumbContent}</button>`;
        }).join('')}
      </div>
    `;
  }

  return `<div class="product-gallery"><div class="product-gallery__main">${mainContent}</div>${thumbsHtml}</div>`;
}

function renderVariants(product) {
  const variants = product.variants || [];
  if (variants.length <= 1) return '';

  const options = variants.map((v, i) => {
    const avail = variantAvailable(product, v);
    const outClass = !avail ? ' product-variants__option--out-of-stock' : '';
    const checked = i === selectedVariantIndex ? ' checked' : '';
    const disabled = !avail ? ' disabled' : '';
    return `
      <div class="product-variants__option${outClass}">
        <input type="radio" name="variant" id="variant-${i}" value="${i}"${checked}${disabled}
          aria-label="${escapeHtml(v.variantName)}${!avail ? ' - Out of stock' : ''}">
        <label for="variant-${i}">${escapeHtml(v.variantName)}</label>
      </div>
    `;
  }).join('');

  return `<fieldset class="product-variants"><legend class="product-variants__label">Size</legend><div class="product-variants__options">${options}</div></fieldset>`;
}

function renderProductInfo(product) {
  const cat = categoryOf(product);
  const variant = product.variants[selectedVariantIndex];
  const selectedInStock = variantAvailable(product, variant);

  return `
    <div class="product-info">
      ${cat ? `<span class="product-info__category">${escapeHtml(cat.name)}</span>` : ''}
      <h1 class="product-info__title">${escapeHtml(product.name)}</h1>
      <div class="product-info__price" id="product-price">${CMS.formatPrice(CMS.variantPrice(product, variant))}</div>
      <div class="product-info__description">${textToParagraphs(product.description)}</div>

      ${renderVariants(product)}

      <div class="product-add-to-cart">
        <div class="qty-selector" data-qty-selector>
          <button class="qty-selector__btn" data-qty-dec aria-label="Decrease quantity" ${quantity <= 1 ? 'disabled' : ''}>-</button>
          <input class="qty-selector__input" type="number" data-qty-input value="${quantity}" min="1" max="99" aria-label="Quantity">
          <button class="qty-selector__btn" data-qty-inc aria-label="Increase quantity" ${quantity >= 99 ? 'disabled' : ''}>+</button>
        </div>
        <button class="btn btn-primary btn-lg product-add-to-cart__btn" id="add-to-cart-btn" ${!selectedInStock ? 'disabled' : ''}>
          ${selectedInStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
}

function renderProduct(product) {
  const main = document.getElementById('product-main');
  if (!main) return;

  document.title = (product.metaTitle || product.name) + ' - Centrifungal';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && (product.metaDescription || product.description)) {
    metaDesc.setAttribute('content', product.metaDescription || String(product.description).slice(0, 160));
  }

  renderBreadcrumb(product);
  main.innerHTML = `<div class="product-detail">${renderGallery(product)}${renderProductInfo(product)}</div>`;
  bindProductEvents();
}

function bindProductEvents() {
  document.querySelectorAll('input[name="variant"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      selectedVariantIndex = parseInt(radio.value, 10);
      updatePriceAndButton();
    });
  });

  const qtyInput = document.querySelector('[data-qty-input]');
  const decBtn = document.querySelector('[data-qty-dec]');
  const incBtn = document.querySelector('[data-qty-inc]');
  if (qtyInput && decBtn && incBtn) {
    decBtn.addEventListener('click', () => { if (quantity > 1) { quantity--; qtyInput.value = quantity; updateQtyButtons(); } });
    incBtn.addEventListener('click', () => { if (quantity < 99) { quantity++; qtyInput.value = quantity; updateQtyButtons(); } });
    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 99) val = 99;
      quantity = val; qtyInput.value = quantity; updateQtyButtons();
    });
  }

  document.querySelectorAll('[data-gallery-index]').forEach((thumb) => {
    thumb.addEventListener('click', () => swapMainImage(parseInt(thumb.dataset.galleryIndex, 10)));
  });

  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) addBtn.addEventListener('click', handleAddToCart);
}

function updatePriceAndButton() {
  if (!currentProduct) return;
  const variant = currentProduct.variants[selectedVariantIndex];
  const priceEl = document.getElementById('product-price');
  const addBtn = document.getElementById('add-to-cart-btn');
  if (priceEl) priceEl.textContent = CMS.formatPrice(CMS.variantPrice(currentProduct, variant));
  if (addBtn) {
    const avail = variantAvailable(currentProduct, variant);
    addBtn.disabled = !avail;
    addBtn.textContent = avail ? 'Add to Cart' : 'Out of Stock';
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
  const images = currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images : [null];
  const image = images[index];
  const mainContainer = document.querySelector('.product-gallery__main');
  if (!mainContainer) return;
  const src = CMS.imageURL(image);
  if (src) {
    mainContainer.innerHTML = `<img src="${src}" alt="${escapeHtml(CMS.imageAlt(image, currentProduct.name))}" id="gallery-main-img" width="600" height="600" decoding="async">`;
  } else {
    mainContainer.innerHTML = `<div class="img-placeholder" aria-hidden="true" id="gallery-main-img">${categoryIcon(currentProduct)}</div>`;
  }
  document.querySelectorAll('.product-gallery__thumb').forEach((thumb, i) => {
    const isActive = i === index;
    thumb.classList.toggle('product-gallery__thumb--active', isActive);
    thumb.setAttribute('aria-selected', isActive);
  });
}

function handleAddToCart() {
  if (!currentProduct) return;
  const variant = currentProduct.variants[selectedVariantIndex];
  if (!variantAvailable(currentProduct, variant)) return;

  addItem(
    {
      name: currentProduct.name,
      slug: currentProduct.slug,
      image: CMS.imageURL(currentProduct.images && currentProduct.images[0]) || null,
    },
    {
      sku: variant.sku,
      variantName: variant.variantName,
      pricePence: CMS.variantPrice(currentProduct, variant),
    },
    quantity
  );

  showToast(
    'success',
    'Added to cart',
    `${escapeHtml(currentProduct.name)}${currentProduct.variants.length > 1 ? ` (${escapeHtml(variant.variantName)})` : ''} x${quantity} added to your cart.`
  );
  window.dispatchEvent(new CustomEvent('cart-updated'));
}

async function init() {
  if (typeof CMS === 'undefined') return;
  renderLoading();

  const slug = getSlugFromUrl();
  if (!slug) {
    renderError('No product specified. Please select a product from the shop.');
    return;
  }

  try {
    const product = await CMS.fetchProductBySlug(slug);
    if (!product) {
      renderError('Product not found. It may have been removed or the link is incorrect.');
      return;
    }
    const firstInStock = (product.variants || []).findIndex((v) => variantAvailable(product, v));
    selectedVariantIndex = firstInStock >= 0 ? firstInStock : 0;
    currentProduct = product;
    renderProduct(product);
  } catch (error) {
    console.error('Product: failed to fetch product data:', error);
    renderError('Unable to load product details. Please try again later.');
  }
}

document.addEventListener('DOMContentLoaded', init);
