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
