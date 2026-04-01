## Task 204: Product Detail Page (with Size Variant Selector)
**Phase:** 2 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-201, TASK-205

### Context
This is the key conversion page. Products like grow logs come in multiple sizes. The customer must select a size variant (which may change the displayed price) before adding to cart. This page drives add-to-cart actions.

### What Needs Doing
1. Build the product detail page with:
   - **Product image gallery:** main image + thumbnail strip. Click thumbnail to swap main image. Placeholder images for now.
   - **Product info:** title, price, short description.
   - **Size variant selector:** radio buttons or segmented control for size options. Selecting a variant updates the displayed price dynamically.
   - **Quantity selector:** +/- stepper (reuse component from TASK-201).
   - **Add to Cart button:** calls cart module from TASK-205. Shows success toast on add.
   - **Long description / details:** rich text block (HTML content from CMS).
   - **Care instructions link:** contextual link to the relevant care guide.
2. Wire variant selector to update price display using vanilla JS.
3. Integrate with the cart module (TASK-205) for add-to-cart functionality.
4. Product data sourced from `products.json` placeholder, matched by URL slug.

### Files
- `src/product.html` (create)
- `src/js/product.js` (create - variant selector, image gallery, add-to-cart integration)

### How to Test
- Selecting a size variant updates the displayed price without page reload.
- Add to Cart button adds the correct product + variant + quantity to localStorage cart.
- Success toast appears after adding to cart.
- Image gallery thumbnail click swaps the main image.
- Page renders correctly on all breakpoints.
- If product has no variants, variant selector is hidden and default price shows.

### Unexpected Outcomes
- If variant/size data structure from backend differs from placeholder, flag for sync.
- If image gallery requires a lightbox, flag for scope discussion (not in original requirements).

### On Completion
Queue TASK-206 (Checkout Flow) once TASK-205 (Cart UI) is also complete.
