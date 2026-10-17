/**
 * Centrifungal - Frontend Configuration
 *
 * Two data sources after the Payload migration:
 *   - Payload CMS (content): cmsApiBase, e.g. https://cms.centrifungal.co.uk/api
 *   - Node backend (commerce: checkout/contact/shop-config): apiBaseUrl,
 *     same-origin /api via Traefik in production.
 *
 * Override either for local dev with a meta tag in the page <head>:
 *   <meta name="cms-api-base" content="http://localhost:3000/api">
 *   <meta name="api-base-url" content="http://localhost:3001">
 */
(function () {
  'use strict';

  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';

  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el && el.content ? el.content : '';
  }

  // Commerce backend: prod is same-origin (''), local dev defaults to :3001.
  var apiBase = meta('api-base-url') || (isLocal ? 'http://localhost:3001' : '');

  // Payload CMS base. Meta override wins; otherwise derive per environment:
  //  - local dev            -> http://localhost:3000/api
  //  - dev VPS ({slug}.dev.skeleton-crew.co.uk) -> cms-{slug}.dev.skeleton-crew.co.uk
  //  - production           -> https://cms.centrifungal.co.uk/api
  var cmsBase = meta('cms-api-base');
  if (!cmsBase) {
    if (isLocal) {
      cmsBase = 'http://localhost:3000/api';
    } else if (host.slice(-'dev.skeleton-crew.co.uk'.length) === 'dev.skeleton-crew.co.uk') {
      cmsBase = 'https://cms-' + host.split('.')[0] + '.dev.skeleton-crew.co.uk/api';
    } else {
      cmsBase = 'https://cms.centrifungal.co.uk/api';
    }
  }

  window.__CENTRIFUNGAL = {
    apiBaseUrl: apiBase,
    cmsApiBase: cmsBase,
    getApiUrl: function () {
      return apiBase;
    },
    getCmsUrl: function () {
      return cmsBase;
    },
    ready: true,
    // Retained for compatibility with modules that gate on config readiness.
    onReady: function (fn) {
      fn();
    },
  };
})();
