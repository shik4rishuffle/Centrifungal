## Task 113: API Rate Limiting on Public Endpoints
**Phase:** 2 | **Agent:** backend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-100

### Context
Public API endpoints (products, cart, checkout, contact) need rate limiting to prevent abuse. Laravel provides built-in rate limiting via middleware. This protects against scraping, cart manipulation, and checkout spam.

### What Needs Doing
1. Define rate limit tiers in `app/Providers/AppServiceProvider.php` (or `RouteServiceProvider`):
   - `api-public`: 60 requests/minute per IP (product browsing)
   - `api-cart`: 30 requests/minute per IP (cart operations)
   - `api-checkout`: 5 requests/minute per IP (checkout creation)
   - `api-contact`: 3 requests/minute per IP (contact form)
   - `cp-login`: 5 requests/minute per IP (Statamic login)
2. Apply rate limit middleware to route groups in `routes/api.php`
3. Apply `cp-login` limiter to the Statamic login route
4. Return proper `429 Too Many Requests` response with `Retry-After` header
5. Use `RateLimiter::for()` with `Limit::perMinute()` syntax

### Files
- `app/Providers/AppServiceProvider.php`
- `routes/api.php`
- `routes/web.php` (for CP login rate limit)

### How to Test
- Exceeding 60 requests/minute on product endpoints returns 429
- Exceeding 5 requests/minute on checkout returns 429
- `Retry-After` header is present in 429 responses
- Different IPs have independent rate limits
- Rate limits reset after the window expires

### Unexpected Outcomes
- Railway reverse proxy masks client IPs (all requests appear from same IP) - check for `X-Forwarded-For` header and configure trusted proxies
- Rate limiting too aggressive for legitimate use (e.g. frontend SSG build hitting product API) - add bypass for known build IPs or use API key

### On Completion
No further dependencies from this task.
