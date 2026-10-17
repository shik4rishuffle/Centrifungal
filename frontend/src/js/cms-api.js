/* ============================================
 * CMS Integration Layer (Payload REST)
 * Fetch helpers + shape mappers for the Centrifungal storefront.
 * Content is public-read in Payload, so no auth is needed here.
 * Page modules (homepage/shop/product/nav/footer/cms-content) call into this.
 * ============================================ */

var CMS = (function () {
  'use strict';

  var TIMEOUT_MS = 5000;

  function base() {
    return (window.__CENTRIFUNGAL && window.__CENTRIFUNGAL.getCmsUrl())
      || 'https://cms.centrifungal.co.uk/api';
  }

  /* --- Generic fetcher (returns null on any failure, so callers fall back) --- */
  function fetchFromCMS(endpoint, params) {
    var url = new URL(base() + endpoint);
    if (params) {
      Object.keys(params).forEach(function (key) {
        url.searchParams.append(key, params[key]);
      });
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

    return fetch(url.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(function (res) {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('CMS responded with ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        console.error('[CMS] Fetch failed:', endpoint, err.message);
        return null;
      });
  }

  /* --- Collections / globals --- */

  function fetchProducts(params) {
    var q = {};
    if (params) {
      if (params.limit) q.limit = params.limit;
      if (params.sort) q.sort = params.sort;
      if (params.category) q['where[category][equals]'] = params.category;
    }
    q.depth = 2; // resolve category + image relationships
    return fetchFromCMS('/products', q).then(function (data) {
      return data && Array.isArray(data.docs) ? data.docs : [];
    });
  }

  function fetchProductBySlug(slug) {
    return fetchFromCMS('/products', { 'where[slug][equals]': slug, depth: 2 })
      .then(function (data) {
        return data && data.docs && data.docs.length > 0 ? data.docs[0] : null;
      });
  }

  function fetchCategories() {
    return fetchFromCMS('/product-categories', { sort: 'sortOrder', limit: 100 })
      .then(function (data) {
        return data && Array.isArray(data.docs) ? data.docs : [];
      });
  }

  function fetchSiteSettings() {
    return fetchFromCMS('/globals/site-settings');
  }

  function fetchPageBySlug(slug) {
    return fetchFromCMS('/pages', { 'where[slug][equals]': slug, depth: 2 })
      .then(function (data) {
        return data && data.docs && data.docs.length > 0 ? data.docs[0] : null;
      });
  }

  /* --- Formatting + media helpers --- */

  function formatPrice(pence) {
    return '£' + ((Number(pence) || 0) / 100).toFixed(2);
  }

  // Resolve a Payload upload (or {image: upload}) to an absolute URL.
  function imageURL(uploadObj) {
    if (!uploadObj) return '';
    if (typeof uploadObj === 'string') return uploadObj;
    if (uploadObj.image && typeof uploadObj.image === 'object') uploadObj = uploadObj.image;
    var url = uploadObj.url || '';
    if (!url) return '';
    if (url.indexOf('http') === 0) return url;
    return base().replace(/\/api$/, '') + url;
  }

  function imageAlt(uploadObj, fallback) {
    if (uploadObj && uploadObj.image && typeof uploadObj.image === 'object') uploadObj = uploadObj.image;
    return (uploadObj && uploadObj.alt) || fallback || '';
  }

  /* --- Product helpers (variant/in-out-stock model) --- */

  function mainImage(product) {
    if (product && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  }

  function findVariant(product, sku) {
    if (!product || !Array.isArray(product.variants)) return null;
    return product.variants.find(function (v) { return v.sku === sku; }) || null;
  }

  function variantPrice(product, variant) {
    if (variant && variant.priceOverride) return variant.priceOverride;
    return product ? product.price : 0;
  }

  // A product is buyable if its master toggle is on and at least one variant is in stock.
  function productAvailable(product) {
    if (!product || product.inStock === false) return false;
    return (product.variants || []).some(function (v) { return v.inStock !== false; });
  }

  function categorySlug(product) {
    if (!product || !product.category) return '';
    return typeof product.category === 'object'
      ? (product.category.slug || '')
      : String(product.category);
  }

  /* --- DOM helper: split a textarea value into <p> paragraphs --- */
  function renderParagraphs(target, text) {
    if (!target) return;
    target.innerHTML = '';
    String(text || '').split(/\n\s*\n/).forEach(function (para) {
      var trimmed = para.trim();
      if (!trimmed) return;
      var p = document.createElement('p');
      p.textContent = trimmed;
      target.appendChild(p);
    });
  }

  return {
    fetchFromCMS: fetchFromCMS,
    fetchProducts: fetchProducts,
    fetchProductBySlug: fetchProductBySlug,
    fetchCategories: fetchCategories,
    fetchSiteSettings: fetchSiteSettings,
    fetchPageBySlug: fetchPageBySlug,
    formatPrice: formatPrice,
    imageURL: imageURL,
    imageAlt: imageAlt,
    mainImage: mainImage,
    findVariant: findVariant,
    variantPrice: variantPrice,
    productAvailable: productAvailable,
    categorySlug: categorySlug,
    renderParagraphs: renderParagraphs,
  };
})();
