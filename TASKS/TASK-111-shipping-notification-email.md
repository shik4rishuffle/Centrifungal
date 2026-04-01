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
