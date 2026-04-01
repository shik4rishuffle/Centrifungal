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
