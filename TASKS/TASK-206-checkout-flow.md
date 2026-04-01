## Task 206: Checkout Flow (Cart Summary -> Redirect to Stripe Checkout)
**Phase:** 3 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-205

### Context
The checkout flow is a redirect model - the frontend collects the cart, sends it to the PHP backend API which creates a Stripe Checkout session, then redirects the customer to Stripe's hosted checkout page. The frontend does not handle payment details directly.

### What Needs Doing
1. Build the checkout initiation flow:
   - "Proceed to Checkout" button on cart page calls the backend API endpoint (`POST /api/checkout`).
   - Request body: cart items array (product ID, variant ID, quantity).
   - On success: redirect to the Stripe Checkout URL returned by the API.
   - On error: display error message (toast or inline) - e.g. "Item out of stock", "Server error".
   - Show loading state on button during API call.
2. Handle the Stripe Checkout return URLs:
   - **Success URL** (`/order-confirmation?session_id={CHECKOUT_SESSION_ID}`): redirect target after successful payment. Clears localStorage cart.
   - **Cancel URL** (`/cart`): redirect target if customer cancels on Stripe. Cart preserved.
3. Add a minimal checkout review step if warranted (optional - can be just the cart page with prominent checkout button).

### Files
- `src/js/checkout.js` (create - API call, redirect logic, error handling)
- Modify `src/js/cart-ui.js` (add checkout button handler)

### How to Test
- Click "Proceed to Checkout" - loading state appears on button.
- With mock API (or real backend): successful response redirects to Stripe Checkout URL.
- API error (e.g. 400, 500) shows user-friendly error message, button returns to normal state.
- After successful Stripe payment, landing on success URL clears the cart.
- Cancelling on Stripe returns to cart page with cart intact.

### Unexpected Outcomes
- If backend API contract (`POST /api/checkout` request/response shape) is not yet finalised, flag for backend sync.
- If CORS issues arise between Netlify static site and Railway API, flag for backend to configure CORS headers.

### On Completion
Queue TASK-211 (Order Confirmation Page).
