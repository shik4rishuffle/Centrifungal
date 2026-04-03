/**
 * Homepage - CMS content loading, product cards, and interactions
 */

(function () {
  'use strict';

  function getApiUrl() { return window.__CENTRIFUNGAL.getApiUrl(); }

  /* ---------- Utility ---------- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  function setLink(id, text, href) {
    var el = document.getElementById(id);
    if (!el) return;
    if (text) el.textContent = text;
    if (href) el.setAttribute('href', href);
  }

  /* ---------- CMS homepage content ---------- */
  function loadHomepageContent() {
    fetch(getApiUrl() + '/api/homepage')
      .then(function (response) {
        if (!response.ok) throw new Error('API returned ' + response.status);
        return response.json();
      })
      .then(function (json) {
        var data = json.data || json;
        applyHomepageContent(data);
      })
      .catch(function (err) {
        // Silently fall back to hardcoded HTML content
        console.warn('Could not load homepage content from CMS.', err);
      });
  }

  function applyHomepageContent(data) {
    // Hero
    if (data.hero) {
      setText('hero-eyebrow', data.hero.eyebrow);
      setText('hero-title', data.hero.title);
      setText('hero-text', data.hero.text);
      if (data.hero.cta_primary) {
        setLink('hero-cta-primary', data.hero.cta_primary.text, data.hero.cta_primary.link);
      }
      if (data.hero.cta_secondary) {
        setLink('hero-cta-secondary', data.hero.cta_secondary.text, data.hero.cta_secondary.link);
      }
    }

    // Featured section headings
    if (data.featured) {
      setText('featured-heading', data.featured.heading);
      setText('featured-subtitle', data.featured.subtitle);
    }

    // Brand story
    if (data.story) {
      setText('story-heading', data.story.heading);
      if (data.story.text) {
        var storyTextEl = document.getElementById('story-text');
        if (storyTextEl) {
          // Split on double newlines for paragraphs
          var paragraphs = data.story.text.split(/\n\n+/);
          storyTextEl.innerHTML = paragraphs.map(function (p) {
            return '<p class="brand-story__text">' + escapeHtml(p.trim()) + '</p>';
          }).join('');
        }
      }
      if (data.story.cta) {
        setLink('story-cta', data.story.cta.text, data.story.cta.link);
      }
      if (data.story.image) {
        var storyImageEl = document.getElementById('story-image');
        if (storyImageEl) {
          var img = document.createElement('img');
          img.src = data.story.image;
          img.alt = data.story.heading || 'Brand story';
          img.loading = 'lazy';
          img.style.cssText = 'width:100%;border-radius:var(--radius-lg);';
          storyImageEl.innerHTML = '';
          storyImageEl.appendChild(img);
          storyImageEl.classList.remove('brand-story__image-placeholder');
          storyImageEl.classList.add('brand-story__image');
        }
      }
    }

    // USP cards
    if (data.usps) {
      setText('usp-heading', data.usps.heading);
      setText('usp-subtitle', data.usps.subtitle);
      if (data.usps.cards && data.usps.cards.length) {
        var cardsEl = document.getElementById('usp-cards');
        if (cardsEl) {
          cardsEl.innerHTML = data.usps.cards.map(function (card) {
            return '<article class="content-card">' +
              '<div class="content-card__icon" aria-hidden="true">' + escapeHtml(card.icon) + '</div>' +
              '<h3 class="content-card__title">' + escapeHtml(card.title) + '</h3>' +
              '<p class="content-card__text">' + escapeHtml(card.text) + '</p>' +
              '</article>';
          }).join('');
        }
      }
    }

    // CTA banner
    if (data.cta) {
      setText('cta-heading', data.cta.heading);
      setText('cta-text', data.cta.text);
      if (data.cta.button) {
        setLink('cta-button', data.cta.button.text, data.cta.button.link);
      }
    }

    // Meta
    if (data.meta) {
      if (data.meta.title) {
        document.title = data.meta.title;
      }
      if (data.meta.description) {
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', data.meta.description);
      }
    }
  }

  var CATEGORY_DISPLAY_NAMES = {
    'grow-logs': 'Grow Logs',
    'colonised-dowels': 'Colonised Dowels',
    'diy-kits': 'DIY Kits',
    'tinctures': 'Tinctures'
  };

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
    var price = formatPrice(product.base_price_pence);
    var displayCategory = CATEGORY_DISPLAY_NAMES[product.category] || product.category;
    var imageAlt = (product.images && product.images[0]) ? product.images[0].alt : product.name;

    return `
      <article class="product-card">
        <a href="/product/${product.slug}" class="product-card__image" aria-label="${product.name}">
          <div class="product-card__placeholder" role="img" aria-label="${imageAlt}"></div>
        </a>
        <div class="product-card__body">
          <span class="product-card__category">${displayCategory}</span>
          <h3 class="product-card__title">
            <a href="/product/${product.slug}">${product.name}</a>
          </h3>
          <span class="product-card__price">From ${price}</span>
        </div>
        <div class="product-card__footer">
          <a href="/product/${product.slug}" class="btn btn-primary">View Product</a>
        </div>
      </article>
    `;
  }

  /**
   * Fetch products and render into the grid
   */
  async function loadFeaturedProducts() {
    var grid = document.getElementById('featured-products-grid');
    if (!grid) return;

    try {
      var response = await fetch(getApiUrl() + '/api/products');
      if (!response.ok) throw new Error('Failed to load products');
      var json = await response.json();
      var products = json.data || [];

      // Take up to 4 featured products
      var featured = products.slice(0, 4);
      grid.innerHTML = featured.map(renderProductCard).join('');
    } catch (err) {
      console.warn('Could not load products from API, using inline data.', err);
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
    loadHomepageContent();
    loadFeaturedProducts();
    initHeaderScroll();
    initMobileNav();
  });
})();
