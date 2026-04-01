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
