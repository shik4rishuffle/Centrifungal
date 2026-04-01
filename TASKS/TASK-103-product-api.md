## Task 103: Product API Endpoints
**Phase:** 2 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-101, TASK-102

### Context
The static frontend needs product data to render listings and detail pages. These are read-only public endpoints that the frontend calls at build time (SSG) and/or at runtime for dynamic data like stock status.

### What Needs Doing
1. Create `app/Http/Controllers/Api/ProductController.php`
2. `GET /api/products` - list all active products with their variants. Support `?category=` filter. Paginate (default 20 per page). Return JSON: `id`, `name`, `slug`, `category`, `base_price_pence`, `images`, `variants[]`
3. `GET /api/products/{slug}` - single product with all variants and full description
4. `GET /api/products/categories` - list distinct categories with product counts
5. Create `app/Http/Resources/ProductResource.php` and `ProductVariantResource.php` for consistent JSON structure
6. Add routes in `routes/api.php`
7. Ensure only `is_active = true` products are returned
8. Add cache headers (e.g. `Cache-Control: public, max-age=300`) for CDN/browser caching

### Files
- `app/Http/Controllers/Api/ProductController.php`
- `app/Http/Resources/ProductResource.php`
- `app/Http/Resources/ProductVariantResource.php`
- `routes/api.php`

### How to Test
- `GET /api/products` returns seeded products with correct JSON structure
- `GET /api/products?category=grow-logs` filters correctly
- `GET /api/products/shiitake-grow-log` returns single product with variants
- `GET /api/products/categories` returns category list with counts
- Inactive products are excluded from all responses
- Non-existent slug returns 404 with JSON error

### Unexpected Outcomes
- Statamic product entries and Eloquent product records need a sync mechanism not yet designed - flag for architect review
- N+1 query issues on variants - ensure eager loading is in place

### On Completion
Queue TASK-104 if not already started.
