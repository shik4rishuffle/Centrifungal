## Task 307: Order Visibility in CMS Admin
**Phase:** 3 | **Agent:** cms
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-300

### Context
The owner needs to see incoming orders without accessing the database directly. Orders are stored in SQLite (not flat files) because they are transactional data. This task creates a read-only order view inside the Statamic control panel.

### What Needs Doing
1. Create a custom Statamic CP section called "Orders" using a custom addon or CP nav extension
2. Build an Eloquent model `App\Models\Order` that reads from the SQLite `orders` table (table created by backend agent)
3. Create a listing view showing: order number, customer name, email, total (formatted GBP), status (paid/shipped/delivered), date created
4. Create a detail view showing: full order items (product name, variant, quantity, price), shipping address, tracking number (if available), status timeline
5. All views are read-only - the owner cannot edit or delete orders from the CMS
6. Add a search/filter bar: filter by status, search by order number or customer name
7. Register the Orders section in the CP navigation with an appropriate icon
8. Paginate the listing (20 orders per page)

### Files
- `app/Models/Order.php` (if not already created by backend agent)
- `app/Providers/CmsServiceProvider.php` or equivalent (CP nav registration)
- `app/Http/Controllers/CP/OrdersController.php`
- `resources/views/cp/orders/index.blade.php`
- `resources/views/cp/orders/show.blade.php`

### How to Test
- Log into the control panel and confirm "Orders" appears in the left sidebar
- With test order data in SQLite, confirm orders display with correct formatting
- Click an order to see the detail view - confirm all fields render correctly
- Confirm the owner cannot edit any order fields (no save button, no editable inputs)
- Confirm search filters work: filter by "shipped" status, search by order number
- Confirm pagination works with >20 orders

### Unexpected Outcomes
- If the backend agent has not yet created the orders table/model, flag as a dependency blocker
- If Statamic 6's CP extension API has changed significantly, flag for research
- If connecting to SQLite from within Statamic's flat-file context causes issues, flag for backend agent

### On Completion
Owner can see all orders. Feeds into TASK-309 (owner runbook). Notify backend agent that the orders CP view expects specific table columns.
