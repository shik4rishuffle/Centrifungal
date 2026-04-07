/**
 * Centrifungal - Shop Page
 * Fetches products and renders a categorised, responsive product grid.
 */

function getApiUrl() { return window.__CENTRIFUNGAL.getApiUrl(); }

const CATEGORY_ORDER = ['grow-logs', 'colonised-dowels', 'diy-kits', 'tinctures'];

const CATEGORY_DISPLAY_NAMES = {
  'grow-logs': 'Grow Logs',
  'colonised-dowels': 'Colonised Dowels',
  'diy-kits': 'DIY Kits',
  'tinctures': 'Tinctures'
};

const CATEGORY_DESCRIPTIONS = {
  'grow-logs': 'Ready-to-fruit logs - just mist and harvest.',
  'colonised-dowels': 'Inoculate your own logs for years of harvests.',
  'diy-kits': 'Everything you need to grow mushrooms at home.',
  'tinctures': 'Double-extracted mushroom supplements for daily wellness.'
};

const CATEGORY_ICONS = {
  'grow-logs': '\u{1F344}',
  'colonised-dowels': '\u{1FAB5}',
  'diy-kits': '\u{1F4E6}',
  'tinctures': '\u{1F9EA}'
};

function formatPrice(pence) {
  return `\u00a3${(pence / 100).toFixed(2)}`;
}

function renderPriceRange(variants) {
  const prices = variants.map(v => v.price_pence);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  if (low === high) {
    return formatPrice(low);
  }
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}

function isProductInStock(product) {
  return product.variants && product.variants.some(v => v.in_stock);
}

function renderBadge(product) {
  if (!isProductInStock(product)) {
    return '<span class="badge badge--out-of-stock">Out of Stock</span>';
  }
  if (product.badge === 'new') {
    return '<span class="badge badge--new">New</span>';
  }
  if (product.badge === 'popular') {
    return '<span class="badge badge--popular">Popular</span>';
  }
  return '';
}

function renderProductCard(product) {
  const isOutOfStock = !isProductInStock(product);
  const cardClasses = `product-card${isOutOfStock ? ' product-card--out-of-stock' : ''}`;
  const badge = renderBadge(product);
  const displayCategory = CATEGORY_DISPLAY_NAMES[product.category] || product.category;

  return `
    <a href="/product/${product.slug}" class="${cardClasses}" aria-label="${product.name}${isOutOfStock ? ' - Out of Stock' : ''}">
      <div class="product-card__image">
        ${(product.images && product.images[0] && product.images[0].url)
          ? `<img src="${product.images[0].url}" alt="${product.images[0].alt || product.name}" loading="lazy" class="product-card__img">`
          : `<div class="img-placeholder" aria-hidden="true">${CATEGORY_ICONS[product.category] || '\u{1F344}'}</div>`}
        ${badge ? `<div class="product-card__badge">${badge}</div>` : ''}
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${displayCategory}</span>
        <h3 class="product-card__title">${product.name}</h3>
        <div class="product-card__price">
          ${isOutOfStock ? '<span class="product-card__price--unavailable">Unavailable</span>' : renderPriceRange(product.variants)}
        </div>
      </div>
      <div class="product-card__footer">
        <span class="btn ${isOutOfStock ? 'btn-outline' : 'btn-primary'} btn-sm" ${isOutOfStock ? 'aria-disabled="true"' : ''}>
          ${isOutOfStock ? 'Sold Out' : 'View Product'}
        </span>
      </div>
    </a>
  `;
}

function renderCategorySection(category, products) {
  const description = CATEGORY_DESCRIPTIONS[category] || '';
  const displayName = CATEGORY_DISPLAY_NAMES[category] || category;

  return `
    <section class="shop-category" id="category-${category}">
      <div class="shop-category__header">
        <h2 class="shop-category__title">${displayName}</h2>
        ${description ? `<p class="shop-category__description">${description}</p>` : ''}
      </div>
      <div class="shop-grid">
        ${products.map(renderProductCard).join('')}
      </div>
    </section>
  `;
}

function renderShop(products) {
  const container = document.getElementById('shop-content');
  if (!container) return;

  // Group products by category
  const grouped = {};
  for (const product of products) {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  }

  // Render in defined order
  const sections = CATEGORY_ORDER
    .filter(cat => grouped[cat] && grouped[cat].length > 0)
    .map(cat => renderCategorySection(cat, grouped[cat]))
    .join('');

  container.innerHTML = sections;
}

function renderError(message) {
  const container = document.getElementById('shop-content');
  if (!container) return;

  container.innerHTML = `
    <div class="shop-error">
      <p class="shop-error__message">${message}</p>
      <button class="btn btn-outline" onclick="location.reload()">Try Again</button>
    </div>
  `;
}

function renderLoading() {
  const container = document.getElementById('shop-content');
  if (!container) return;

  container.innerHTML = `
    <div class="shop-loading">
      <div class="shop-loading__spinner" aria-label="Loading products"></div>
      <p>Loading products...</p>
    </div>
  `;
}

async function init() {
  renderLoading();

  try {
    const response = await fetch(getApiUrl() + '/api/products');
    if (!response.ok) {
      throw new Error(`Failed to load products (${response.status})`);
    }
    const json = await response.json();
    renderShop(json.data || []);
  } catch (error) {
    console.error('Shop: failed to fetch products:', error);
    renderError('Unable to load products. Please try again later.');
  }
}

document.addEventListener('DOMContentLoaded', init);
