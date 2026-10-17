/**
 * Centrifungal - Shop Page
 * Fetches products + categories from Payload and renders a categorised grid.
 * Category names, descriptions and icons come from the editable categories
 * collection (no more hardcoded constants).
 */

(function () {
  'use strict';

  var isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function productUrl(slug) {
    return isLocalDev ? '/product.html?slug=' + encodeURIComponent(slug) : '/product/' + slug;
  }

  function priceRange(product) {
    var prices = (product.variants || []).map(function (v) { return CMS.variantPrice(product, v); });
    if (!prices.length) return CMS.formatPrice(product.price || 0);
    var low = Math.min.apply(null, prices);
    var high = Math.max.apply(null, prices);
    return low === high ? CMS.formatPrice(low) : CMS.formatPrice(low) + ' - ' + CMS.formatPrice(high);
  }

  function renderProductCard(product, category) {
    var available = CMS.productAvailable(product);
    var cardClasses = 'product-card' + (available ? '' : ' product-card--out-of-stock');
    var img = CMS.mainImage(product);
    var imgSrc = CMS.imageURL(img);
    var icon = (category && category.icon) || '\u{1F344}';
    var displayCategory = category ? category.name : '';

    return (
      '<a href="' + productUrl(product.slug) + '" class="' + cardClasses + '" aria-label="' +
        escapeHtml(product.name) + (available ? '' : ' - Out of Stock') + '">' +
        '<div class="product-card__image">' +
          (imgSrc
            ? '<img src="' + imgSrc + '" alt="' + escapeHtml(CMS.imageAlt(img, product.name)) + '" loading="lazy" class="product-card__img">'
            : '<div class="img-placeholder" aria-hidden="true">' + icon + '</div>') +
          (available ? '' : '<div class="product-card__badge"><span class="badge badge--out-of-stock">Out of Stock</span></div>') +
        '</div>' +
        '<div class="product-card__body">' +
          '<span class="product-card__category">' + escapeHtml(displayCategory) + '</span>' +
          '<h3 class="product-card__title">' + escapeHtml(product.name) + '</h3>' +
          '<div class="product-card__price">' +
            (available ? priceRange(product) : '<span class="product-card__price--unavailable">Unavailable</span>') +
          '</div>' +
        '</div>' +
        '<div class="product-card__footer">' +
          '<span class="btn ' + (available ? 'btn-primary' : 'btn-outline') + ' btn-sm"' +
            (available ? '' : ' aria-disabled="true"') + '>' +
            (available ? 'View Product' : 'Sold Out') +
          '</span>' +
        '</div>' +
      '</a>'
    );
  }

  function renderCategorySection(category, products) {
    return (
      '<section class="shop-category" id="category-' + escapeHtml(category.slug) + '">' +
        '<div class="shop-category__header">' +
          '<h2 class="shop-category__title">' + escapeHtml(category.name) + '</h2>' +
          (category.description ? '<p class="shop-category__description">' + escapeHtml(category.description) + '</p>' : '') +
        '</div>' +
        '<div class="shop-grid">' +
          products.map(function (p) { return renderProductCard(p, category); }).join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderShop(products, categories) {
    var container = document.getElementById('shop-content');
    if (!container) return;

    var byCat = {};
    products.forEach(function (p) {
      var slug = CMS.categorySlug(p) || 'uncategorised';
      (byCat[slug] = byCat[slug] || []).push(p);
    });

    var used = {};
    var sections = categories
      .filter(function (cat) { return byCat[cat.slug] && byCat[cat.slug].length; })
      .map(function (cat) { used[cat.slug] = true; return renderCategorySection(cat, byCat[cat.slug]); })
      .join('');

    // Products with a missing/unknown category still get shown, under "More Products".
    var leftover = Object.keys(byCat).filter(function (s) { return !used[s]; });
    if (leftover.length) {
      var others = leftover.reduce(function (acc, s) { return acc.concat(byCat[s]); }, []);
      sections += renderCategorySection({ slug: 'other', name: 'More Products', description: '' }, others);
    }

    container.innerHTML = sections || '<p class="shop-empty">No products yet - check back soon.</p>';
  }

  function renderError(message) {
    var container = document.getElementById('shop-content');
    if (!container) return;
    container.innerHTML =
      '<div class="shop-error"><p class="shop-error__message">' + escapeHtml(message) + '</p>' +
      '<button class="btn btn-outline" data-retry>Try Again</button></div>';
    var retry = container.querySelector('[data-retry]');
    if (retry) retry.addEventListener('click', function () { location.reload(); });
  }

  function renderLoading() {
    var container = document.getElementById('shop-content');
    if (!container) return;
    container.innerHTML =
      '<div class="shop-loading"><div class="shop-loading__spinner" aria-label="Loading products"></div>' +
      '<p>Loading products...</p></div>';
  }

  function init() {
    if (typeof CMS === 'undefined') return;
    renderLoading();

    Promise.all([CMS.fetchProducts({ limit: 200, sort: 'sortOrder' }), CMS.fetchCategories()])
      .then(function (results) {
        var products = results[0] || [];
        var categories = results[1] || [];
        if (!products.length && !categories.length) {
          renderError('Unable to load products. Please try again later.');
          return;
        }
        renderShop(products, categories);
      })
      .catch(function (error) {
        console.error('Shop: failed to load:', error);
        renderError('Unable to load products. Please try again later.');
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
