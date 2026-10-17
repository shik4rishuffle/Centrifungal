/* ==========================================================================
   Shared header/footer chrome: mobile-nav toggle, sticky-header scroll state,
   and the header cart-count badge. Extracted from an inline <script> so the
   site can run under a strict CSP (script-src 'self'). Present on every page.
   ========================================================================== */

(function () {
  'use strict';

  var hamburger = document.getElementById('hamburger-btn');
  var nav = document.getElementById('main-nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
      var expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('site-header__nav--open');
    });
  }

  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('site-header--scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  function updateHeaderCartCount() {
    var badge = document.getElementById('header-cart-count');
    if (!badge) return;
    try {
      var cart = JSON.parse(localStorage.getItem('centrifungal_cart') || '[]');
      var count = cart.reduce(function (sum, item) { return sum + (item.quantity || 0); }, 0);
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    } catch (e) {
      badge.style.display = 'none';
    }
  }

  updateHeaderCartCount();
  window.addEventListener('cart-updated', updateHeaderCartCount);
})();
