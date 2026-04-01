## Task 211: Order Confirmation / Thank You Page
**Phase:** 3 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-206

### Context
After successful Stripe Checkout payment, the customer is redirected to this page. It confirms the order was received and sets expectations for next steps (email confirmation, shipping). The page reads the Stripe session ID from the URL to optionally fetch order details from the backend.

### What Needs Doing
1. Build the order confirmation page:
   - **Success message:** "Thank you for your order!" with a checkmark/success icon.
   - **Order summary (optional):** if backend provides an endpoint to fetch order details by session ID, display order items, total, and shipping address. If not available in v1, show a generic confirmation.
   - **Next steps:** "You will receive an email confirmation shortly. We will notify you when your order ships."
   - **CTA:** "Continue Shopping" button linking to the shop.
2. On page load:
   - Extract `session_id` from URL query parameter.
   - Clear the localStorage cart (call `clearCart()` from TASK-205).
   - Optionally fetch order details from `GET /api/order?session_id={id}`.
3. Handle edge cases: no session_id in URL (show generic thank-you), API error (show generic thank-you with note to check email).

### Files
- `src/order-confirmation.html` (create)
- `src/js/order-confirmation.js` (create - session handling, cart clearing, optional order fetch)

### How to Test
- Navigating to `/order-confirmation?session_id=test123` clears the cart and shows confirmation.
- Cart count in header updates to 0.
- Page displays without errors even if session_id is missing or API call fails.
- "Continue Shopping" button links to shop page.

### Unexpected Outcomes
- If backend order details endpoint is not available, build the generic version and flag for future enhancement.

### On Completion
Notify orchestrator that all page templates are complete. Queue TASK-212 (SEO).
