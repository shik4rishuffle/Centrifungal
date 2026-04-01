## Task 008: Security Headers (CSP, HSTS, etc.)
**Phase:** 3 | **Agent:** architect
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-002, TASK-003

### Context
Security headers protect against XSS, clickjacking, MIME sniffing, and other common web attacks. They must be configured on both Netlify (static assets) and Railway (API responses) before launch.

### What Needs Doing
1. Add security headers to `frontend/netlify.toml` under `[[headers]]`:
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Permissions-Policy = "camera=(), microphone=(), geolocation=()"
       Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
       Content-Security-Policy = "default-src 'self'; script-src 'self' https://js.stripe.com; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"
   ```
2. Configure the same headers on the Railway/Laravel side via middleware:
   - Create a `SecurityHeaders` middleware in Laravel.
   - Apply to all API responses.
   - CSP for API responses can be more restrictive (no script-src needed).
3. Stripe-specific CSP considerations:
   - `script-src` must include `https://js.stripe.com` for Stripe.js.
   - `frame-src` must include `https://js.stripe.com` and `https://hooks.stripe.com` for Stripe Checkout redirect.
   - `connect-src` must include `https://api.stripe.com` for API calls.
4. Test CSP does not break any page functionality:
   - Checkout flow with Stripe.
   - Image loading (product images may come from a CDN or Statamic asset pipeline).
   - Font loading (Google Fonts or self-hosted).
5. If using Google Fonts, add `https://fonts.googleapis.com` to `style-src` and `https://fonts.gstatic.com` to `font-src`.

### Files
- `frontend/netlify.toml` (modify - add headers section)
- `backend/app/Http/Middleware/SecurityHeaders.php` (create)
- `backend/bootstrap/app.php` or route middleware config (modify - register middleware)

### How to Test
- Run `curl -I https://centrifungal.co.uk` and verify all security headers are present.
- Run `curl -I https://centrifungal.co.uk/api/health` and verify API security headers.
- Use [securityheaders.com](https://securityheaders.com) to scan the live site - target A+ rating.
- Complete a full Stripe Checkout flow - no CSP violations in the browser console.
- Browse all pages - no CSP violations in the browser console.

### Unexpected Outcomes
- If CSP blocks Stripe Checkout, relax the specific directive (do not use `unsafe-inline` for scripts).
- If product images are hosted on an external CDN not yet decided, the `img-src` directive will need updating. Flag for the frontend agent to confirm image hosting.
- If the Statamic control panel breaks due to CSP, add an exception for `/cp/*` routes only.

### On Completion
Security headers are deployed. Queue TASK-009 (smoke tests) to verify nothing is broken.
