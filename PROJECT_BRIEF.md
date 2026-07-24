# Project Brief - Centrifungal Migration to Skeleton Crew Ecosystem

## What this is

Centrifungal is a mushroom grow log e-commerce site, currently running on Railway (Laravel 13 + Statamic 6 backend) and Netlify (static HTML/CSS/JS frontend). It needs to be migrated into the Skeleton Crew ecosystem - Payload CMS replaces Statamic, the frontend moves from Netlify to the VPS, and the Laravel backend moves from Railway to the VPS.

## Current architecture

| Layer | Current | Target |
|---|---|---|
| CMS | Statamic 6 (Bard block editor, flat-file content) | Payload CMS 3 (shared instance with other clients) |
| Backend API | Laravel 13 on Railway (~$5/mo) | Laravel 13 in Docker on VPS |
| Frontend | Static HTML/CSS/JS on Netlify (free) | Static HTML/CSS/JS on VPS (Nginx) |
| Database | SQLite on Railway persistent volume | PostgreSQL on VPS (shared with Payload) or SQLite in a persistent volume |
| Payments | Stripe Checkout (redirect flow) | Stripe Checkout (unchanged) |
| Shipping | Royal Mail Click & Drop API | Royal Mail Click & Drop (unchanged) |
| Email | Resend | Resend (unchanged) |
| Backups | Litestream to Cloudflare R2 | TBD based on database choice |

## What needs to happen

### 1. Payload CMS - Replace Statamic content management

Statamic currently manages:
- **Page content** via Bard block editor (about, care-instructions, contact, FAQ pages) with these block types: text_block, hero, image, image_text, cta_banner, product_highlight, faq_group, gallery
- **Products** as a Statamic collection (name, description, price, sizes/variants, images, categories)
- **Navigation** via Statamic Nav (`main_nav`)
- **Site settings** via Statamic Global Set (site_name, site_logo)
- **Homepage content** via Statamic page (hero, featured products, brand story, USPs, newsletter CTA)
- **Footer** content

All of this moves to Payload CMS. The Payload instance is shared across all Skeleton Crew clients. Block types defined in `payload/src/blocks/` are available to all clients.

**Existing Payload block types** (from skeleton-crew site): HeroBlock, ServiceCardsBlock, PortfolioTeaserBlock, PortfolioGridBlock, PricingSectionBlock, CtaStripBlock, ContactSectionBlock.

**New block types needed for centrifungal** (these get added to the shared block library):
- TextBlock - rich text content (paragraphs, headings, lists, links)
- ImageBlock - single image with alt text and optional caption
- ImageTextBlock - image + text side by side (reversible layout)
- CtaBannerBlock - heading, text, button (similar to CtaStripBlock but may need different styling hooks)
- ProductHighlightBlock - title, description, button linking to a product
- FaqGroupBlock - title + array of question/answer pairs
- GalleryBlock - array of images
- FeaturedProductsBlock - heading, subtitle, references to specific products or shows N most recent
- UspCardsBlock - heading, subtitle, array of USP cards (icon/title/text)

**New Payload collections needed:**
- Products - name, slug, description (rich text), price, variants (array of size/price), images (array of media uploads), category (relationship or select), inStock (boolean)
- Product Categories - name, slug, sortOrder

**Payload globals to update:**
- SiteSettings - already has navLinks, footerTagline, footerLinks, copyrightText. May need: siteName, siteLogo (upload).

### 2. Laravel backend - Move from Railway to VPS

The Laravel backend handles transactional/commerce logic that Payload cannot:
- Product API endpoints (GET /api/products, /api/products/categories, /api/products/{slug})
- Cart session management (GET/POST/PATCH/DELETE /api/cart/*)
- Stripe Checkout session creation (POST /api/checkout)
- Stripe webhook handler (POST /webhook/stripe)
- Royal Mail Click & Drop order fulfilment
- Royal Mail tracking poller (15-min cron)
- Contact form submission (POST /api/contact)
- Order confirmation and shipping notification emails via Resend
- Nightly Stripe reconciliation cron

**Key decision for the Architect:** With products now managed in Payload CMS, the Laravel backend needs to read product data from Payload's REST API (or from a shared PostgreSQL database) when processing cart/checkout/order operations. The current setup has products in Statamic flat files read directly by Laravel. This coupling changes.

**Options:**
1. Laravel reads products from Payload REST API at checkout time
2. Laravel reads products from the shared PostgreSQL database directly (Payload's tables)
3. Products are synced from Payload to a Laravel-owned products table (like the current Statamic sync)

The Architect should evaluate which approach is simplest and most reliable.

**Infrastructure on VPS:**
- Laravel container (PHP 8.5, Nginx, Supervisor) - similar to current Railway Dockerfile at `infrastructure/Dockerfile`
- Needs a persistent volume or directory for SQLite (if keeping SQLite) or PostgreSQL access (if migrating to shared DB)
- Cron jobs: Royal Mail tracking poller (every 15 min), Stripe reconciliation (nightly)
- Traefik routing: e.g. `api.centrifungal.co.uk` -> Laravel container, `cms.centrifungal.co.uk` -> shared Payload container

### 3. Frontend - Move from Netlify to VPS

The static frontend currently lives at `frontend/src/` and is served by Netlify. It uses a Netlify `_redirects` file to proxy `/api/*` requests to the Railway backend.

**What changes:**
- Served by Nginx on the VPS (same pattern as skeleton-crew's `public/` directory)
- API proxy moves from Netlify _redirects to Nginx/Traefik reverse proxy config
- `js/config.js` needs updating - currently uses relative URLs for the Netlify proxy. On VPS, either keep relative URLs with Nginx proxy, or point at the Laravel backend URL directly.
- `js/cms-content.js` needs rewriting - currently fetches from Statamic's `/api/pages/{slug}` and renders ProseMirror JSON (Bard blocks). Needs to fetch from Payload's `/api/pages?where[slug][equals]={slug}` and render Payload blocks instead.
- `js/nav.js` needs rewriting - currently fetches from Statamic's `/api/navigation` and `/api/site-settings`. Needs to fetch from Payload's `/api/globals/site-settings`.
- `js/homepage.js` needs rewriting - currently fetches from Statamic's `/api/homepage`. Needs to fetch from Payload's page blocks for the homepage.
- `js/footer.js` needs rewriting - currently fetches footer from a separate endpoint. Needs to use Payload's SiteSettings global.
- Product/cart/checkout JS files (`shop.js`, `product.js`, `cart-ui.js`, `checkout.js`) should need minimal changes - they talk to the Laravel API which stays the same shape.

### 4. DNS and routing

| Subdomain | Points to |
|---|---|
| `centrifungal.co.uk` | VPS - Nginx serving static frontend |
| `api.centrifungal.co.uk` | VPS - Laravel container |
| `cms.centrifungal.co.uk` | VPS - shared Payload CMS container (already running) |

Or the frontend could be at `centrifungal.co.uk` with `/api/*` proxied to the Laravel container (same pattern as the Netlify proxy, just on Nginx).

### 5. Stripe webhook URL update

Stripe webhooks currently point at Railway. After migration, update the webhook endpoint in the Stripe dashboard to point at the new VPS URL.

### 6. Content migration

All Statamic content (pages, products, navigation) needs to be migrated to Payload:
- Page content (about, care, FAQ, contact, homepage) -> Payload Pages collection with blocks
- Products -> Payload Products collection
- Navigation -> Payload SiteSettings global navLinks
- Site settings (name, logo) -> Payload SiteSettings global

This can be done via a seed script (like skeleton-crew's `seed.ts`) or by manually entering content in the Payload admin. A seed script is preferred for reproducibility.

## Operator profile

- Flynn Davies - developer, runs Skeleton Crew web design business
- Familiar with the codebase, built it with AI assistance
- Clients (like Tom, the centrifungal owner) are non-technical - CMS must be self-service
- Tom currently manages products and page content through Statamic's control panel

## Constraints

- VPS has ~2.6 GB RAM available (3.7 GB total, ~1.1 GB used by existing services)
- Payload CMS container is already running on the VPS (shared across clients)
- PostgreSQL container is already running on the VPS
- The Laravel backend has real Stripe integration, real Royal Mail integration, real Resend integration - these must not break during migration
- Products must remain purchasable during the transition (zero downtime for the shop)
- The owner (Tom) should notice minimal disruption - ideally the Payload admin panel is as good as or better than Statamic's for his workflow
- Railway can be decommissioned after migration is verified (saves ~$5/mo)
- Netlify can be decommissioned after migration is verified

## Success criteria

- All page content editable in Payload CMS admin (blocks, not blog posts)
- All products editable in Payload CMS admin (name, price, variants, images, categories, stock status)
- Navigation editable in Payload SiteSettings
- Full purchase flow works: browse -> add to cart -> Stripe checkout -> order confirmation email -> Royal Mail label -> shipping notification
- Frontend served from VPS, not Netlify
- Laravel backend running on VPS, not Railway
- New block types (text, image, FAQ, gallery, etc.) available in the shared Payload block library for all clients
- Tom can manage his site without developer help

## Specialists needed

| Agent | Responsibility |
|---|---|
| Architect | Database strategy (SQLite vs PostgreSQL migration), API coupling between Payload and Laravel, infrastructure plan, DNS/routing, risk assessment |
| Backend | Laravel containerisation for VPS, Statamic removal, Payload API integration for product reads, cron migration |
| Frontend | CMS JS rewrite (Statamic -> Payload), config updates, Netlify -> VPS hosting |
| CMS | New Payload block types, Products collection, content migration seed script |
| DevOps | Docker compose, Traefik routing, Nginx config, Stripe webhook update |

## Existing documentation

- `REQUIREMENTS.md` - original project scope
- `BUILD_LOG.md` - full build history
- `HUMAN-TASKS.md` - deployment setup guide (Railway + Netlify)
- `DESIGN_BRIEF.md` - frontend design direction and component system
- `backend/OWNER_RUNBOOK.md` - Tom's guide for managing the site
- `backend/README.md` - backend setup and API docs
- `frontend/README.md` - frontend development guide
- `infrastructure/` - Dockerfile, Nginx, Supervisor, docker-compose configs

## Reference: Skeleton Crew Payload config

The shared Payload CMS config lives in the skeleton-crew repo at `payload/src/`. Key files:
- `payload.config.ts` - main config with collections, globals, and editor setup
- `blocks/` - 7 block type definitions (shared across all clients)
- `collections/Pages.ts` - Pages collection with layout blocks field
- `collections/PricingTiers.ts` - example of a data collection used across pages
- `globals/SiteSettings.ts` - nav links, footer content
- `seed.ts` - seeds initial content for a client site

New block types and collections added for centrifungal will be committed to this shared config so all clients benefit.
