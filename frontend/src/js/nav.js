/* ==========================================================================
   Navigation + logo loader
   Sources nav links and the site logo from the Payload SiteSettings global.
   Falls back silently to the static HTML links/logo if the CMS is unavailable.
   ========================================================================== */

(function () {
  'use strict';

  function getCurrentPath() {
    return window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildNavHtml(items) {
    var currentPath = getCurrentPath();
    return items.map(function (item) {
      var url = item.url || '#';
      var isActive = currentPath === url || (url !== '/' && currentPath.indexOf(url) === 0);
      var cls = 'site-header__nav-link' + (isActive ? ' site-header__nav-link--active' : '');
      return '<a href="' + escapeHtml(url) + '" class="' + cls + '">' + escapeHtml(item.label) + '</a>';
    }).join('');
  }

  function applyLogo(data) {
    if (!data || !data.siteLogo) return;
    var src = CMS.imageURL(data.siteLogo);
    if (!src) return;

    document.querySelectorAll('.site-header__logo').forEach(function (link) {
      var svg = link.querySelector('.site-header__logo-icon');
      if (svg) svg.remove();
      var existingImg = link.querySelector('.site-header__logo-img');
      if (existingImg) existingImg.remove();

      var img = document.createElement('img');
      img.src = src;
      img.alt = data.siteName || 'Centrifungal';
      img.className = 'site-header__logo-img';
      link.insertBefore(img, link.firstChild);

      if (data.siteName) {
        var textNode = link.childNodes[link.childNodes.length - 1];
        if (textNode && textNode.nodeType === 3) {
          textNode.textContent = ' ' + data.siteName;
        }
      }
    });
  }

  function init() {
    if (typeof CMS === 'undefined') return; // cms-api.js not loaded - keep static fallback

    var nav = document.getElementById('main-nav');
    CMS.fetchSiteSettings().then(function (data) {
      if (!data) return;
      if (nav && Array.isArray(data.navLinks) && data.navLinks.length) {
        nav.innerHTML = buildNavHtml(data.navLinks);
      }
      applyLogo(data);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
