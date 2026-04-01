/**
 * Centrifungal - Shop Page
 * Fetches products and renders a categorised, responsive product grid.
 */

const CATEGORY_ORDER = ['Grow Logs', 'Colonised Dowels', 'DIY Kits', 'Tinctures'];

const CATEGORY_DESCRIPTIONS = {
  'Grow Logs': 'Ready-to-fruit logs - just mist and harvest.',
  'Colonised Dowels': 'Inoculate your own logs for years of harvests.',
  'DIY Kits': 'Everything you need to grow mushrooms at home.',
  'Tinctures': 'Double-extracted mushroom supplements for daily wellness.'
};

const CATEGORY_ICONS = {
  'Grow Logs': '\u{1F344}',
  'Colonised Dowels': '\u{1FAB5}',
  'DIY Kits': '\u{1F4E6}',
  'Tinctures': '\u{1F9EA}'
};

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

function getLowestPrice(variants) {
  return Math.min(...variants.map(v => v.price));
}

function getHighestPrice(variants) {
  return Math.max(...variants.map(v => v.price));
}

function renderPriceRange(variants) {
  const low = getLowestPrice(variants);
  const high = getHighestPrice(variants);
  if (low === high) {
    return formatPrice(low);
  }
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}

function renderBadge(product) {
  if (!product.inStock) {
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
  const isOutOfStock = !product.inStock;
  const cardClasses = `product-card${isOutOfStock ? ' product-card--out-of-stock' : ''}`;
  const badge = renderBadge(product);

  return `
    <a href="/product/${product.slug}" class="${cardClasses}" aria-label="${product.name}${isOutOfStock ? ' - Out of Stock' : ''}">
      <div class="product-card__image">
        <div class="img-placeholder" aria-hidden="true">
          ${CATEGORY_ICONS[product.category] || '\u{1F344}'}
        </div>
        ${badge ? `<div class="product-card__badge">${badge}</div>` : ''}
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${product.category}</span>
        <h3 class="product-card__title">${product.name}</h3>
        <p class="product-card__description">${product.description}</p>
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

  return `
    <section class="shop-category" id="category-${category.toLowerCase().replace(/\s+/g, '-')}">
      <div class="shop-category__header">
        <h2 class="shop-category__title">${category}</h2>
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
    const response = await fetch('/data/products.json');
    if (!response.ok) {
      throw new Error(`Failed to load products (${response.status})`);
    }
    const data = await response.json();
    renderShop(data.products || []);
  } catch (error) {
    console.error('Shop: failed to fetch products:', error);
    renderError('Unable to load products. Please try again later.');
  }
}

document.addEventListener('DOMContentLoaded', init);
