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
