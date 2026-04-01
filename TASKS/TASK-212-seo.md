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
