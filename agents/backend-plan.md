# Backend Task Breakdown - Centrifungal v1

Date: 2026-03-31

---

## Task 100: Laravel 12 Scaffold on PHP 8.5 with Statamic 6
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** none

### Context
Foundation task. Every other backend task depends on a working Laravel 12 + Statamic 6 installation. This sets up the project skeleton, directory layout, environment configuration, and confirms PHP 8.5 compatibility.

### What Needs Doing
1. Create a fresh Laravel 12 project using Composer
2. Require `statamic/cms` v6 and run its installer
3. Configure Blade as the template engine (not Antlers) - set `STATAMIC_THEMING_VIEWS_ENABLED=true` and disable Antlers in config
4. Configure `.env` for Railway deployment: `DB_CONNECTION=sqlite`, `DB_DATABASE=/data/database.sqlite`
5. Set up the Dockerfile (PHP 8.5, required extensions: `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `curl`). Pin SQLite to 3.52.0+ in the image
6. Mount Railway persistent volume at `/data` in Dockerfile / `railway.toml`
7. Add `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ROYAL_MAIL_API_KEY` to `.env.example`
8. Confirm `php artisan serve` boots without errors and Statamic control panel loads at `/cp`
9. Commit initial scaffold

### Files
- `composer.json`
- `Dockerfile`
- `railway.toml`
- `.env.example`
- `config/statamic/system.php` (Blade config)
- `config/database.php`

### How to Test
- `composer install` succeeds with no deprecation warnings on PHP 8.5
- `php artisan serve` boots; HTTP 200 on `/`
- Statamic control panel accessible at `/cp` after creating first admin user
- SQLite database file created at configured path

### Unexpected Outcomes
- Statamic 6 not yet published for Laravel 12 - flag and check Statamic release timeline
- PHP 8.5 extension incompatibility with any Statamic dependency - flag specific package

### On Completion
Queue TASK-101 and TASK-112 in parallel.

---

## Task 101: SQLite Database Schema
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-100

### Context
The transactional data layer. Products with size variants, orders, and cart sessions all live in SQLite. CMS content stays in flat files. This schema underpins cart, checkout, order fulfilment, and tracking.

### What Needs Doing
1. Create migration: `products` table - `id`, `statamic_id` (nullable, links to Statamic entry), `name`, `slug`, `description`, `category`, `base_price_pence` (integer), `is_active` (boolean), `images` (JSON), `created_at`, `updated_at`
2. Create migration: `product_variants` table - `id`, `product_id` (FK), `name` (e.g. "Small", "Large"), `sku`, `price_pence` (integer), `weight_grams` (integer), `in_stock` (boolean), `sort_order`, `created_at`, `updated_at`
3. Create migration: `cart_sessions` table - `id`, `session_token` (string, unique, indexed), `expires_at` (datetime), `created_at`, `updated_at`
4. Create migration: `cart_items` table - `id`, `cart_session_id` (FK, cascade delete), `product_variant_id` (FK), `quantity` (integer), `created_at`, `updated_at`. Add unique constraint on `[cart_session_id, product_variant_id]`
5. Create migration: `orders` table - `id`, `order_number` (string, unique), `stripe_payment_intent_id` (string, unique, indexed), `stripe_checkout_session_id` (string, nullable), `status` (enum: pending, paid, fulfilled, shipped, delivered, failed), `customer_name`, `customer_email`, `shipping_address` (JSON), `items_snapshot` (JSON - frozen copy of cart at checkout), `subtotal_pence`, `shipping_pence`, `total_pence`, `royal_mail_order_id` (nullable), `tracking_number` (nullable), `tracking_url` (nullable), `shipped_at` (nullable), `delivered_at` (nullable), `created_at`, `updated_at`
6. Create migration: `contact_submissions` table - `id`, `name`, `email`, `message`, `ip_address`, `created_at`
7. Create Eloquent models for all tables with relationships defined
8. Create a seeder with sample products (3 grow log types x 3 sizes, colonised dowels, DIY kits, tinctures)

### Files
- `database/migrations/xxxx_create_products_table.php`
- `database/migrations/xxxx_create_product_variants_table.php`
- `database/migrations/xxxx_create_cart_sessions_table.php`
- `database/migrations/xxxx_create_cart_items_table.php`
- `database/migrations/xxxx_create_orders_table.php`
- `database/migrations/xxxx_create_contact_submissions_table.php`
- `app/Models/Product.php`
- `app/Models/ProductVariant.php`
- `app/Models/CartSession.php`
- `app/Models/CartItem.php`
- `app/Models/Order.php`
- `app/Models/ContactSubmission.php`
- `database/seeders/ProductSeeder.php`

### How to Test
- `php artisan migrate` runs without errors
- `php artisan db:seed` populates products and variants
- All model relationships return correct related records (write a quick Tinker verification or unit test)
- Unique constraints reject duplicates as expected

### Unexpected Outcomes
- SQLite not supporting a needed column type or constraint - flag and propose workaround
- Statamic Eloquent Driver conflicts with custom Eloquent models - flag

### On Completion
Queue TASK-102, then TASK-103 and TASK-104.

---

## Task 102: WAL Mode Configuration
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-101

### Context
SQLite defaults to rollback journal mode which blocks concurrent reads during writes. WAL mode enables concurrent reads and writes - critical for an API serving a frontend while processing webhooks and cron jobs. Busy timeout prevents "database is locked" errors under light contention.

### What Needs Doing
1. Create a service provider or use `AppServiceProvider::boot()` to execute SQLite pragmas on every connection
2. Set `PRAGMA journal_mode = WAL;`
3. Set `PRAGMA busy_timeout = 5000;` (5 seconds)
4. Set `PRAGMA synchronous = NORMAL;` (safe with WAL mode, better write performance)
5. Set `PRAGMA foreign_keys = ON;` (SQLite disables FK enforcement by default)
6. Verify pragmas apply by querying them back in a test
7. Add a note in config comments about the SQLite 3.52.0+ requirement (WAL-reset bug fix)

### Files
- `app/Providers/AppServiceProvider.php` (or new `app/Providers/DatabaseServiceProvider.php`)
- `config/database.php` (SQLite connection config)

### How to Test
- Boot application and run `PRAGMA journal_mode;` via Tinker - returns `wal`
- Run `PRAGMA busy_timeout;` - returns `5000`
- Run `PRAGMA synchronous;` - returns `1` (NORMAL)
- Run `PRAGMA foreign_keys;` - returns `1`
- Attempt to insert a row violating a FK constraint - confirm it is rejected

### Unexpected Outcomes
- WAL mode fails to engage (file permission issue on Railway volume) - flag
- SQLite version on Railway image is below 3.52.0 - flag, must update Docker image

### On Completion
Queue TASK-103 and TASK-104 in parallel.

---

## Task 103: Product API Endpoints
**Phase:** 2 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-101, TASK-102

### Context
The static frontend needs product data to render listings and detail pages. These are read-only public endpoints that the frontend calls at build time (SSG) and/or at runtime for dynamic data like stock status.

### What Needs Doing
1. Create `app/Http/Controllers/Api/ProductController.php`
2. `GET /api/products` - list all active products with their variants. Support `?category=` filter. Paginate (default 20 per page). Return JSON: `id`, `name`, `slug`, `category`, `base_price_pence`, `images`, `variants[]`
3. `GET /api/products/{slug}` - single product with all variants and full description
4. `GET /api/products/categories` - list distinct categories with product counts
5. Create `app/Http/Resources/ProductResource.php` and `ProductVariantResource.php` for consistent JSON structure
6. Add routes in `routes/api.php`
7. Ensure only `is_active = true` products are returned
8. Add cache headers (e.g. `Cache-Control: public, max-age=300`) for CDN/browser caching

### Files
- `app/Http/Controllers/Api/ProductController.php`
- `app/Http/Resources/ProductResource.php`
- `app/Http/Resources/ProductVariantResource.php`
- `routes/api.php`

### How to Test
- `GET /api/products` returns seeded products with correct JSON structure
- `GET /api/products?category=grow-logs` filters correctly
- `GET /api/products/shiitake-grow-log` returns single product with variants
- `GET /api/products/categories` returns category list with counts
- Inactive products are excluded from all responses
- Non-existent slug returns 404 with JSON error

### Unexpected Outcomes
- Statamic product entries and Eloquent product records need a sync mechanism not yet designed - flag for architect review
- N+1 query issues on variants - ensure eager loading is in place

### On Completion
Queue TASK-104 if not already started.

---

## Task 104: Cart API Endpoints
**Phase:** 2 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-101, TASK-102

### Context
The frontend manages cart UI but the backend persists cart state in SQLite via session tokens. This enables cart recovery and ensures the cart-to-Stripe-checkout flow uses server-validated prices (not client-submitted prices).

### What Needs Doing
1. Create `app/Http/Controllers/Api/CartController.php`
2. Cart identification: use a `cart_token` header or cookie. If no token provided, create a new `CartSession` and return the token. Token is a UUID.
3. `POST /api/cart/items` - add item. Body: `{ "variant_id": int, "quantity": int }`. If variant already in cart, increment quantity. Validate variant exists and is in stock. Return updated cart.
4. `PATCH /api/cart/items/{cartItemId}` - update quantity. Body: `{ "quantity": int }`. Quantity of 0 removes the item. Return updated cart.
5. `DELETE /api/cart/items/{cartItemId}` - remove item. Return updated cart.
6. `GET /api/cart` - get current cart with items, variant details, line totals, and cart total. All prices in pence.
7. Create `app/Http/Resources/CartResource.php` and `CartItemResource.php`
8. Add middleware or logic to expire cart sessions older than 7 days (soft cleanup via scheduled command)
9. Create `app/Console/Commands/PurgeExpiredCarts.php` - delete cart sessions past `expires_at`

### Files
- `app/Http/Controllers/Api/CartController.php`
- `app/Http/Resources/CartResource.php`
- `app/Http/Resources/CartItemResource.php`
- `app/Http/Middleware/ResolveCartSession.php`
- `app/Console/Commands/PurgeExpiredCarts.php`
- `routes/api.php`

### How to Test
- `POST /api/cart/items` with valid variant returns cart with 1 item
- Adding same variant again increments quantity
- `PATCH` to quantity 0 removes item
- `DELETE` removes item, returns updated cart
- `GET /api/cart` with empty cart returns empty items array and zero total
- Invalid variant ID returns 422 with error message
- Out-of-stock variant returns 422 with "out of stock" message
- Cart token persists across requests

### Unexpected Outcomes
- Race condition on concurrent add-to-cart for same variant (unique constraint violation) - handle gracefully with upsert or retry
- Cart token leakage concerns - flag if CORS or security review needed

### On Completion
Queue TASK-105.

---

## Task 105: Stripe Checkout Session Creation
**Phase:** 2 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-104

### Context
When the customer clicks "Checkout", the frontend calls this endpoint. The backend reads the server-side cart (not client-submitted prices), builds Stripe line items, and creates a Checkout Session. The customer is then redirected to Stripe's hosted checkout page.

### What Needs Doing
1. Install `stripe/stripe-php` via Composer
2. Create `app/Http/Controllers/Api/CheckoutController.php`
3. `POST /api/checkout` - requires valid cart token. Reads cart from DB. Validates all items still in stock and prices match current DB values. Creates a Stripe Checkout Session with:
   - `line_items` built from cart (name, price_pence, quantity)
   - `mode: 'payment'`
   - `shipping_address_collection: { allowed_countries: ['GB'] }` (UK only for Royal Mail)
   - `success_url` and `cancel_url` pointing to frontend pages
   - `metadata: { cart_session_id: ... }` for webhook correlation
   - `payment_intent_data: { metadata: { cart_session_id: ... } }` for reconciliation
4. Return `{ checkout_url: session.url }` to frontend
5. Create `app/Services/StripeService.php` to encapsulate Stripe API calls (testable, mockable)
6. Validate cart is not empty before creating session

### Files
- `app/Http/Controllers/Api/CheckoutController.php`
- `app/Services/StripeService.php`
- `config/services.php` (Stripe config block)
- `routes/api.php`

### How to Test
- `POST /api/checkout` with valid cart returns `checkout_url` starting with `https://checkout.stripe.com`
- Empty cart returns 422 with error
- Out-of-stock item in cart returns 422 with specific error
- Stripe Checkout Session contains correct line items, amounts, and metadata
- Invalid or missing cart token returns 401/404

### Unexpected Outcomes
- Stripe API returns unexpected error format - log full response and return generic error to client
- Currency mismatch (must be GBP) - ensure `currency: 'gbp'` is hardcoded
- Shipping cost calculation needed but not yet defined - flag for requirements clarification (flat rate? free? weight-based?)

### On Completion
Queue TASK-106.

---

## Task 106: Stripe Webhook Handler
**Phase:** 2 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-105

### Context
After a customer pays via Stripe Checkout, Stripe sends a `checkout.session.completed` webhook. This is the trigger for order creation and fulfilment. Must be bulletproof - signature verification, idempotency, and reliable order creation.

### What Needs Doing
1. Create `app/Http/Controllers/Webhook/StripeWebhookController.php`
2. Register route `POST /webhook/stripe` - exclude from CSRF protection
3. Verify webhook signature using `STRIPE_WEBHOOK_SECRET` - reject invalid signatures with 400
4. Handle `checkout.session.completed` event:
   - Extract `cart_session_id` from session metadata
   - Check idempotency: if an order with this `stripe_checkout_session_id` already exists, return 200 (already processed)
   - Retrieve the Checkout Session from Stripe API to get shipping address and payment details
   - Snapshot the cart items (product names, variants, quantities, prices) into `items_snapshot` JSON
   - Generate a human-readable order number (e.g. `CF-20260331-0001`)
   - Create order record with status `paid`
   - Clear the cart session
   - Return 200 to Stripe
5. Handle `payment_intent.payment_failed` - log for monitoring, no order creation
6. Log all webhook events (type, ID, timestamp) for debugging
7. Wrap order creation in a DB transaction

### Files
- `app/Http/Controllers/Webhook/StripeWebhookController.php`
- `app/Http/Middleware/VerifyStripeSignature.php` (or use inline verification)
- `routes/web.php` (webhooks go on web routes, excluded from CSRF)
- `app/Services/OrderService.php`

### How to Test
- Valid webhook with correct signature creates an order record
- Duplicate webhook (same checkout session ID) returns 200 without creating duplicate order
- Invalid signature returns 400
- Order record contains correct customer details, items snapshot, and totals
- Order number follows the `CF-YYYYMMDD-NNNN` format
- Cart session is cleared after successful order creation

### Unexpected Outcomes
- Webhook arrives before Checkout Session is fully expanded (race condition) - implement retry or fetch session from Stripe API
- Cart already expired/deleted when webhook arrives - flag; consider keeping cart data longer or snapshotting at checkout creation time
- Database locked during order creation - busy_timeout should handle this, but flag if it recurs

### On Completion
Queue TASK-107 and TASK-110 in parallel.

---

## Task 107: Order Fulfilment Flow
**Phase:** 3 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-106, TASK-108

### Context
After an order is created from a Stripe webhook, it must be automatically pushed to Royal Mail Click & Drop for label generation and shipping. This is the bridge between payment confirmation and physical fulfilment.

### What Needs Doing
1. Create `app/Services/FulfilmentService.php`
2. After order creation in `OrderService`, dispatch a queued job `FulfilOrder`
3. `FulfilOrder` job:
   - Load the order with items snapshot
   - Format the order for Royal Mail Click & Drop API (see TASK-108 for API contract)
   - Call `RoyalMailService::pushOrder()`
   - On success: update order status to `fulfilled`, store `royal_mail_order_id`
   - On failure: log error, set status to `paid` (unchanged), schedule retry with exponential backoff (max 3 retries)
4. Create `app/Jobs/FulfilOrder.php` with retry logic
5. Use Laravel's queue system (sync driver for SQLite simplicity, or database driver if needed)
6. Add order status transition validation (orders can only move forward: paid -> fulfilled -> shipped -> delivered)

### Files
- `app/Services/FulfilmentService.php`
- `app/Jobs/FulfilOrder.php`
- `app/Services/OrderService.php` (modify to dispatch job)
- `app/Models/Order.php` (add status transition methods)

### How to Test
- After order creation, `FulfilOrder` job is dispatched
- Successful Royal Mail push sets order status to `fulfilled` and stores `royal_mail_order_id`
- Failed Royal Mail push retries up to 3 times with backoff
- After 3 failures, order stays at `paid` and an error is logged
- Status transitions are enforced (cannot go from `shipped` back to `paid`)

### Unexpected Outcomes
- Queue driver choice impacts reliability (sync = blocking webhook response time) - consider `database` queue driver with `php artisan queue:work`
- Royal Mail API downtime during high-order period - ensure manual fulfilment path exists via Statamic CP or direct API retry command

### On Completion
Queue TASK-109.

---

## Task 108: Royal Mail Click & Drop API Integration
**Phase:** 3 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-100

### Context
Royal Mail Click & Drop is the shipping integration. Orders are pushed via their REST API with customer address and item details. The API returns an order reference used to track the shipment. This service is consumed by the fulfilment flow (TASK-107).

### What Needs Doing
1. Create `app/Services/RoyalMailService.php`
2. Implement `pushOrder(Order $order): RoyalMailResponse` method:
   - POST to Click & Drop API endpoint (`https://api.parcel.royalmail.com/api/0/orders`)
   - Headers: `Authorization: Bearer {api_key}`, `Content-Type: application/json`
   - Body: recipient name, address lines, city, county, postcode, country code (GB), items array with description, quantity, weight, value
   - Parse response for order ID / reference number
3. Implement `getOrderStatus(string $royalMailOrderId): TrackingInfo` method for the polling cron (TASK-109)
4. Add retry logic with exponential backoff (1s, 2s, 4s) on transient failures (5xx, timeout)
5. Log all API requests and responses (sanitise PII in logs - omit full address, keep postcode prefix only)
6. Create a config block in `config/services.php` for Royal Mail API base URL and key
7. Create a DTO: `app/DTOs/RoyalMailResponse.php` for typed API responses

### Files
- `app/Services/RoyalMailService.php`
- `app/DTOs/RoyalMailResponse.php`
- `config/services.php`

### How to Test
- Mock Royal Mail API and verify correct request body structure
- Successful push returns order ID and stores it on the order
- 5xx response triggers retry
- 4xx response (bad request) does not retry and logs error details
- PII is not written to logs in full

### Unexpected Outcomes
- Click & Drop API authentication model has changed - check current docs and flag
- API rate limiting encountered (unlikely at <20 orders/day but possible during retries) - implement rate limit awareness
- Click & Drop API requires additional fields not in our order schema - flag missing fields

### On Completion
Queue TASK-107 (fulfilment flow depends on this service being ready).

---

## Task 109: Royal Mail Tracking Poller
**Phase:** 3 | **Agent:** backend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-108

### Context
Click & Drop does not provide webhooks for tracking updates. A scheduled command must poll for tracking numbers and status changes, update orders, and trigger shipping notification emails when an order ships.

### What Needs Doing
1. Create `app/Console/Commands/PollRoyalMailTracking.php`
2. Schedule to run every 15 minutes via `routes/console.php` or `app/Console/Kernel.php`
3. Query orders with status `fulfilled` (pushed to Royal Mail but no tracking yet) and `shipped` (has tracking, checking for delivery)
4. For each order, call `RoyalMailService::getOrderStatus()`
5. If tracking number is now available: update order with `tracking_number`, `tracking_url`, set status to `shipped`, set `shipped_at`, dispatch `SendShippingNotification` job (TASK-111)
6. If status indicates delivered: set status to `delivered`, set `delivered_at`
7. Batch API calls where possible to stay within rate limits
8. Add a circuit breaker: if Royal Mail API returns 5 consecutive errors, stop polling for this cycle and log an alert

### Files
- `app/Console/Commands/PollRoyalMailTracking.php`
- `routes/console.php` (schedule registration)

### How to Test
- Command runs without error when no orders need polling
- Order with new tracking number gets updated and shipping email is dispatched
- Order already marked delivered is skipped
- Circuit breaker activates after 5 consecutive API errors
- Command completes within reasonable time for 50 orders

### Unexpected Outcomes
- Royal Mail API returns tracking data in unexpected format - log raw response and flag
- Tracking number never appears for an order (label printed but not scanned) - after 7 days with no tracking, log a warning for manual review
- High number of orders to poll causing timeout - implement chunking

### On Completion
Queue TASK-111 if not already started.

---

## Task 110: Resend Email Integration - Order Confirmation
**Phase:** 3 | **Agent:** backend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-106

### Context
Customers expect an immediate order confirmation email after payment. This builds trust and provides a receipt. Uses Resend as the transactional email provider with Laravel's mail system.

### What Needs Doing
1. Install `resend/resend-laravel` via Composer
2. Configure Resend in `config/mail.php` and `config/services.php` with `RESEND_API_KEY`
3. Set `MAIL_MAILER=resend` in `.env.example`
4. Create `app/Mail/OrderConfirmation.php` (Mailable class)
5. Create Blade email template `resources/views/emails/order-confirmation.blade.php`:
   - Order number
   - Items list with quantities and prices
   - Subtotal, shipping, total
   - Shipping address
   - "We'll email you when your order ships" message
   - From address: configurable (e.g. `orders@centrifungal.co.uk`)
6. Dispatch email from `OrderService` after order creation (use queue if available, otherwise send synchronously)
7. Handle Resend API failures gracefully - log error but do not fail the order creation

### Files
- `app/Mail/OrderConfirmation.php`
- `resources/views/emails/order-confirmation.blade.php`
- `config/mail.php`
- `config/services.php`
- `.env.example`

### How to Test
- After order creation, confirmation email is sent to customer email
- Email contains correct order number, items, and totals
- Resend API failure is logged but order creation still succeeds
- Email renders correctly (test with Mailtrap or Resend test mode)

### Unexpected Outcomes
- Resend Laravel package not compatible with Laravel 12 - use raw Resend HTTP API as fallback
- Email deliverability issues (SPF/DKIM not configured) - flag for DNS setup, not a code issue

### On Completion
Queue TASK-111.

---

## Task 111: Resend Shipping Notification Email
**Phase:** 3 | **Agent:** backend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-110, TASK-109

### Context
When the tracking poller detects a shipment, the customer receives an email with their tracking number and a link to track the package. Completes the automated post-purchase communication flow.

### What Needs Doing
1. Create `app/Mail/ShippingNotification.php` (Mailable class)
2. Create Blade email template `resources/views/emails/shipping-notification.blade.php`:
   - Order number
   - "Your order has been shipped!" message
   - Tracking number
   - Tracking link (clickable URL to Royal Mail tracking page)
   - Estimated delivery note (e.g. "Royal Mail typically delivers within 1-3 working days")
3. Create `app/Jobs/SendShippingNotification.php` - queued job dispatched by the tracking poller
4. Handle Resend API failures - log and retry (max 3 attempts)

### Files
- `app/Mail/ShippingNotification.php`
- `resources/views/emails/shipping-notification.blade.php`
- `app/Jobs/SendShippingNotification.php`

### How to Test
- When tracking poller updates an order to `shipped`, shipping notification email is dispatched
- Email contains correct tracking number and clickable tracking URL
- Failed send retries up to 3 times
- Duplicate shipping notifications are prevented (only send once per order)

### Unexpected Outcomes
- Tracking URL format changes from Royal Mail - make URL pattern configurable
- Customer email address invalid/bounces - log bounce, do not retry

### On Completion
All email tasks complete. No further dependency.

---

## Task 112: Auth - Admin Session for Statamic CMS
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-100

### Context
The site owner needs to log into the Statamic control panel to manage content and products. Statamic Core free tier supports 1 admin user. This task ensures auth is configured securely with no public registration.

### What Needs Doing
1. Create the first (and only) admin user via `php artisan statamic:make:user`
2. Disable public user registration in Statamic config
3. Ensure the Statamic control panel is only accessible at `/cp` (default)
4. Configure session security: `SESSION_DRIVER=file` (or `cookie`), `SESSION_LIFETIME=120`, `SESSION_SECURE_COOKIE=true` in production
5. Ensure CSRF protection is active on the control panel
6. Add `/cp` to any rate limiting rules (TASK-113) to prevent brute force on login
7. Verify that Statamic's built-in auth guards work correctly with Laravel 12

### Files
- `config/statamic/users.php`
- `config/session.php`
- `.env.example` (session config vars)
- `users/` directory (Statamic flat-file user storage)

### How to Test
- Admin can log in at `/cp` with correct credentials
- Invalid credentials are rejected with appropriate error
- No public registration route exists
- Session expires after configured lifetime
- CSRF token is required for login form submission

### Unexpected Outcomes
- Statamic auth conflicts with Laravel 12 default auth scaffolding - remove any conflicting auth routes
- Session storage issues on Railway (file permissions) - switch to cookie or database driver

### On Completion
No further dependencies from this task.

---

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

---

## Task 114: Stripe Reconciliation Cron
**Phase:** 4 | **Agent:** backend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-106

### Context
Webhooks can fail silently despite Stripe's retry mechanism. A reconciliation cron catches any missed payments by comparing Stripe's records against the local orders table. This is a safety net - it should rarely find discrepancies.

### What Needs Doing
1. Create `app/Console/Commands/ReconcileStripePayments.php`
2. Schedule to run every hour via `routes/console.php`
3. Logic:
   - Query Stripe API for completed Checkout Sessions in the last 24 hours
   - For each session, check if a matching order exists in the local DB (by `stripe_checkout_session_id`)
   - If a paid session has no local order: create the order using the same logic as the webhook handler (via `OrderService`)
   - Log any reconciled orders as warnings (these represent missed webhooks)
4. Use Stripe's list endpoint with `created` filter to limit query scope
5. Add a `reconciled_at` timestamp to orders created via reconciliation (to distinguish from webhook-created orders)
6. Limit to processing max 50 sessions per run to avoid long-running jobs

### Files
- `app/Console/Commands/ReconcileStripePayments.php`
- `routes/console.php`
- `database/migrations/xxxx_add_reconciled_at_to_orders.php` (if needed, or include in original schema)

### How to Test
- When no discrepancies exist, command completes with "0 orders reconciled" log
- When a missed webhook is simulated (create Stripe session but delete local order), reconciliation creates the order
- Reconciled orders have `reconciled_at` set
- Command does not create duplicate orders (idempotency check via `stripe_checkout_session_id`)
- Command completes within reasonable time

### Unexpected Outcomes
- Stripe API rate limits hit during reconciliation - implement pagination and respect rate limit headers
- Cart session already expired for a missed webhook - order still created using Stripe session data (items may need to come from Stripe line items rather than cart)
- High number of reconciled orders indicates a webhook endpoint issue - log as critical alert

### On Completion
No further dependencies from this task.

---

## Task 115: Contact Form Endpoint
**Phase:** 2 | **Agent:** backend
**Priority:** Low | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-101, TASK-110

### Context
The site has a contact form (Statamic Core free tier includes 1 form). The backend validates the submission, stores it in the database, and sends a notification email to the site owner via Resend.

### What Needs Doing
1. Create `app/Http/Controllers/Api/ContactController.php`
2. `POST /api/contact` - validate and store contact form submission:
   - Required fields: `name` (string, max 255), `email` (valid email, max 255), `message` (string, max 5000)
   - Store in `contact_submissions` table with `ip_address` (for spam tracking)
   - Send notification email to site owner (configurable recipient in `.env`)
   - Return 201 with success message
3. Create `app/Mail/ContactFormNotification.php` - email to owner containing the submission details
4. Create Blade template `resources/views/emails/contact-form.blade.php`
5. Add basic spam protection: honeypot field (reject if filled) and rate limiting (TASK-113 covers rate limit)
6. Add route in `routes/api.php` with `api-contact` rate limiter

### Files
- `app/Http/Controllers/Api/ContactController.php`
- `app/Mail/ContactFormNotification.php`
- `resources/views/emails/contact-form.blade.php`
- `routes/api.php`
- `.env.example` (`CONTACT_FORM_RECIPIENT`)

### How to Test
- Valid submission returns 201 and creates DB record
- Missing required field returns 422 with validation errors
- Honeypot field filled returns 422 (silently reject spam)
- Owner receives notification email with submission details
- IP address is stored on the record
- Rate limit (3/min) rejects excessive submissions

### Unexpected Outcomes
- Spam volume too high despite honeypot + rate limiting - consider adding a simple CAPTCHA (but flag first, as it adds frontend complexity)
- Resend email to owner fails - log error, but still store submission in DB (owner can view in Statamic CP)

### On Completion
No further dependencies from this task.

---

## Dependency Graph

```
TASK-100 (scaffold)
├── TASK-101 (schema)
│   ├── TASK-102 (WAL mode)
│   │   ├── TASK-103 (product API)
│   │   └── TASK-104 (cart API)
│   │       └── TASK-105 (Stripe checkout)
│   │           └── TASK-106 (Stripe webhook)
│   │               ├── TASK-107 (fulfilment flow) ← also depends on TASK-108
│   │               │   └── TASK-109 (tracking poller)
│   │               │       └── TASK-111 (shipping email) ← also depends on TASK-110
│   │               ├── TASK-110 (order confirmation email)
│   │               └── TASK-114 (Stripe reconciliation)
│   └── TASK-115 (contact form) ← also depends on TASK-110
├── TASK-108 (Royal Mail API) ← can start early, consumed by TASK-107
├── TASK-112 (auth)
└── TASK-113 (rate limiting)
```

## Execution Order (suggested phases)

| Phase | Tasks | Rationale |
|---|---|---|
| 1 | TASK-100, TASK-101, TASK-102, TASK-112 | Foundation: scaffold, schema, SQLite config, auth |
| 2 | TASK-103, TASK-104, TASK-108, TASK-113 | Core API: products, cart, Royal Mail service, rate limiting |
| 3 | TASK-105, TASK-106, TASK-110, TASK-115 | Payments and email: checkout, webhook, order confirmation, contact form |
| 4 | TASK-107, TASK-109, TASK-111 | Fulfilment: order push, tracking poller, shipping notification |
| 5 | TASK-114 | Safety net: Stripe reconciliation cron |
