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
