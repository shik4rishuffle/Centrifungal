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
