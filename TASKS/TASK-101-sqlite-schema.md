## Task 101: SQLite Database Schema
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-100

### Context
The transactional data layer. Products with size variants, orders, and cart sessions all live in SQLite. CMS content stays in flat files. This schema underpins cart, checkout, order fulfilment, and tracking.

### What Needs Doing
1. Create migration: `products` table - `id`, `statamic_id` (nullable, links to Statamic entry), `name`, `slug`, `description`, `category`, `base_price_pence` (integer), `is_active` (boolean), `images` (JSON), `created_at`, `updated_at`
2. Create migration: `product_variants` table - `id`, `product_id` (FK), `name` (e.g. "Small", "Large"), `sku`, `price_pence` (integer), `weight_grams` (integer), `in_stock` (boolean), `sort_order`, `created_at`, `updated_at`
3. Create migration: `cart_sessions` table - `id`, `session_token` (string, unique, indexed), `expires_at` (datetime), `created_at`, `updated_at`
4. Create migration: `cart_items` table - `id`, `cart_session_id` (FK, cascade delete), `product_variant_id` (FK), `quantity` (integer), `created_at`, `updated_at`. Add unique constraint on `[cart_session_id, product_variant_id]`
5. Create migration: `orders` table - `id`, `order_number` (string, unique), `stripe_payment_intent_id` (string, unique, indexed), `stripe_checkout_session_id` (string, nullable), `status` (enum: pending, paid, fulfilled, shipped, delivered, failed), `customer_name`, `customer_email`, `shipping_address` (JSON), `items_snapshot` (JSON - frozen copy of cart at checkout), `subtotal_pence`, `shipping_pence`, `total_pence`, `royal_mail_order_id` (nullable), `tracking_number` (nullable), `tracking_url` (nullable), `shipped_at` (nullable), `delivered_at` (nullable), `created_at`, `updated_at`
6. Create migration: `contact_submissions` table - `id`, `name`, `email`, `message`, `ip_address`, `created_at`
7. Create Eloquent models for all tables with relationships defined
8. Create a seeder with sample products (3 grow log types x 3 sizes, colonised dowels, DIY kits, tinctures)

### Files
- `database/migrations/xxxx_create_products_table.php`
- `database/migrations/xxxx_create_product_variants_table.php`
- `database/migrations/xxxx_create_cart_sessions_table.php`
- `database/migrations/xxxx_create_cart_items_table.php`
- `database/migrations/xxxx_create_orders_table.php`
- `database/migrations/xxxx_create_contact_submissions_table.php`
- `app/Models/Product.php`
- `app/Models/ProductVariant.php`
- `app/Models/CartSession.php`
- `app/Models/CartItem.php`
- `app/Models/Order.php`
- `app/Models/ContactSubmission.php`
- `database/seeders/ProductSeeder.php`

### How to Test
- `php artisan migrate` runs without errors
- `php artisan db:seed` populates products and variants
- All model relationships return correct related records (write a quick Tinker verification or unit test)
- Unique constraints reject duplicates as expected

### Unexpected Outcomes
- SQLite not supporting a needed column type or constraint - flag and propose workaround
- Statamic Eloquent Driver conflicts with custom Eloquent models - flag

### On Completion
Queue TASK-102, then TASK-103 and TASK-104.
