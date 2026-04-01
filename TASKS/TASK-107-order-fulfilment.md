## Task 107: Order Fulfilment Flow
**Phase:** 3 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-106, TASK-108

### Context
After an order is created from a Stripe webhook, it must be automatically pushed to Royal Mail Click & Drop for label generation and shipping. This is the bridge between payment confirmation and physical fulfilment.

### What Needs Doing
1. Create `app/Services/FulfilmentService.php`
2. After order creation in `OrderService`, dispatch a queued job `FulfilOrder`
3. `FulfilOrder` job:
   - Load the order with items snapshot
   - Format the order for Royal Mail Click & Drop API (see TASK-108 for API contract)
   - Call `RoyalMailService::pushOrder()`
   - On success: update order status to `fulfilled`, store `royal_mail_order_id`
   - On failure: log error, set status to `paid` (unchanged), schedule retry with exponential backoff (max 3 retries)
4. Create `app/Jobs/FulfilOrder.php` with retry logic
5. Use Laravel's queue system (sync driver for SQLite simplicity, or database driver if needed)
6. Add order status transition validation (orders can only move forward: paid -> fulfilled -> shipped -> delivered)

### Files
- `app/Services/FulfilmentService.php`
- `app/Jobs/FulfilOrder.php`
- `app/Services/OrderService.php` (modify to dispatch job)
- `app/Models/Order.php` (add status transition methods)

### How to Test
- After order creation, `FulfilOrder` job is dispatched
- Successful Royal Mail push sets order status to `fulfilled` and stores `royal_mail_order_id`
- Failed Royal Mail push retries up to 3 times with backoff
- After 3 failures, order stays at `paid` and an error is logged
- Status transitions are enforced (cannot go from `shipped` back to `paid`)

### Unexpected Outcomes
- Queue driver choice impacts reliability (sync = blocking webhook response time) - consider `database` queue driver with `php artisan queue:work`
- Royal Mail API downtime during high-order period - ensure manual fulfilment path exists via Statamic CP or direct API retry command

### On Completion
Queue TASK-109.
