## Task 213: Performance Pass - Image Optimisation, Lazy Loading, Lighthouse 90+
**Phase:** 5 | **Agent:** frontend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-202, TASK-203, TASK-204, TASK-212

### Context
A fast-loading static site is a key success criterion. This task is a dedicated pass across all pages to optimise assets, implement lazy loading, and achieve Lighthouse Performance 90+ across all pages.

### What Needs Doing
1. **Image optimisation:**
   - Convert all images to WebP format with JPEG/PNG fallback using `<picture>` elements.
   - Define responsive image sizes using `srcset` and `sizes` attributes.
   - Ensure all images have explicit `width` and `height` attributes (prevent CLS).
2. **Lazy loading:**
   - Add `loading="lazy"` to all below-the-fold images.
   - Lazy-load product grid images on shop page.
   - Do NOT lazy-load hero images or LCP elements.
3. **CSS/JS optimisation:**
   - Inline critical CSS for above-the-fold content on each page.
   - Defer non-critical CSS and JS.
   - Minify CSS and JS files (document the build step or use a simple script).
4. **Font optimisation:**
   - Use `font-display: swap` on all @font-face declarations.
   - Preload the primary heading and body fonts.
   - Subset fonts if feasible.
5. **General:**
   - Add `<link rel="preconnect">` for external origins (Google Fonts, Stripe, API domain).
   - Ensure no render-blocking resources.
   - Review and eliminate unused CSS.

### Files
- Modify all `src/*.html` files (lazy loading, preconnect, critical CSS)
- Modify `src/css/*.css` files (font-display, unused CSS removal)
- `scripts/build.sh` (create - minification and image processing script, if needed)

### How to Test
- Run Lighthouse on every page - Performance score 90+ on mobile.
- LCP < 2.5s, FID < 100ms, CLS < 0.1 on all pages.
- Images load progressively (visible lazy loading on scroll).
- No render-blocking resources flagged by Lighthouse.
- Site works with JS disabled (progressive enhancement - content is visible).

### Unexpected Outcomes
- If product images from CMS are not optimised at source, flag for CMS-side image processing pipeline.
- If third-party scripts (Stripe.js) impact performance, flag with metrics.

### On Completion
Queue TASK-214 (Responsive Design).
