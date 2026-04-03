/* ==========================================================================
   Navigation Loader
   Fetches nav items from the CMS API and replaces hardcoded nav links.
   Falls back gracefully to the static HTML links if the API is unavailable.
   ========================================================================== */

(function () {
  'use strict';

  function getApiUrl() { return window.__CENTRIFUNGAL.getApiUrl(); }

  function getCurrentPath() {
    return window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  }

  function buildNavHtml(items) {
    var currentPath = getCurrentPath();
    return items.map(function (item) {
      var url = item.url || '#';
      var isActive = (currentPath === url) ||
        (url !== '/' && currentPath.indexOf(url) === 0);
      var cls = 'site-header__nav-link' + (isActive ? ' site-header__nav-link--active' : '');
      return '<a href="' + url + '" class="' + cls + '">' + escapeHtml(item.title) + '</a>';
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init() {
    var nav = document.getElementById('main-nav');
    if (!nav) return;

    fetch(getApiUrl() + '/api/navigation')
      .then(function (response) {
        if (!response.ok) throw new Error('Nav API ' + response.status);
        return response.json();
      })
      .then(function (json) {
        var items = json.data || [];
        if (items.length) {
          nav.innerHTML = buildNavHtml(items);
        }
      })
      .catch(function () {
        /* Silent fail - keep the hardcoded nav links as fallback */
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
