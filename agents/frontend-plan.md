# Frontend Plan - Centrifungal v1

Date: 2026-03-31

---

## Task 200: Design System - Colour Palette, Typography Scale, Spacing Tokens
**Phase:** 1 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** none

### Context
Every component and page depends on a shared design system. This must land first so all downstream tasks pull from a single source of truth for colours, type, and spacing. The brand palette derives from the Centrifungal logo - gold/orange coin with dark green mushroom motif - translating to greens and warm golds/yellows.

### What Needs Doing
1. Use the `ui-ux-pro-max` skill to select a colour palette (greens + warm golds) and font pairing suited to an artisan/natural-products e-commerce brand.
2. Define CSS custom properties in a `design-tokens.css` file:
   - Primary palette: 3-4 greens (dark to light), 2-3 warm golds/yellows, 1-2 neutrals (off-white, charcoal).
   - Semantic tokens: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-error`, `--color-success`.
   - Typography scale: base size (16px), scale ratio (~1.25), levels from `--text-xs` through `--text-4xl`. Define `--font-heading` and `--font-body` families.
   - Spacing tokens: `--space-xs` through `--space-4xl` on a consistent scale (4px base).
   - Border radius, shadow, and transition tokens.
3. Create a `design-system.html` reference page that renders all tokens visually (colour swatches, type samples, spacing blocks).
4. Include a CSS reset/normalize at the top of the token file or as a companion file.

### Files
- `src/css/design-tokens.css` (create)
- `src/css/reset.css` (create)
- `src/design-system.html` (create - reference/demo page)

### How to Test
- Open `design-system.html` in a browser - all swatches, type samples, and spacing blocks render correctly.
- Greens and golds are visually harmonious and match the brand description (gold/orange coin, dark green mushroom).
- All tokens are referenced via CSS custom properties - no hardcoded hex values outside the token file.
- Passes WCAG AA contrast for text tokens against surface tokens.

### Unexpected Outcomes
- If the logo file is not yet available, flag to orchestrator - palette can still be defined from the brand description but final tuning may need a revision pass.
- If chosen Google Fonts have licensing issues or large payload, flag alternatives.

### On Completion
Queue TASK-201 (Component Library) - it depends directly on these tokens.

---

## Task 201: Component Library - Base Components
**Phase:** 1 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-200

### Context
Reusable components (buttons, cards, inputs, header, footer) are used across every page template. Building these before page templates avoids duplication and ensures visual consistency. Use the `frontend-design` skill for production-grade component generation.

### What Needs Doing
1. Use the `frontend-design` skill to generate polished, distinctive components - avoid generic/flat AI aesthetics.
2. Build each component as a standalone HTML/CSS block that consumes design tokens from TASK-200:
   - **Buttons:** primary, secondary, outline, disabled states. Sizes: small, default, large.
   - **Cards:** product card (image, title, price, CTA), content card (icon/image, title, text).
   - **Form inputs:** text input, textarea, select dropdown, checkbox. Include focus, error, and disabled states.
   - **Header:** logo, nav links (Home, Shop, About, Care Instructions, FAQ, Contact), mobile hamburger menu. Sticky on scroll.
   - **Footer:** logo, nav links, copyright, social links placeholders.
   - **Badge/tag:** for product labels (e.g. "New", "Popular").
   - **Quantity selector:** +/- stepper for cart.
   - **Alert/toast:** success and error messages for cart actions.
3. Write all styles in a `components.css` file, consuming only CSS custom properties.
4. Create a `components.html` reference page showing all components in all states.

### Files
- `src/css/components.css` (create)
- `src/components.html` (create - reference/demo page)

### How to Test
- Open `components.html` - all components render in all states (default, hover, focus, active, disabled, error).
- Components use only design tokens - no hardcoded colours, font sizes, or spacing values.
- Header hamburger menu toggles on mobile viewport (< 768px).
- All interactive elements are keyboard-accessible (tab order, focus indicators).
- Buttons and inputs meet WCAG AA touch target sizes (minimum 44x44px).

### Unexpected Outcomes
- If the design tokens from TASK-200 produce poor contrast in component context, flag for token adjustment rather than overriding locally.
- If the header nav has too many items for mobile, flag for UX discussion.

### On Completion
Queue TASK-202 through TASK-211 (all page templates) - they all depend on this component library.

---

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

---

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

---

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

---

## Task 205: Cart UI (Client-Side State, localStorage, Add/Remove/Update)
**Phase:** 2 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-201

### Context
The cart is entirely client-side (localStorage) until checkout, when the cart contents are sent to the backend to create a Stripe Checkout session. This module powers add-to-cart on product pages, the cart summary display, and feeds into the checkout flow.

### What Needs Doing
1. Build a cart module (`cart.js`) as a vanilla JS module:
   - `addItem(product, variant, quantity)` - add or increment item.
   - `removeItem(itemId)` - remove item entirely.
   - `updateQuantity(itemId, quantity)` - update quantity (min 1, or remove if 0).
   - `getCart()` - return current cart contents.
   - `getCartCount()` - return total item count (for header badge).
   - `getCartTotal()` - return calculated total.
   - `clearCart()` - empty cart (used after successful checkout).
   - All mutations persist to `localStorage` and dispatch a custom event (`cart-updated`) for UI reactivity.
2. Build the cart page/slide-out panel:
   - List all cart items with: product name, variant/size, unit price, quantity stepper, line total, remove button.
   - Cart summary: subtotal, shipping note ("Shipping calculated at checkout" or flat rate if defined), total.
   - "Continue Shopping" link and "Proceed to Checkout" button.
   - Empty cart state with CTA to shop.
3. Add cart count badge to the header component (listens for `cart-updated` event).
4. Show success/error toast on cart actions.

### Files
- `src/js/cart.js` (create - cart state module)
- `src/cart.html` (create - cart page)
- `src/js/cart-ui.js` (create - cart page rendering and interactions)

### How to Test
- Add item from product page - cart count in header updates immediately.
- Open cart page - all items display with correct name, variant, price, quantity.
- Increment/decrement quantity - line total and cart total update.
- Remove item - item disappears, totals update. If last item removed, empty state shows.
- Refresh page - cart persists from localStorage.
- Clear cart - localStorage is empty, cart shows empty state.
- `cart-updated` custom event fires on every mutation (verify in console).

### Unexpected Outcomes
- If localStorage is disabled/full, flag for graceful degradation strategy (sessionStorage fallback or in-memory with warning).
- If product data shape from backend differs from assumptions, flag for sync.

### On Completion
Queue TASK-204 (Product Detail Page) for add-to-cart integration. Queue TASK-206 (Checkout Flow) for checkout integration.

---

## Task 206: Checkout Flow (Cart Summary -> Redirect to Stripe Checkout)
**Phase:** 3 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-205

### Context
The checkout flow is a redirect model - the frontend collects the cart, sends it to the PHP backend API which creates a Stripe Checkout session, then redirects the customer to Stripe's hosted checkout page. The frontend does not handle payment details directly.

### What Needs Doing
1. Build the checkout initiation flow:
   - "Proceed to Checkout" button on cart page calls the backend API endpoint (`POST /api/checkout`).
   - Request body: cart items array (product ID, variant ID, quantity).
   - On success: redirect to the Stripe Checkout URL returned by the API.
   - On error: display error message (toast or inline) - e.g. "Item out of stock", "Server error".
   - Show loading state on button during API call.
2. Handle the Stripe Checkout return URLs:
   - **Success URL** (`/order-confirmation?session_id={CHECKOUT_SESSION_ID}`): redirect target after successful payment. Clears localStorage cart.
   - **Cancel URL** (`/cart`): redirect target if customer cancels on Stripe. Cart preserved.
3. Add a minimal checkout review step if warranted (optional - can be just the cart page with prominent checkout button).

### Files
- `src/js/checkout.js` (create - API call, redirect logic, error handling)
- Modify `src/js/cart-ui.js` (add checkout button handler)

### How to Test
- Click "Proceed to Checkout" - loading state appears on button.
- With mock API (or real backend): successful response redirects to Stripe Checkout URL.
- API error (e.g. 400, 500) shows user-friendly error message, button returns to normal state.
- After successful Stripe payment, landing on success URL clears the cart.
- Cancelling on Stripe returns to cart page with cart intact.

### Unexpected Outcomes
- If backend API contract (`POST /api/checkout` request/response shape) is not yet finalised, flag for backend sync.
- If CORS issues arise between Netlify static site and Railway API, flag for backend to configure CORS headers.

### On Completion
Queue TASK-211 (Order Confirmation Page).

---

## Task 207: Care Instructions Page Template
**Phase:** 3 | **Agent:** frontend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-201

### Context
Care instructions are a key value-add for the brand - helping customers successfully grow their mushrooms drives repeat purchases and reduces support queries. Content is managed via the CMS Bard editor, so this template must render rich HTML content blocks.

### What Needs Doing
1. Build a care instructions page template:
   - **Page header:** title and intro text.
   - **Content area:** rendered from CMS Bard blocks - must support headings, paragraphs, images, lists, blockquotes, and embedded media.
   - **Optional sidebar or ToC:** if content is long, include a sticky table of contents generated from h2/h3 headings via JS.
   - **Related products:** optional section at bottom linking to relevant products.
2. Style the rich content area with sensible typography defaults for all Bard block types.
3. Use placeholder content that mimics real care instructions (e.g. "How to grow your oyster mushroom log").

### Files
- `src/care.html` (create)
- `src/css/content.css` (create - rich text content styling)
- `src/js/toc.js` (create - optional table of contents generator)

### How to Test
- Page renders placeholder care instructions with headings, paragraphs, images, and lists.
- If ToC is included: it generates links from headings and scrolls to sections on click.
- Content area handles all standard HTML elements with consistent styling.
- Page is readable on mobile (single column, no horizontal overflow).

### Unexpected Outcomes
- If CMS content structure differs from expected Bard HTML output, flag for CMS agent sync.

### On Completion
Queue TASK-208 (About Page Template).

---

## Task 208: About Page Template
**Phase:** 3 | **Agent:** frontend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-201

### Context
The About page tells the brand story - important for an artisan/small-business e-commerce site. Content is CMS-managed.

### What Needs Doing
1. Build an About page template:
   - **Hero section:** headline + featured image (founder/farm photo placeholder).
   - **Story content:** rich text content area (same styling as TASK-207 content.css).
   - **Values/mission:** 2-3 column block with icons and short text.
   - **CTA:** link to shop or contact page.
2. Reuse `content.css` from TASK-207 for rich text rendering.
3. Use placeholder content about a fictional mushroom-growing business.

### Files
- `src/about.html` (create)

### How to Test
- Page renders with hero, story content, values section, and CTA.
- Rich text content is styled consistently with care instructions page.
- Layout is responsive across breakpoints.

### Unexpected Outcomes
- None expected - straightforward content template.

### On Completion
Queue TASK-209 (Contact Page).

---

## Task 209: Contact Page (Form UI)
**Phase:** 3 | **Agent:** frontend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-201

### Context
The contact form is one of the features included in Statamic Core free tier (1 form). The frontend builds the form UI; submission goes to the Statamic form handler on the backend.

### What Needs Doing
1. Build a contact page with:
   - **Page header:** title and intro text.
   - **Contact form:** name, email, subject (dropdown: General Enquiry, Order Question, Wholesale, Other), message (textarea).
   - **Client-side validation:** required fields, email format check. Show inline error messages.
   - **Submit button:** loading state during submission. Disable to prevent double-submit.
   - **Success state:** replace form with a thank-you message on successful submission.
   - **Error state:** show error message if submission fails.
   - **Additional info:** business location, email address, social links (alongside or below the form).
2. Form submits via `POST` to the Statamic form endpoint (or a placeholder URL for now).
3. Use form input components from TASK-201.

### Files
- `src/contact.html` (create)
- `src/js/contact.js` (create - validation, submission, state management)

### How to Test
- Form renders with all fields and correct input types.
- Submitting with empty required fields shows inline validation errors.
- Submitting with invalid email format shows email validation error.
- Successful submission (mock or real endpoint) shows thank-you message and hides form.
- Failed submission shows error message and preserves form data.
- Submit button shows loading state and is disabled during submission.

### Unexpected Outcomes
- If Statamic form endpoint URL or CSRF token requirements differ from assumptions, flag for backend/CMS sync.

### On Completion
Queue TASK-210 (FAQ Page).

---

## Task 210: FAQ Page Template
**Phase:** 3 | **Agent:** frontend
**Priority:** Low | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-201

### Context
A FAQ page reduces support queries. Content is CMS-managed. The UI pattern is an accordion/collapsible sections.

### What Needs Doing
1. Build a FAQ page with:
   - **Page header:** title and intro text.
   - **FAQ accordion:** collapsible question/answer sections. Click to expand, click again to collapse. Only one open at a time (or allow multiple - choose the better UX).
   - **Category grouping (optional):** if FAQs span categories (Ordering, Shipping, Growing, Returns), group under headings.
2. Build the accordion as a reusable vanilla JS component.
3. Use semantic HTML (`<details>`/`<summary>` as progressive enhancement base, enhanced with JS for animation and single-open behaviour).
4. Populate with placeholder FAQ content relevant to a mushroom-growing e-commerce business.

### Files
- `src/faq.html` (create)
- `src/js/faq.js` (create - accordion behaviour)

### How to Test
- FAQ items render with questions visible and answers collapsed by default.
- Clicking a question expands its answer with smooth animation.
- Accordion is keyboard-accessible (Enter/Space to toggle, Tab to navigate).
- Works without JS (native `<details>`/`<summary>` fallback).
- Content is readable on mobile.

### Unexpected Outcomes
- None expected - straightforward component.

### On Completion
Queue TASK-211 (Order Confirmation Page) if not already queued.

---

## Task 211: Order Confirmation / Thank You Page
**Phase:** 3 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-206

### Context
After successful Stripe Checkout payment, the customer is redirected to this page. It confirms the order was received and sets expectations for next steps (email confirmation, shipping). The page reads the Stripe session ID from the URL to optionally fetch order details from the backend.

### What Needs Doing
1. Build the order confirmation page:
   - **Success message:** "Thank you for your order!" with a checkmark/success icon.
   - **Order summary (optional):** if backend provides an endpoint to fetch order details by session ID, display order items, total, and shipping address. If not available in v1, show a generic confirmation.
   - **Next steps:** "You will receive an email confirmation shortly. We will notify you when your order ships."
   - **CTA:** "Continue Shopping" button linking to the shop.
2. On page load:
   - Extract `session_id` from URL query parameter.
   - Clear the localStorage cart (call `clearCart()` from TASK-205).
   - Optionally fetch order details from `GET /api/order?session_id={id}`.
3. Handle edge cases: no session_id in URL (show generic thank-you), API error (show generic thank-you with note to check email).

### Files
- `src/order-confirmation.html` (create)
- `src/js/order-confirmation.js` (create - session handling, cart clearing, optional order fetch)

### How to Test
- Navigating to `/order-confirmation?session_id=test123` clears the cart and shows confirmation.
- Cart count in header updates to 0.
- Page displays without errors even if session_id is missing or API call fails.
- "Continue Shopping" button links to shop page.

### Unexpected Outcomes
- If backend order details endpoint is not available, build the generic version and flag for future enhancement.

### On Completion
Notify orchestrator that all page templates are complete. Queue TASK-212 (SEO).

---

## Task 212: SEO - Meta Tags, Open Graph, Structured Data for Products
**Phase:** 4 | **Agent:** frontend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-202, TASK-203, TASK-204

### Context
Good SEO is critical for organic discovery of the shop. Product pages need structured data for rich search results. All pages need proper meta tags and Open Graph data for social sharing.

### What Needs Doing
1. Add to every page:
   - `<title>` tag with page-specific title and brand suffix (e.g. "Oyster Mushroom Grow Log | Centrifungal").
   - `<meta name="description">` with page-specific description.
   - Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`.
   - Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
   - Canonical URL: `<link rel="canonical">`.
   - Favicon and Apple touch icon links.
2. Add JSON-LD structured data to product pages:
   - `Product` schema with `name`, `description`, `image`, `offers` (price, currency, availability).
   - `BreadcrumbList` schema on product and category pages.
3. Add JSON-LD `Organization` schema to homepage.
4. Add `robots.txt` and `sitemap.xml` (static or generated).
5. Ensure all images have descriptive `alt` attributes.

### Files
- Modify all `src/*.html` files (add meta tags, OG tags)
- `src/js/seo.js` (create - dynamic structured data injection for product pages)
- `public/robots.txt` (create)
- `public/sitemap.xml` (create - static version; can be generated later)

### How to Test
- Validate structured data using Google Rich Results Test (or Schema.org validator) - no errors.
- Validate Open Graph tags using Facebook Sharing Debugger (or opengraph.xyz).
- Every page has a unique `<title>` and `<meta description>`.
- `robots.txt` is accessible and allows crawling.
- `sitemap.xml` lists all public pages.
- Run Lighthouse SEO audit - score 90+.

### Unexpected Outcomes
- If product data is not available at build time (SSG vs client-rendered), structured data may need to be injected via JS. Flag if this impacts SEO crawlability.

### On Completion
Queue TASK-213 (Performance Pass).

---

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

---

## Task 214: Responsive Design - Mobile-First, Tested Across Breakpoints
**Phase:** 5 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-202, TASK-203, TASK-204, TASK-205, TASK-207, TASK-208, TASK-209, TASK-210, TASK-211

### Context
The site must work flawlessly on mobile, tablet, and desktop. While each page template task includes basic responsiveness, this is a dedicated pass to catch edge cases, test across real breakpoints, and ensure a consistent mobile-first experience.

### What Needs Doing
1. Define and document breakpoints in design tokens:
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px
   - Large desktop: > 1440px
2. Audit every page at each breakpoint:
   - Verify no horizontal overflow or content clipping.
   - Verify touch targets meet 44x44px minimum.
   - Verify text is readable without zooming (minimum 16px body text on mobile).
   - Verify images scale correctly and do not stretch.
   - Verify navigation is usable (hamburger menu on mobile, full nav on desktop).
3. Test specific interactions on mobile:
   - Cart add/remove/update works via touch.
   - Product variant selector is easy to tap.
   - Form inputs are properly sized and do not trigger unwanted zoom on iOS (min 16px font-size on inputs).
   - Checkout button is prominent and easy to reach.
4. Fix all issues found during audit.
5. Test on real devices or accurate emulators: iPhone SE (375px), iPhone 14 (390px), iPad (768px), standard laptop (1366px), desktop (1920px).

### Files
- Modify `src/css/design-tokens.css` (add breakpoint tokens)
- Modify `src/css/components.css` (responsive fixes)
- Modify all `src/*.html` and `src/css/*.css` files as needed

### How to Test
- Every page passes visual inspection at 375px, 640px, 768px, 1024px, 1440px, and 1920px widths.
- No horizontal scrollbar appears on any page at any width.
- All interactive elements are usable via touch on mobile.
- iOS Safari: no input zoom bug (inputs have >= 16px font-size).
- Chrome DevTools device emulation shows no layout issues across standard device presets.
- Lighthouse Accessibility score 90+ on mobile.

### Unexpected Outcomes
- If a component from TASK-201 fundamentally breaks at a certain breakpoint and needs a structural redesign, flag for component revision rather than patching with overrides.
- If mobile performance degrades significantly (e.g. product grid with many images), flag for discussion on pagination or "load more" pattern.

### On Completion
Notify orchestrator that all frontend tasks are complete. Frontend is ready for integration testing with backend API.

---

# Summary

| Task | Title | Phase | Priority | Effort | Dependencies |
|---|---|---|---|---|---|
| 200 | Design System | 1 | High | M | none |
| 201 | Component Library | 1 | High | L | TASK-200 |
| 202 | Homepage Template | 2 | High | M | TASK-201 |
| 203 | Product Listing Page | 2 | High | M | TASK-201 |
| 204 | Product Detail Page | 2 | High | L | TASK-201, TASK-205 |
| 205 | Cart UI | 2 | High | L | TASK-201 |
| 206 | Checkout Flow | 3 | High | M | TASK-205 |
| 207 | Care Instructions Page | 3 | Medium | S | TASK-201 |
| 208 | About Page | 3 | Medium | S | TASK-201 |
| 209 | Contact Page | 3 | Medium | M | TASK-201 |
| 210 | FAQ Page | 3 | Low | S | TASK-201 |
| 211 | Order Confirmation Page | 3 | High | S | TASK-206 |
| 212 | SEO | 4 | Medium | M | TASK-202, TASK-203, TASK-204 |
| 213 | Performance Pass | 5 | Medium | M | TASK-202, TASK-203, TASK-204, TASK-212 |
| 214 | Responsive Design | 5 | High | M | TASK-202 through TASK-211 |
