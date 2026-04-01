## Task 205: Cart UI (Client-Side State, localStorage, Add/Remove/Update)
**Phase:** 2 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-201

### Context
The cart is entirely client-side (localStorage) until checkout, when the cart contents are sent to the backend to create a Stripe Checkout session. This module powers add-to-cart on product pages, the cart summary display, and feeds into the checkout flow.

### What Needs Doing
1. Build a cart module (`cart.js`) as a vanilla JS module:
   - `addItem(product, variant, quantity)` - add or increment item.
   - `removeItem(itemId)` - remove item entirely.
   - `updateQuantity(itemId, quantity)` - update quantity (min 1, or remove if 0).
   - `getCart()` - return current cart contents.
   - `getCartCount()` - return total item count (for header badge).
   - `getCartTotal()` - return calculated total.
   - `clearCart()` - empty cart (used after successful checkout).
   - All mutations persist to `localStorage` and dispatch a custom event (`cart-updated`) for UI reactivity.
2. Build the cart page/slide-out panel:
   - List all cart items with: product name, variant/size, unit price, quantity stepper, line total, remove button.
   - Cart summary: subtotal, shipping note ("Shipping calculated at checkout" or flat rate if defined), total.
   - "Continue Shopping" link and "Proceed to Checkout" button.
   - Empty cart state with CTA to shop.
3. Add cart count badge to the header component (listens for `cart-updated` event).
4. Show success/error toast on cart actions.

### Files
- `src/js/cart.js` (create - cart state module)
- `src/cart.html` (create - cart page)
- `src/js/cart-ui.js` (create - cart page rendering and interactions)

### How to Test
- Add item from product page - cart count in header updates immediately.
- Open cart page - all items display with correct name, variant, price, quantity.
- Increment/decrement quantity - line total and cart total update.
- Remove item - item disappears, totals update. If last item removed, empty state shows.
- Refresh page - cart persists from localStorage.
- Clear cart - localStorage is empty, cart shows empty state.
- `cart-updated` custom event fires on every mutation (verify in console).

### Unexpected Outcomes
- If localStorage is disabled/full, flag for graceful degradation strategy (sessionStorage fallback or in-memory with warning).
- If product data shape from backend differs from assumptions, flag for sync.

### On Completion
Queue TASK-204 (Product Detail Page) for add-to-cart integration. Queue TASK-206 (Checkout Flow) for checkout integration.
