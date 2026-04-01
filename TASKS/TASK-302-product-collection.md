## Task 302: Product Collection Blueprint
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-300

### Context
Products are the core of the shop. The blueprint must capture all data the frontend and Stripe integration need while keeping the editing experience simple for the owner. Products are stored as Statamic flat-file entries but must expose data via API for the frontend to consume.

### What Needs Doing
1. Create a `products` collection in `content/collections/products.yaml`
   - Route: `/products/{slug}`
   - Sort order: manual (owner can drag to reorder)
   - Enable published/draft toggle (draft = not visible on frontend)
2. Create the product blueprint with these fields:
   - **name** (text, required, max 120 chars)
   - **description** (Bard, restricted to text_block set only - keeps product descriptions simple)
   - **price** (integer, required, stored in pence - display helper shows GBP) - add instructions text: "Enter price in pence, e.g. 1299 = GBP 12.99"
   - **sizes_variants** (replicator) - each row: variant_name (text, required), price_override (integer, optional), sku (text, required), in_stock (toggle, default true)
   - **images** (assets, max 8, required min 1) - linked to product-images asset container
   - **category** (select: grow-logs, colonised-dowels, diy-kits, tinctures)
   - **in_stock** (toggle, default true) - master stock toggle; if false, overrides all variant toggles
   - **weight_grams** (integer, required) - needed for Royal Mail shipping calculation
   - **stripe_price_id** (text, hidden from owner in UI but present in blueprint for backend use)
3. Add field instructions/help text to every field so the owner understands what each one does
4. Configure the collection listing columns to show: name, category, price (formatted), in_stock status
5. Enable search on the collection so the owner can find products quickly

### Files
- `content/collections/products.yaml`
- `resources/blueprints/collections/products/product.yaml`

### How to Test
- In the control panel, navigate to Products and confirm the "Create Product" button is visible
- Create a product with all fields filled, including multiple size variants and multiple images
- Save and confirm the YAML entry file is created in `content/collections/products/`
- Confirm the listing view shows name, category, formatted price, and stock status columns
- Confirm the search bar filters products by name
- Confirm draft products do not appear via the content API

### Unexpected Outcomes
- If Statamic 6 replicator has changed its data structure, flag for frontend agent
- If the integer-in-pence approach creates UX confusion during testing, flag - may need a custom fieldtype with GBP formatting

### On Completion
Queue TASK-303 (product management UX refinement). Notify backend agent that the product data structure is defined for API integration.
