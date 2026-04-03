/**
 * Centrifungal - Frontend Configuration
 *
 * Loads config from the backend API so environment-specific values
 * (like the API URL) live in the backend's .env, not hardcoded here.
 *
 * Falls back to localhost for local development if the config endpoint
 * is unreachable.
 */

(function () {
  'use strict';

  var FALLBACK_API_URL = 'http://localhost:8001';

  // Default config - used immediately, updated async
  window.__CENTRIFUNGAL = {
    apiBaseUrl: FALLBACK_API_URL,
    ready: false,
    _callbacks: []
  };

  /**
   * Get the API base URL. Available synchronously (returns fallback
   * until config loads, then returns the real value).
   */
  window.__CENTRIFUNGAL.getApiUrl = function () {
    return window.__CENTRIFUNGAL.apiBaseUrl;
  };

  /**
   * Register a callback to run when config is loaded.
   * If config is already loaded, runs immediately.
   */
  window.__CENTRIFUNGAL.onReady = function (fn) {
    if (window.__CENTRIFUNGAL.ready) {
      fn();
    } else {
      window.__CENTRIFUNGAL._callbacks.push(fn);
    }
  };

  // Try to load config from the backend
  // Use the fallback URL to bootstrap - we need to know where the API is
  // to ask the API where it is. In production, this will be the real domain.
  var configUrl = FALLBACK_API_URL + '/api/config';

  // Check if there's a meta tag override (set during deployment)
  var metaTag = document.querySelector('meta[name="api-base-url"]');
  if (metaTag && metaTag.content) {
    configUrl = metaTag.content + '/api/config';
    window.__CENTRIFUNGAL.apiBaseUrl = metaTag.content;
  }

  fetch(configUrl)
    .then(function (res) {
      if (!res.ok) throw new Error('Config endpoint returned ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data.api_base_url) {
        window.__CENTRIFUNGAL.apiBaseUrl = data.api_base_url;
      }
    })
    .catch(function () {
      // Silently use fallback
    })
    .finally(function () {
      window.__CENTRIFUNGAL.ready = true;
      window.__CENTRIFUNGAL._callbacks.forEach(function (fn) { fn(); });
      window.__CENTRIFUNGAL._callbacks = [];
    });
})();
