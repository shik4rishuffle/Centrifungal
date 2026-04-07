/* ==========================================================================
   Footer Loader
   Fetches footer content from the CMS API (global set) and replaces the
   hardcoded footer HTML. Falls back gracefully to static content if the
   API is unavailable.
   ========================================================================== */

(function () {
  'use strict';

  function getApiUrl() { return window.__CENTRIFUNGAL.getApiUrl(); }

  /* ---------- SVG icon map for social platforms ---------- */
  var socialIcons = {
    instagram: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    facebook: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
    twitter: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768"/></svg>',
    tiktok: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>',
    youtube: '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>'
  };

  /* ---------- Utility ---------- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- Build social links ---------- */
  function buildSocialHtml(links) {
    if (!links || !links.length) return '';
    return links.map(function (link) {
      var icon = socialIcons[link.platform] || '';
      var label = escapeHtml(link.label || link.platform || 'Social');
      var url = escapeHtml(link.url || '#');
      return '<a href="' + url + '" class="site-footer__social-link" aria-label="' + label + '">' + icon + '</a>';
    }).join('');
  }

  /* ---------- Build link columns ---------- */
  function buildColumnsHtml(columns) {
    if (!columns || !columns.length) return '';
    return columns.map(function (col) {
      var html = '<div>';
      html += '<h3 class="site-footer__column-title">' + escapeHtml(col.title) + '</h3>';
      var links = col.links || [];
      if (links.length) {
        html += '<ul class="site-footer__links" role="list">';
        links.forEach(function (link) {
          html += '<li><a href="' + escapeHtml(link.url || '#') + '" class="site-footer__link">' + escapeHtml(link.label) + '</a></li>';
        });
        html += '</ul>';
      }
      html += '</div>';
      return html;
    }).join('');
  }

  /* ---------- Main ---------- */
  function init() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;

    fetch(getApiUrl() + '/api/footer')
      .then(function (response) {
        if (!response.ok) throw new Error('Footer API ' + response.status);
        return response.json();
      })
      .then(function (json) {
        var data = json.data;
        if (!data) return;

        /* Tagline */
        var taglineEl = footer.querySelector('.site-footer__tagline');
        if (taglineEl && data.tagline) {
          taglineEl.textContent = data.tagline;
        }

        /* Social links */
        var socialEl = footer.querySelector('.site-footer__social');
        if (socialEl && data.social_links && data.social_links.length) {
          socialEl.innerHTML = buildSocialHtml(data.social_links);
        }

        /* Footer columns */
        var gridEl = footer.querySelector('.site-footer__grid');
        if (gridEl && data.footer_columns && data.footer_columns.length) {
          /* Keep the brand column, replace everything after it */
          var brandEl = gridEl.querySelector('.site-footer__brand');
          if (brandEl) {
            var columnsHtml = buildColumnsHtml(data.footer_columns);
            /* Remove existing columns (everything after brand) */
            var children = Array.prototype.slice.call(gridEl.children);
            children.forEach(function (child) {
              if (child !== brandEl) gridEl.removeChild(child);
            });
            /* Insert new columns */
            brandEl.insertAdjacentHTML('afterend', columnsHtml);
          }
        }

        /* Copyright */
        var copyrightEl = footer.querySelector('.site-footer__copyright');
        if (copyrightEl && data.copyright) {
          copyrightEl.textContent = data.copyright;
        }
      })
      .catch(function () {
        /* Silent fail - keep the hardcoded footer as fallback */
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
