/**
 * Homepage - hydrates hero/featured/story/USP/CTA from the Payload SiteSettings
 * global, renders featured products, and wires header/nav UI. Falls back
 * silently to the static HTML if the CMS is unavailable.
 */

(function () {
  'use strict';

  var isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  function productUrl(slug) {
    return isLocalDev ? '/product.html?slug=' + encodeURIComponent(slug) : '/product/' + slug;
  }

  function paragraphs(text, cls) {
    return String(text)
      .split(/\n\s*\n/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return '<p class="' + cls + '">' + escapeHtml(p) + '</p>'; })
      .join('');
  }

  /* ---------- Homepage content from SiteSettings ---------- */
  function applyHomepage(s) {
    setText('hero-eyebrow', s.heroEyebrow);
    setText('hero-title', s.heroTitle);
    setText('hero-text', s.heroText);
    setLink('hero-cta-primary', s.heroCtaPrimaryText, s.heroCtaPrimaryLink);
    setLink('hero-cta-secondary', s.heroCtaSecondaryText, s.heroCtaSecondaryLink);

    var heroImg = CMS.imageURL(s.heroImage);
    if (heroImg) {
      var ph = document.querySelector('.hero__image-placeholder');
      if (ph) {
        ph.style.backgroundImage = 'url(' + heroImg + ')';
        ph.style.backgroundSize = 'cover';
        ph.style.backgroundPosition = 'center';
        ph.classList.add('hero__image-placeholder--has-image');
      }
    }

    setText('featured-heading', s.featuredHeading);
    setText('featured-subtitle', s.featuredSubtitle);

    setText('story-heading', s.storyHeading);
    if (s.storyText) {
      var st = document.getElementById('story-text');
      if (st) st.innerHTML = paragraphs(s.storyText, 'brand-story__text');
    }
    setLink('story-cta', s.storyCtaText, s.storyCtaLink);
    var storyImg = CMS.imageURL(s.storyImage);
    if (storyImg) {
      var si = document.getElementById('story-image');
      if (si) {
        var img = document.createElement('img');
        img.src = storyImg;
        img.alt = s.storyHeading || 'Brand story';
        img.loading = 'lazy';
        img.style.cssText = 'width:100%;border-radius:var(--radius-lg);';
        si.innerHTML = '';
        si.appendChild(img);
        si.classList.remove('brand-story__image-placeholder');
        si.classList.add('brand-story__image');
      }
    }

    setText('usp-heading', s.uspHeading);
    setText('usp-subtitle', s.uspSubtitle);
    if (Array.isArray(s.uspCards)) {
      var cards = document.querySelectorAll('#usp-cards .content-card');
      s.uspCards.forEach(function (card, i) {
        if (!cards[i]) return;
        var titleEl = cards[i].querySelector('.content-card__title');
        var textEl = cards[i].querySelector('.content-card__text');
        var iconEl = cards[i].querySelector('.content-card__icon');
        if (titleEl && card.title) titleEl.textContent = card.title;
        if (textEl && card.text) textEl.textContent = card.text;
        if (iconEl && card.icon) iconEl.textContent = card.icon;
      });
    }

    setText('cta-heading', s.ctaHeading);
    setText('cta-text', s.ctaText);
    setLink('cta-button', s.ctaButtonText, s.ctaButtonLink);

    if (s.defaultMetaTitle) document.title = s.defaultMetaTitle;
    if (s.defaultMetaDescription) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', s.defaultMetaDescription);
    }
  }

  function loadHomepage() {
    CMS.fetchSiteSettings()
      .then(function (s) { if (s) applyHomepage(s); })
      .catch(function (err) { console.warn('Could not load homepage content from CMS.', err); });
  }

  /* ---------- Featured products ---------- */
  function renderProductCard(product) {
    var prices = (product.variants || []).map(function (v) { return CMS.variantPrice(product, v); });
    var low = prices.length ? Math.min.apply(null, prices) : (product.price || 0);
    var cat = product.category && typeof product.category === 'object' ? product.category : null;
    var img = CMS.mainImage(product);
    var imgSrc = CMS.imageURL(img);
    var name = escapeHtml(product.name);
    var url = productUrl(product.slug);

    return (
      '<article class="product-card">' +
        '<a href="' + url + '" class="product-card__image" aria-label="' + name + '">' +
          (imgSrc
            ? '<img src="' + imgSrc + '" alt="' + escapeHtml(CMS.imageAlt(img, product.name)) + '" loading="lazy" class="product-card__img">'
            : '<div class="product-card__placeholder" role="img" aria-label="' + name + '"></div>') +
        '</a>' +
        '<div class="product-card__body">' +
          (cat ? '<span class="product-card__category">' + escapeHtml(cat.name) + '</span>' : '') +
          '<h3 class="product-card__title"><a href="' + url + '">' + name + '</a></h3>' +
          '<span class="product-card__price">From ' + CMS.formatPrice(low) + '</span>' +
        '</div>' +
        '<div class="product-card__footer"><a href="' + url + '" class="btn btn-primary">View Product</a></div>' +
      '</article>'
    );
  }

  function loadFeaturedProducts() {
    var grid = document.getElementById('featured-products-grid');
    if (!grid) return;
    CMS.fetchProducts({ limit: 12, sort: 'sortOrder' })
      .then(function (products) {
        if (!products || !products.length) return;
        var featured = products.filter(function (p) { return p.featured; });
        var list = (featured.length ? featured : products).slice(0, 4);
        grid.innerHTML = list.map(renderProductCard).join('');
      })
      .catch(function (err) { console.warn('Could not load featured products.', err); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof CMS !== 'undefined') {
      loadHomepage();
      loadFeaturedProducts();
    }
    // Header scroll + mobile-nav toggle + cart badge are handled globally by chrome.js.
  });
})();
