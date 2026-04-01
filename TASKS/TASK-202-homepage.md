## Task 202: Homepage Template
**Phase:** 2 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-201

### Context
The homepage is the primary landing page and must communicate the brand, showcase featured products, and guide visitors to the shop. It sets the tone for the entire site.

### What Needs Doing
1. Use the `frontend-design` skill for a distinctive, high-quality homepage layout.
2. Build the homepage with these sections:
   - **Hero:** full-width banner with headline, subheadline, and CTA button linking to the shop. Background image placeholder.
   - **Featured products:** grid of 3-4 product cards (reuse component from TASK-201). Populated from a placeholder JSON data structure matching the Statamic product API shape.
   - **Brand story snippet:** short text block with image, linking to the About page.
   - **How it works / Why us:** 3-column icon + text block (e.g. "Grown locally", "Shipped fast", "Expert care guides").
   - **CTA banner:** secondary call-to-action (e.g. "Explore our care instructions").
3. Include header and footer components.
4. Wire up product card data from a `products.json` placeholder file using vanilla JS fetch or inline data.

### Files
- `src/index.html` (create)
- `src/js/homepage.js` (create - product card rendering)
- `src/data/products.json` (create - placeholder product data)

### How to Test
- Page loads and displays all sections with placeholder content.
- Product cards render from JSON data.
- CTA buttons link to correct destinations (`/shop`, `/about`, `/care`).
- Page looks polished at desktop (1440px), tablet (768px), and mobile (375px) widths.
- Lighthouse Performance score > 80 (before image optimisation pass).

### Unexpected Outcomes
- If hero image is unavailable, use a CSS gradient placeholder and flag for asset delivery.
- If product API shape from backend is not yet defined, use best-guess JSON and flag for backend confirmation.

### On Completion
Queue TASK-203 (Product Listing Page).
