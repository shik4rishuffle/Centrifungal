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

  // In production (Netlify), use relative URLs so requests go through the /api/* proxy.
  // For local dev, set a <meta name="api-base-url" content="http://localhost:8001"> tag.
  var FALLBACK_API_URL = '';

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

  // With the Netlify proxy handling /api/* -> Railway, we always use relative URLs.
  // No need to fetch config from the backend.
  window.__CENTRIFUNGAL.ready = true;
  window.__CENTRIFUNGAL._callbacks.forEach(function (fn) { fn(); });
  window.__CENTRIFUNGAL._callbacks = [];
})();
