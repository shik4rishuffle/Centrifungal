/* ==========================================================================
   CMS Content Loader
   Fetches a Payload Page by slug and renders its `layout` blocks. Used by
   about, care-instructions, contact, faq and the generic page template.
   Includes a minimal Lexical -> HTML renderer for richtext block bodies.
   ========================================================================== */

(function () {
  'use strict';

  var isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(str) { return escapeHtml(str); }

  function productUrl(slug) {
    return isLocalDev ? '/product.html?slug=' + encodeURIComponent(slug) : '/product/' + slug;
  }

  function getPageSlug() {
    var container = document.getElementById('cms-page-content');
    if (container && container.getAttribute('data-slug')) return container.getAttribute('data-slug');
    var filename = (window.location.pathname.split('/').pop() || 'index').replace('.html', '');
    return filename || 'index';
  }

  /* ---------- Lexical -> HTML ---------- */
  var FMT = { bold: 1, italic: 2, strike: 4, underline: 8, code: 16 };

  function resolveMedia(url) {
    if (!url) return '';
    if (url.indexOf('http') === 0) return url;
    var base = (window.__CENTRIFUNGAL ? window.__CENTRIFUNGAL.getCmsUrl() : '').replace(/\/api$/, '');
    return base + url;
  }

  function renderText(node) {
    var t = escapeHtml(node.text || '');
    var f = node.format || 0;
    if (f & FMT.code) t = '<code>' + t + '</code>';
    if (f & FMT.bold) t = '<strong>' + t + '</strong>';
    if (f & FMT.italic) t = '<em>' + t + '</em>';
    if (f & FMT.underline) t = '<u>' + t + '</u>';
    if (f & FMT.strike) t = '<s>' + t + '</s>';
    return t;
  }

  function renderChildren(node) {
    return node.children && node.children.length ? node.children.map(renderNode).join('') : '';
  }

  function renderNode(node) {
    if (!node) return '';
    switch (node.type) {
      case 'text':
        return renderText(node);
      case 'linebreak':
        return '<br>';
      case 'paragraph': {
        var c = renderChildren(node);
        return c ? '<p class="content-section__text">' + c + '</p>' : '';
      }
      case 'heading': {
        var tag = node.tag || 'h2';
        var cls = tag === 'h1' || tag === 'h2' ? 'content-section__title' : 'content-section__subtitle';
        return '<' + tag + ' class="' + cls + '">' + renderChildren(node) + '</' + tag + '>';
      }
      case 'list':
        return '<' + (node.listType === 'number' ? 'ol' : 'ul') + '>' + renderChildren(node) + '</' + (node.listType === 'number' ? 'ol' : 'ul') + '>';
      case 'listitem':
        return '<li>' + renderChildren(node) + '</li>';
      case 'quote':
        return '<blockquote>' + renderChildren(node) + '</blockquote>';
      case 'horizontalrule':
        return '<hr>';
      case 'link': {
        var url = (node.fields && node.fields.url) || '#';
        var newTab = node.fields && node.fields.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
        return '<a href="' + escapeAttr(url) + '"' + newTab + '>' + renderChildren(node) + '</a>';
      }
      case 'upload': {
        var d = node.value || {};
        var src = d.url ? resolveMedia(d.url) : '';
        return src ? '<img src="' + escapeAttr(src) + '" alt="' + escapeAttr(d.alt || '') + '" loading="lazy" style="max-width:100%;border-radius:var(--radius-lg);">' : '';
      }
      default:
        return renderChildren(node);
    }
  }

  function renderLexical(root) {
    if (!root || !root.root || !Array.isArray(root.root.children)) return '';
    return root.root.children.map(renderNode).join('');
  }

  /* ---------- Block renderers (keyed by Payload blockType) ---------- */
  var blockRenderers = {
    hero: function (b) {
      var bg = CMS.imageURL(b.backgroundImage);
      var styleAttr = bg ? ' style="background-image:url(\'' + bg + '\');background-size:cover;background-position:center;"' : '';
      var cls = 'page-hero' + (bg ? ' page-hero--has-image' : '');
      var html = '<div class="' + cls + '"' + styleAttr + '>';
      if (b.heading) html += '<h1 class="page-hero__title">' + escapeHtml(b.heading) + '</h1>';
      if (b.subheading) html += '<p class="page-hero__subtitle">' + escapeHtml(b.subheading) + '</p>';
      if (b.ctaText && b.ctaLink) html += '<a href="' + escapeAttr(b.ctaLink) + '" class="btn btn-primary">' + escapeHtml(b.ctaText) + '</a>';
      html += '</div>';
      return html;
    },
    textBlock: function (b) {
      var c = renderLexical(b.body);
      return c ? '<section class="content-section">' + c + '</section>' : '';
    },
    image: function (b) {
      var src = CMS.imageURL(b.image);
      if (!src) return '';
      var html = '<figure class="content-section"><img src="' + escapeAttr(src) + '" alt="' + escapeAttr(CMS.imageAlt(b.image, '')) + '" loading="lazy" style="width:100%;border-radius:var(--radius-lg);">';
      if (b.caption) html += '<figcaption class="content-section__text" style="text-align:center;margin-top:var(--space-sm);">' + escapeHtml(b.caption) + '</figcaption>';
      html += '</figure>';
      return html;
    },
    imageText: function (b) {
      var src = CMS.imageURL(b.image);
      var body = renderLexical(b.body);
      var imgHtml = src ? '<div><img src="' + escapeAttr(src) + '" alt="' + escapeAttr(CMS.imageAlt(b.image, '')) + '" loading="lazy" style="width:100%;border-radius:var(--radius-lg);"></div>' : '';
      var textHtml = '<div>' + body + '</div>';
      var inner = b.imagePosition === 'right' ? textHtml + imgHtml : imgHtml + textHtml;
      return '<section class="content-section"><div class="about-grid">' + inner + '</div></section>';
    },
    ctaBanner: function (b) {
      var html = '<section class="content-section" style="text-align:center;">';
      if (b.heading) html += '<h2 class="content-section__title">' + escapeHtml(b.heading) + '</h2>';
      if (b.body) html += '<p class="content-section__text">' + escapeHtml(b.body) + '</p>';
      if (b.buttonText && b.buttonLink) {
        var cls = b.style === 'secondary' ? 'btn btn-outline' : 'btn btn-primary';
        html += '<a href="' + escapeAttr(b.buttonLink) + '" class="' + cls + '">' + escapeHtml(b.buttonText) + '</a>';
      }
      html += '</section>';
      return html;
    },
    productHighlight: function (b) {
      var html = '<section class="content-section">';
      if (b.heading) html += '<h2 class="content-section__title">' + escapeHtml(b.heading) + '</h2>';
      var prods = (b.products || []).filter(function (p) { return p && typeof p === 'object'; }).slice(0, 4);
      if (prods.length) {
        html += '<div class="shop-grid">';
        prods.forEach(function (p) {
          var img = CMS.mainImage(p);
          var src = CMS.imageURL(img);
          var url = productUrl(p.slug);
          html += '<a href="' + url + '" class="product-card">' +
            '<div class="product-card__image">' +
            (src ? '<img src="' + escapeAttr(src) + '" alt="' + escapeAttr(CMS.imageAlt(img, p.name)) + '" loading="lazy" class="product-card__img">' : '') +
            '</div><div class="product-card__body"><h3 class="product-card__title">' + escapeHtml(p.name) + '</h3></div></a>';
        });
        html += '</div>';
      }
      html += '</section>';
      return html;
    },
    faqGroup: function (b) {
      var html = '<div class="faq-group">';
      if (b.heading) html += '<h2 class="faq-group__title">' + escapeHtml(b.heading) + '</h2>';
      (b.items || []).forEach(function (it) {
        html += '<div class="faq-card"><h3 class="faq-card__question">' + escapeHtml(it.question) + '</h3>' +
          '<p class="faq-card__answer">' + escapeHtml(it.answer).replace(/\n/g, '<br>') + '</p></div>';
      });
      html += '</div>';
      return html;
    },
    gallery: function (b) {
      var imgs = b.images || [];
      if (!imgs.length) return '';
      var html = '<section class="content-section"><div class="step-grid">';
      imgs.forEach(function (item) {
        var src = CMS.imageURL(item);
        if (!src) return;
        html += '<div><img src="' + escapeAttr(src) + '" alt="' + escapeAttr(CMS.imageAlt(item, '')) + '" loading="lazy" style="width:100%;border-radius:var(--radius-lg);aspect-ratio:4/3;object-fit:cover;"></div>';
      });
      html += '</div></section>';
      return html;
    },
  };

  function renderBlocks(layout) {
    if (!layout || !layout.length) return '';
    return layout.map(function (block) {
      var renderer = blockRenderers[block.blockType];
      return renderer ? renderer(block) : '';
    }).join('');
  }

  /* ---------- Meta + hero ---------- */
  function updateMeta(page) {
    // SEO fields live in a Payload `collapsible`, so they are returned FLAT on the
    // page doc (page.metaTitle / page.metaDescription), not nested under `seo`.
    if (page.metaTitle) document.title = page.metaTitle;
    else if (page.title) document.title = page.title + ' - Centrifungal';
    if (page.metaDescription) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', page.metaDescription);
    }
  }

  function updateHero(page) {
    var heroTitle = document.querySelector('.page-hero__title');
    var heroSubtitle = document.querySelector('.page-hero__subtitle');
    if (heroTitle && page.title) heroTitle.textContent = page.title;
    if (heroSubtitle && page.subtitle) heroSubtitle.textContent = page.subtitle;
  }

  /* ---------- Loading / error ---------- */
  function showLoading(container) {
    container.innerHTML =
      '<div class="cms-loading" aria-live="polite" aria-busy="true">' +
      '<div class="cms-loading__skeleton"></div>' +
      '<div class="cms-loading__skeleton cms-loading__skeleton--short"></div>' +
      '<div class="cms-loading__skeleton"></div>' +
      '<div class="cms-loading__skeleton cms-loading__skeleton--short"></div>' +
      '</div>';
  }

  function showError(container) {
    container.innerHTML =
      '<section class="content-section" style="text-align:center;padding:var(--space-3xl) 0;">' +
      '<h2 class="content-section__title">Unable to load content</h2>' +
      '<p class="content-section__text">We could not load this page right now. Please try refreshing, or come back in a moment.</p>' +
      '<button class="btn btn-primary" data-retry>Try Again</button>' +
      '</section>';
    var retry = container.querySelector('[data-retry]');
    if (retry) retry.addEventListener('click', function () { window.location.reload(); });
  }

  function injectStyles() {
    if (document.getElementById('cms-content-styles')) return;
    var style = document.createElement('style');
    style.id = 'cms-content-styles';
    style.textContent =
      '.cms-loading { padding: var(--space-2xl) 0; }' +
      '.cms-loading__skeleton { height: 1.2em; margin-bottom: var(--space-md); border-radius: var(--radius-sm);' +
      'background: linear-gradient(90deg, var(--neutral-200) 25%, var(--neutral-100) 50%, var(--neutral-200) 75%);' +
      'background-size: 200% 100%; animation: cms-shimmer 1.5s ease-in-out infinite; }' +
      '.cms-loading__skeleton--short { width: 60%; }' +
      '@keyframes cms-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }';
    document.head.appendChild(style);
  }

  function init() {
    if (typeof CMS === 'undefined') return;
    var container = document.getElementById('cms-page-content');
    if (!container) return;

    var slug = getPageSlug();
    injectStyles();
    showLoading(container);

    CMS.fetchPageBySlug(slug)
      .then(function (page) {
        if (!page) {
          showError(container);
          return;
        }
        updateMeta(page);
        updateHero(page);
        var html = renderBlocks(page.layout || []);
        container.innerHTML = html || '';
      })
      .catch(function () {
        showError(container);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
