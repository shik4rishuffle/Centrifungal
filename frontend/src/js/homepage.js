/**
 * Homepage - Product card rendering and interactions
 */

(function () {
  'use strict';

  /**
   * Format price from pence to pounds string
   */
  function formatPrice(pence) {
    return '\u00A3' + (pence / 100).toFixed(2);
  }

  /**
   * Build a product card HTML string from product data
   */
  function renderProductCard(product) {
    const price = formatPrice(product.base_price_pence);
    const badgeHtml = product.badge
      ? `<span class="badge badge--${product.badge}">${product.badge}</span>`
      : '';

    return `
      <article class="product-card">
        <a href="/shop/${product.slug}" class="product-card__image" aria-label="${product.name}">
          <div class="product-card__placeholder" role="img" aria-label="${product.images[0].alt}"></div>
          ${badgeHtml ? `<div class="product-card__badge">${badgeHtml}</div>` : ''}
        </a>
        <div class="product-card__body">
          <span class="product-card__category">${product.category}</span>
          <h3 class="product-card__title">
            <a href="/shop/${product.slug}">${product.name}</a>
          </h3>
          <p class="product-card__description">${product.description}</p>
          <span class="product-card__price">From ${price}</span>
        </div>
        <div class="product-card__footer">
          <a href="/shop/${product.slug}" class="btn btn-primary">View Product</a>
        </div>
      </article>
    `;
  }

  /**
   * Fetch products and render into the grid
   */
  async function loadFeaturedProducts() {
    const grid = document.getElementById('featured-products-grid');
    if (!grid) return;

    try {
      const response = await fetch('/data/products.json');
      if (!response.ok) throw new Error('Failed to load products');
      const products = await response.json();

      // Take up to 4 featured products
      const featured = products.slice(0, 4);
      grid.innerHTML = featured.map(renderProductCard).join('');
    } catch (err) {
      console.warn('Could not load products from API, using inline data.', err);
      // Inline fallback is already in the HTML as a noscript-friendly measure
    }
  }

  /**
   * Sticky header scroll effect
   */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          header.classList.toggle('site-header--scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * Mobile navigation toggle
   */
  function initMobileNav() {
    const hamburger = document.querySelector('.site-header__hamburger');
    const nav = document.querySelector('.site-header__nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', function () {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('site-header__nav--open', !expanded);
    });
  }

  /**
   * Initialise everything on DOMContentLoaded
   */
  document.addEventListener('DOMContentLoaded', function () {
    loadFeaturedProducts();
    initHeaderScroll();
    initMobileNav();
  });
})();
