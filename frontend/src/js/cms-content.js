/* ==========================================================================
   CMS Content Loader
   Fetches page content from the Statamic CMS API and renders Bard content
   blocks into the page. Used by about, care-instructions, contact, and FAQ
   pages.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Configuration ---------- */
  function getApiUrl() { return window.__CENTRIFUNGAL.getApiUrl(); }

  /* ---------- Slug detection ---------- */
  function getPageSlug() {
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index';
    return filename.replace('.html', '') || 'index';
  }

  /* ---------- ProseMirror JSON to HTML ---------- */
  function renderMarks(text, marks) {
    if (!marks || !marks.length) return escapeHtml(text);
    var html = escapeHtml(text);
    marks.forEach(function (mark) {
      switch (mark.type) {
        case 'bold':
          html = '<strong>' + html + '</strong>';
          break;
        case 'italic':
          html = '<em>' + html + '</em>';
          break;
        case 'code':
          html = '<code>' + html + '</code>';
          break;
        case 'link':
          var href = mark.attrs && mark.attrs.href ? mark.attrs.href : '#';
          var target = mark.attrs && mark.attrs.target ? ' target="' + escapeAttr(mark.attrs.target) + '"' : '';
          var rel = target ? ' rel="noopener noreferrer"' : '';
          html = '<a href="' + escapeAttr(href) + '"' + target + rel + '>' + html + '</a>';
          break;
      }
    });
    return html;
  }

  function renderInlineContent(content) {
    if (!content || !content.length) return '';
    return content.map(function (node) {
      if (node.type === 'text') {
        return renderMarks(node.text || '', node.marks);
      }
      if (node.type === 'hard_break') {
        return '<br>';
      }
      return '';
    }).join('');
  }

  function renderProseMirrorNode(node) {
    if (!node) return '';

    switch (node.type) {
      case 'paragraph':
        var pContent = renderInlineContent(node.content);
        return '<p class="content-section__text">' + pContent + '</p>';

      case 'heading': {
        var level = (node.attrs && node.attrs.level) || 2;
        var tag = 'h' + Math.min(Math.max(level, 1), 6);
        var hContent = renderInlineContent(node.content);
        var cls = level <= 2 ? 'content-section__title' : 'content-section__subtitle';
        return '<' + tag + ' class="' + cls + '">' + hContent + '</' + tag + '>';
      }

      case 'bullet_list':
      case 'bulletList':
        return '<ul>' + renderProseMirrorNodes(node.content) + '</ul>';

      case 'ordered_list':
      case 'orderedList':
        return '<ol>' + renderProseMirrorNodes(node.content) + '</ol>';

      case 'list_item':
      case 'listItem':
        if (node.content) {
          return '<li>' + node.content.map(function (child) {
            if (child.type === 'paragraph') {
              return renderInlineContent(child.content);
            }
            return renderProseMirrorNode(child);
          }).join('') + '</li>';
        }
        return '<li></li>';

      case 'blockquote':
        return '<blockquote>' + renderProseMirrorNodes(node.content) + '</blockquote>';

      case 'horizontal_rule':
      case 'horizontalRule':
        return '<hr>';

      case 'image':
        var src = (node.attrs && node.attrs.src) || '';
        var alt = (node.attrs && node.attrs.alt) || '';
        return '<img src="' + escapeAttr(src) + '" alt="' + escapeAttr(alt) + '" loading="lazy">';

      default:
        if (node.content) {
          return renderProseMirrorNodes(node.content);
        }
        return '';
    }
  }

  function renderProseMirrorNodes(nodes) {
    if (!nodes || !nodes.length) return '';
    return nodes.map(renderProseMirrorNode).join('');
  }

  /* ---------- Block renderers ---------- */
  var blockRenderers = {

    text_block: function (block) {
      if (!block.body || !block.body.length) return '';
      return '<section class="content-section">' +
        renderProseMirrorNodes(block.body) +
        '</section>';
    },

    hero: function (block) {
      var html = '<div class="page-hero">';
      if (block.heading) {
        html += '<h1 class="page-hero__title">' + escapeHtml(block.heading) + '</h1>';
      }
      if (block.subheading) {
        html += '<p class="page-hero__subtitle">' + escapeHtml(block.subheading) + '</p>';
      }
      html += '</div>';
      return html;
    },

    image: function (block) {
      var src = block.image || block.src || '';
      var alt = block.alt_text || block.alt || '';
      var html = '<figure class="content-section">';
      html += '<img src="' + escapeAttr(src) + '" alt="' + escapeAttr(alt) + '" loading="lazy" style="width:100%;border-radius:var(--radius-lg);">';
      if (block.caption) {
        html += '<figcaption class="content-section__text" style="text-align:center;margin-top:var(--space-sm);">' + escapeHtml(block.caption) + '</figcaption>';
      }
      html += '</figure>';
      return html;
    },

    image_text: function (block) {
      var html = '<section class="content-section"><div class="about-grid">';
      html += '<div>';
      if (block.text) {
        if (typeof block.text === 'string') {
          html += '<p class="content-section__text">' + escapeHtml(block.text) + '</p>';
        } else if (Array.isArray(block.text)) {
          html += renderProseMirrorNodes(block.text);
        }
      }
      html += '</div>';
      if (block.image) {
        var src = typeof block.image === 'string' ? block.image : (block.image.src || '');
        var alt = typeof block.image === 'string' ? '' : (block.image.alt || '');
        html += '<div><img src="' + escapeAttr(src) + '" alt="' + escapeAttr(alt) + '" loading="lazy" style="width:100%;border-radius:var(--radius-lg);"></div>';
      }
      html += '</div></section>';
      return html;
    },

    cta_banner: function (block) {
      var html = '<section class="content-section" style="text-align:center;">';
      if (block.heading) {
        html += '<h2 class="content-section__title">' + escapeHtml(block.heading) + '</h2>';
      }
      if (block.text) {
        html += '<p class="content-section__text">' + escapeHtml(block.text) + '</p>';
      }
      if (block.button_text && block.button_url) {
        html += '<a href="' + escapeAttr(block.button_url) + '" class="btn btn-primary">' + escapeHtml(block.button_text) + '</a>';
      }
      html += '</section>';
      return html;
    },

    product_highlight: function (block) {
      /* Minimal renderer - product highlights are best handled by the shop page */
      var html = '<section class="content-section">';
      if (block.title) {
        html += '<h2 class="content-section__title">' + escapeHtml(block.title) + '</h2>';
      }
      if (block.description) {
        html += '<p class="content-section__text">' + escapeHtml(block.description) + '</p>';
      }
      if (block.button_url) {
        html += '<a href="' + escapeAttr(block.button_url) + '" class="btn btn-primary">View Product</a>';
      }
      html += '</section>';
      return html;
    },

    faq_group: function (block) {
      var groupId = 'faq-' + (block.title || 'group').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      var html = '<div class="faq-group" aria-labelledby="' + escapeAttr(groupId) + '-heading">';
      if (block.title) {
        html += '<h2 class="faq-group__title" id="' + escapeAttr(groupId) + '-heading">' + escapeHtml(block.title) + '</h2>';
      }
      var faqs = (block.items || block.faqs || []).filter(function (item) {
        return item.enabled !== false;
      });
      if (faqs.length) {
        faqs.forEach(function (faq) {
          html += '<div class="faq-card">';
          html += '<h3 class="faq-card__question">' + escapeHtml(faq.question) + '</h3>';
          html += '<p class="faq-card__answer">' + escapeHtml(faq.answer) + '</p>';
          html += '</div>';
        });
      }
      html += '</div>';
      return html;
    },

    gallery: function (block) {
      if (!block.images || !block.images.length) return '';
      var html = '<section class="content-section"><div class="step-grid">';
      block.images.forEach(function (img) {
        var src = typeof img === 'string' ? img : (img.src || img.url || '');
        var alt = typeof img === 'string' ? '' : (img.alt || '');
        html += '<div><img src="' + escapeAttr(src) + '" alt="' + escapeAttr(alt) + '" loading="lazy" style="width:100%;border-radius:var(--radius-lg);aspect-ratio:4/3;object-fit:cover;"></div>';
      });
      html += '</div></section>';
      return html;
    }
  };

  /* ---------- Render all blocks ---------- */
  function renderBlocks(blocks) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(function (block) {
      var renderer = blockRenderers[block.type];
      if (renderer) {
        return renderer(block);
      }
      /* Unknown block type - skip silently */
      return '';
    }).join('');
  }

  /* ---------- Accordion wiring ---------- */
  function wireAccordions(container) {
    container.querySelectorAll('.accordion__trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var expanded = trigger.getAttribute('aria-expanded') === 'true';
        var panel = document.getElementById(trigger.getAttribute('aria-controls'));
        trigger.setAttribute('aria-expanded', !expanded);
        if (panel) panel.setAttribute('aria-hidden', expanded);
      });
    });
  }

  /* ---------- Meta update ---------- */
  function updateMeta(data) {
    if (data.meta_title) {
      document.title = data.meta_title;
    } else if (data.title) {
      document.title = data.title + ' - Centrifungal';
    }

    if (data.meta_description) {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', data.meta_description);
      }
    }
  }

  /* ---------- Hero update ---------- */
  function updateHero(data) {
    var heroTitle = document.querySelector('.page-hero__title');
    var heroSubtitle = document.querySelector('.page-hero__subtitle');
    if (heroTitle && data.title) {
      heroTitle.textContent = data.title;
    }
    if (heroSubtitle && data.subtitle) {
      heroSubtitle.textContent = data.subtitle;
    }
  }

  /* ---------- Loading skeleton ---------- */
  function showLoading(container) {
    container.innerHTML =
      '<div class="cms-loading" aria-live="polite" aria-busy="true">' +
        '<div class="cms-loading__skeleton"></div>' +
        '<div class="cms-loading__skeleton cms-loading__skeleton--short"></div>' +
        '<div class="cms-loading__skeleton"></div>' +
        '<div class="cms-loading__skeleton cms-loading__skeleton--short"></div>' +
      '</div>';
  }

  /* ---------- Error display ---------- */
  function showError(container, is404) {
    if (is404) {
      show404(container);
      return;
    }
    container.innerHTML =
      '<section class="content-section" style="text-align:center;padding:var(--space-3xl) 0;">' +
        '<h2 class="content-section__title">Unable to load content</h2>' +
        '<p class="content-section__text">We could not load this page right now. Please try refreshing, or come back in a moment.</p>' +
        '<button class="btn btn-primary" onclick="window.location.reload()">Try Again</button>' +
      '</section>';
  }

  /* ---------- 404 with no-as-a-service ---------- */
  function show404(container) {
    fetch(getApiUrl() + '/api/random-no')
      .then(function (r) { return r.json(); })
      .then(function (data) { return (data && data.reason) ? '"' + data.reason + '"' : 'This page does not exist.'; })
      .catch(function () { return 'This page does not exist.'; })
      .then(function (quote) {
        var titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = '404';
        var subtitleEl = document.getElementById('page-subtitle');
        if (subtitleEl) subtitleEl.textContent = 'Page not found';
        document.title = '404 - Centrifungal';

        container.innerHTML =
          '<section style="text-align:center;padding:var(--space-16) var(--space-4);max-width:600px;margin:0 auto;">' +
            '<p style="font-family:var(--font-display);font-size:clamp(4rem, 10vw, 8rem);font-weight:700;color:var(--color-chanterelle);line-height:1;margin-bottom:var(--space-4);">404</p>' +
            '<p style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--color-text);margin-bottom:var(--space-6);">Page not found</p>' +
            '<p style="font-style:italic;font-size:var(--text-lg);color:var(--color-text-muted);margin-bottom:var(--space-8);">' + escapeHtml(quote) + '</p>' +
            '<a href="/" class="btn btn-primary btn-lg">Go Home</a>' +
          '</section>';
      });
  }

  /* ---------- Inject loading styles ---------- */
  function injectStyles() {
    if (document.getElementById('cms-content-styles')) return;
    var style = document.createElement('style');
    style.id = 'cms-content-styles';
    style.textContent =
      '.cms-loading { padding: var(--space-2xl) 0; }' +
      '.cms-loading__skeleton {' +
        'height: 1.2em;' +
        'margin-bottom: var(--space-md);' +
        'border-radius: var(--radius-sm);' +
        'background: linear-gradient(90deg, var(--neutral-200) 25%, var(--neutral-100) 50%, var(--neutral-200) 75%);' +
        'background-size: 200% 100%;' +
        'animation: cms-shimmer 1.5s ease-in-out infinite;' +
      '}' +
      '.cms-loading__skeleton--short { width: 60%; }' +
      '@keyframes cms-shimmer {' +
        '0% { background-position: 200% 0; }' +
        '100% { background-position: -200% 0; }' +
      '}';
    document.head.appendChild(style);
  }

  /* ---------- Utility ---------- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  /* ---------- Main ---------- */
  function init() {
    var container = document.getElementById('cms-page-content');
    if (!container) return;

    var slug = container.getAttribute('data-slug') || getPageSlug();

    injectStyles();
    showLoading(container);

    fetch(getApiUrl() + '/api/pages/' + encodeURIComponent(slug))
      .then(function (response) {
        if (response.status === 404) {
          showError(container, true);
          return null;
        }
        if (!response.ok) {
          throw new Error('API returned ' + response.status);
        }
        return response.json();
      })
      .then(function (json) {
        if (!json) return;
        var data = json.data || json;

        updateMeta(data);
        updateHero(data);

        var blocks = data.page_content || [];
        var html = renderBlocks(blocks);

        if (html) {
          container.innerHTML = html;
        } else {
          /* No CMS blocks returned - clear the loading state */
          container.innerHTML = '';
        }

        wireAccordions(container);
      })
      .catch(function () {
        showError(container, false);
      });
  }

  /* Run on DOMContentLoaded or immediately if DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
