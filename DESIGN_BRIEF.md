# Centrifungal Frontend Design Brief

You are redesigning the frontend for Centrifungal - a small British e-commerce
business selling artisan mushroom grow logs.

## Your tools

You MUST use these tools and skills throughout this task:

1. **`/ui-ux-pro-max` skill** - Invoke this skill FIRST to establish the
   design system: color palette, typography scale, spacing tokens, and
   component styles. Use it for every design decision - color choices, font
   pairings, layout patterns, accessibility checks, and UX quality control.

2. **`/frontend-design` skill** - Invoke this skill when building each page
   and component. It will guide you toward distinctive, non-generic aesthetics.
   Use it for every page build to avoid cookie-cutter AI output.

3. **Magic MCP Server** (`@21st-dev/magic`) - You have access to this MCP's
   tools. Use them to search for and generate high-quality UI component
   inspiration. Query it for each component type you build (hero sections,
   product cards, navigation, accordions, CTAs, footers, etc.) to find
   premium component patterns. Call the MCP tools directly - they are
   available in your tool list.

## Workflow

For each page/component:
1. Run `/ui-ux-pro-max` to get design system guidance
2. Query the Magic MCP tools for component inspiration and patterns
3. Run `/frontend-design` to build the actual implementation
4. Review output against the brief below and iterate

## The brief

Design a bold, playful e-commerce frontend that feels like nothing else in the
space. Think Oatly meets a woodland forager's zine - quirky, confident, a bit
irreverent, but still trustworthy enough to buy from.

### Brand personality
- Playful, witty, slightly weird (mushrooms ARE weird - lean into it)
- Handmade craft meets modern design confidence
- Not precious or pretentious - approachable, warm, fun
- British woodland energy - damp earth, mycelium networks, spore prints

### Design direction
- Break the hero > grid > CTA template pattern. Use unexpected layouts -
  asymmetric grids, overlapping elements, sections that flow into each other
- Typography should have real character. Mix a bold display face with
  something unexpected. Size contrast matters - go big where it counts
- Texture and illustration over stock photography. Think hand-drawn mushroom
  spots, spore print patterns, paper/kraft textures, organic blob shapes.
  The site needs to work beautifully WITHOUT product photos (none exist yet) -
  use illustration, pattern, and typography to carry the visual weight
- Color palette: move beyond safe greens. Think forest floor - rich darks,
  unexpected accent colors (spore pink? chanterelle orange? bioluminescent
  blue-green?), earthy neutrals with personality
- Micro-interactions and hover states that delight - mushrooms growing,
  spores floating, mycelium spreading

### Pages needed (all must use reusable components for a CMS-driven site)
1. **Homepage** - hero, featured products, brand story, USPs, newsletter CTA
2. **Shop** - filterable product grid with category tabs
3. **Product detail** - image gallery, variants/sizes, add to cart,
   description, related products
4. **Content pages** - About, FAQ (accordion), Care Instructions, Contact
5. **Cart** - line items, quantity controls, order summary, checkout CTA
6. **404 page** - make this one fun

### Component system (critical - this is CMS-driven)
The frontend is static HTML/CSS/JS that loads content from a headless CMS API.
Design these as reusable blocks that can be mixed and matched on any page:
- Hero banner (multiple variants: full-bleed, split, minimal)
- Text block (rich text with headings, lists, links)
- Image + text (side by side, reversible)
- Product card (used in grids and carousels)
- FAQ accordion
- CTA banner (multiple styles)
- Image gallery / grid
- Testimonial / quote block
- USP / feature cards
- Site header with CMS-driven navigation
- Site footer

Use the Magic MCP tools to search for inspiration for EACH of these component
types before building them.

### Technical constraints
- Static HTML, CSS, vanilla JS only (no React/Vue/frameworks)
- Must be responsive (mobile-first)
- CSS custom properties for theming (design tokens)
- Accessible (semantic HTML, ARIA where needed, keyboard nav)
- Components should work as standalone HTML snippets that JS can inject
  into the page from CMS API responses
- Google Fonts only (no self-hosted fonts)

### What to deliver
Write all files into `frontend/src/`:
- HTML pages for each page listed above
- `css/design-tokens.css` - all CSS custom properties
- `css/reset.css` - CSS reset
- `css/components.css` - all component styles
- `css/pages.css` - page-specific styles (if needed)
- Per-page CSS files only if truly needed
- Keep the existing JS files and their API integration intact - only restyle,
  don't rewrite the JS logic

### Existing JS integration (DO NOT MODIFY these files' logic)
The following JS files fetch from a backend API and render content. Your HTML
must include the correct element IDs and data attributes they expect:
- `js/config.js` - loads API base URL
- `js/nav.js` - populates `#main-nav` with CMS navigation
- `js/cms-content.js` - populates `#cms-page-content` with CMS blocks
- `js/homepage.js` - populates homepage sections by element IDs
- `js/shop.js` - renders product grid
- `js/product.js` - renders product detail page
- `js/checkout.js` - handles Stripe checkout
- `js/cart-ui.js` - renders cart page

Read these JS files to understand what element IDs and structure they expect
before designing the HTML.

### Reference mood
Oatly packaging, Fly By Jing website, Graza olive oil branding, indie zine
aesthetics, botanical illustration field guides, vintage mushroom
encyclopedias, Japanese food packaging design.

Make it the kind of site where people screenshot it and share it in design
Slack channels. Make it weird in the right way.

---

## Appendix: Required element IDs and selectors

The JS files inject content into these elements. Your HTML MUST include them
with these exact IDs/classes/attributes. Read the JS files for full context.

### All pages (header/nav)
- `#main-nav` - nav element, populated by `nav.js` with CMS links
- `.site-header` - header element, JS adds `.site-header--scrolled` on scroll
- `.site-header__hamburger` - mobile menu toggle
- `.site-header__nav` - JS toggles `.site-header__nav--open`
- `#header-cart-count` - cart badge count span

### Homepage (`index.html`) - populated by `homepage.js`
- `#hero-eyebrow`
- `#hero-title`
- `#hero-text`
- `#featured-heading`
- `#featured-subtitle`
- `#featured-products-grid` - product cards injected here
- `#story-heading`
- `#story-text`
- `#story-image`
- `#usp-heading`
- `#usp-subtitle`
- `#usp-cards` - USP card HTML injected here
- `#cta-heading`
- `#cta-text`

### CMS content pages (about, FAQ, care, contact, generic) - `cms-content.js`
- `#cms-page-content` - all CMS blocks rendered here
- Optional `data-slug="about"` attribute to specify which page to load
- `.page-hero__title` - updated with page title from CMS
- `.page-hero__subtitle` - updated with subtitle from CMS

### 404 page - `cms-content.js`
- `#page-title` - set to "404"
- `#page-subtitle` - set to "Page not found"
- `#cms-page-content` - quote and Go Home button rendered here

### Shop page (`shop.html`) - `shop.js`
- `#shop-content` - product grid and filters rendered here

### Product detail page (`product.html`) - `product.js`
- `#product-main` - entire product detail rendered here
- `#product-breadcrumb` - breadcrumb nav rendered here
- `#product-long-description` - description HTML injected
- `#product-price` - price display
- `#add-to-cart-btn` - add to cart button
- `#toast-container` - toast notifications (auto-created if missing)
- `[data-qty-input]`, `[data-qty-dec]`, `[data-qty-inc]` - quantity controls
- `[data-gallery-index]` - thumbnail gallery items
- `.product-gallery__main` - main gallery image container
- `.product-gallery__thumb` - thumbnail elements
- `input[name="variant"]` - variant radio buttons

### Cart page (`cart.html`) - `cart-ui.js`
- `#cart-content` - cart UI rendered here

### Order confirmation (`order-confirmation.html`)
- `#session-id-display` - Stripe session ID shown here
