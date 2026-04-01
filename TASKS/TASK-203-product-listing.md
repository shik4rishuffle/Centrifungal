## Task 203: Product Listing Page
**Phase:** 2 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-201

### Context
The shop page lists all available products. With 10-20 SKUs it does not need pagination or filtering in v1, but must present products clearly and link through to detail pages.

### What Needs Doing
1. Build a product listing page with:
   - **Page header:** "Shop" title with optional subtitle.
   - **Product grid:** responsive grid of product cards (reuse TASK-201 component). 3 columns desktop, 2 tablet, 1 mobile.
   - **Category grouping (optional):** if products span distinct categories (grow logs, dowels, kits, tinctures), group them with section headings.
2. Fetch product data from `products.json` placeholder (or API endpoint once backend is ready).
3. Each product card links to its detail page (`/product/{slug}`).
4. Show "Out of Stock" badge on unavailable products (greyed-out card, disabled CTA).

### Files
- `src/shop.html` (create)
- `src/js/shop.js` (create - product grid rendering)

### How to Test
- All placeholder products render in a grid.
- Grid is responsive across breakpoints.
- Out-of-stock products display badge and disabled state.
- Card links point to correct product detail URLs.
- Page is accessible - product cards are navigable via keyboard.

### Unexpected Outcomes
- If product data schema changes during backend development, flag for sync.
- If 20 products cause performance issues on mobile, flag for lazy-load investigation.

### On Completion
Queue TASK-204 (Product Detail Page).
