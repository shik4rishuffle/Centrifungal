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

  function loadSiteSettings() {
    fetch(getApiUrl() + '/api/site-settings')
      .then(function (response) {
        if (!response.ok) throw new Error('Site settings API ' + response.status);
        return response.json();
      })
      .then(function (json) {
        var data = json.data || {};
        if (!data.site_logo) return;

        var logoLinks = document.querySelectorAll('.site-header__logo');
        logoLinks.forEach(function (link) {
          var svg = link.querySelector('.site-header__logo-icon');
          if (svg) svg.remove();

          var existingImg = link.querySelector('.site-header__logo-img');
          if (existingImg) existingImg.remove();

          var img = document.createElement('img');
          img.src = data.site_logo;
          img.alt = data.site_name || 'Centrifungal';
          img.className = 'site-header__logo-img';
          link.insertBefore(img, link.firstChild);

          if (data.site_name) {
            var textNode = link.childNodes[link.childNodes.length - 1];
            if (textNode && textNode.nodeType === 3) {
              textNode.textContent = ' ' + data.site_name;
            }
          }
        });
      })
      .catch(function () {
        /* Silent fail - keep the SVG logo as fallback */
      });
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

    loadSiteSettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
