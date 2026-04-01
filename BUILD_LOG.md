# Build Log - Centrifungal

## [2026-03-31 14:30] Phase 0 - Project Research
**Status:** Complete
**Summary:** The Architect researched three key questions: which CMS to use, where to host the PHP backend, and whether SQLite is suitable for this scale. The findings show the project can run for roughly GBP 5/month - well under budget.
**Key Decisions:**
- CMS: Statamic Core (free) recommended - provides a polished block editor (Bard) that the owner can use without touching code
- Hosting: Railway Hobby plan (~GBP 4/month) - supports git-push deploy and persistent volumes for SQLite
- Database: SQLite with WAL mode is more than sufficient for expected order volumes (1-20/day); Litestream for continuous backups to Cloudflare R2
- TinaCMS eliminated (requires Node.js, not PHP-compatible)
**Delegated To:** Architect - ran RPI research across CMS, hosting, and database options
**Next:** Phase 1 Discovery - confirm scope, product count, brand assets, and page requirements with the owner

## [2026-03-31 15:00] Phase 1 - Discovery
**Status:** Complete
**Summary:** Confirmed all project scope with the owner. The site needs ~10-20 products (grow logs in multiple sizes, dowels, DIY kits, tinctures) across 7 pages. A key v1 requirement is Royal Mail Click & Drop integration so orders automatically flow to label printing and tracking feeds back to customers.
**Key Decisions:**
- Royal Mail Click & Drop integration confirmed as v1 requirement (not a nice-to-have)
- ~10-20 SKUs at launch - well within SQLite comfort zone
- Brand palette: greens and warm golds/yellows drawn from existing logo
- Customer accounts, reviews, blog, and discount codes all deferred to post-v1
- Stripe dashboard alone is not sufficient - orders need to flow to Click & Drop
**Delegated To:** Direct discovery with owner (no specialist needed)
**Next:** Phase 2 Architecture - delegate to Architect with research findings and requirements summary

## [2026-03-31 15:30] Phase 2 - Architecture
**Status:** Complete
**Summary:** The Architect produced a full architecture plan covering CMS, hosting, database, payments, email, and shipping. The stack runs for ~GBP 5/month. Statamic Core provides the block-based CMS, Railway hosts the PHP backend with persistent SQLite storage, and Royal Mail Click & Drop integration handles shipping with tracking fed back to customers automatically.
**Key Decisions:**
- Statamic Core (free) confirmed as CMS - Bard block editor, Blade templates (not Antlers) to reduce lock-in
- Railway Hobby plan confirmed - persistent volumes verified for SQLite survival across redeploys
- SQLite with WAL mode confirmed - Litestream to Cloudflare R2 for continuous backup
- CMS content stored as flat files in git; only transactional data (orders, customers) in SQLite
- Royal Mail tracking via 15-minute polling cron (Click & Drop has no webhooks)
- Stripe Checkout redirect flow (not embedded) to simplify PCI scope
- 11 risks identified and mitigated including SQLite persistence, webhook reliability, and owner self-sufficiency
**Delegated To:** Architect - produced architecture document, Mermaid diagram, decision log, and risk register
**Next:** Phase 3 Build Plan - delegate to all four specialists to produce consolidated task index

## [2026-03-31 16:30] Phase 3 - Build Plan
**Status:** Complete
**Summary:** All four specialists (Architect, Backend, Frontend, CMS) produced detailed task breakdowns for their domains. The consolidated plan contains 50 tasks across 5 build phases, covering everything from repository setup through to launch smoke tests. Each task has clear acceptance criteria, dependencies, and flagging instructions for unexpected outcomes. Task files have been written to the TASKS/ directory.
**Key Decisions:**
- 50 tasks total: 9 infrastructure (architect), 16 backend, 15 frontend, 10 CMS
- 5 build phases: Foundation, CMS & Core API, Storefront & Checkout, Polish, Launch
- Royal Mail integration split into 3 tasks: API service, fulfilment flow, and tracking poller
- Persistent volume confirmation is a hard gate before any database work proceeds
- Owner runbook identified as a high-priority launch deliverable
- Contact form uses Statamic's built-in form feature (1 form included in free tier)
**Delegated To:** All four specialists in parallel - Architect (infra), Backend (API/payments/shipping), Frontend (UI/design), CMS (Statamic/content management)
**Next:** Begin Phase 1 Foundation build - starting with TASK-001 (repo setup), TASK-100 (Laravel scaffold), and TASK-200 (design system) in parallel

## [2026-04-01 09:00] Phase 4 - Foundation
**Status:** Complete
**Summary:** The core scaffolding for the entire site was put in place. This included setting up the Laravel and Statamic framework, creating the database with backup mode enabled, building the design system (colours, fonts, spacing), and establishing the component library that every page is built from. Admin login and API rate limiting were also set up so the site is secure from day one.
**Key Decisions:**
- Laravel 13 and Statamic 6 used as the base - latest stable versions for long-term support
- SQLite with WAL mode chosen so the database can handle reads and writes simultaneously without locking
- Design tokens (colours, typography, spacing) defined upfront so all pages share a consistent look without extra effort
- Admin authentication handled through Statamic's built-in system, keeping the dependency count low
**Delegated To:** backend agent (scaffold, database, auth, rate limiting), frontend agent (design system, component library)
**Next:** Phase 5 - CMS & Core API - wire up product and cart APIs, configure the CMS, and build the main pages

## [2026-04-01 10:30] Phase 5 - CMS & Core API
**Status:** Complete
**Summary:** The shop's core plumbing was built and the owner can now manage products through the CMS without touching code. The product and cart APIs are live, Royal Mail Click & Drop is integrated so orders flow straight to label printing, and the main storefront pages (homepage, product listing, cart) are built and working. A test-first workflow was established - the QA agent writes tests before any feature is implemented.
**Key Decisions:**
- TDD workflow adopted: QA agent writes tests first, implementation follows - this catches regressions early and keeps quality high
- Statamic Bard block editor configured with content blocks tailored to mushroom product pages (grow logs, care guides, etc.)
- Product collection blueprint designed to match the owner's product range, with variant support for sizes
- Royal Mail Click & Drop integrated as a v1 requirement - orders must flow to label printing automatically
**Delegated To:** backend agent (Product API, Cart API, Royal Mail integration, rate limiting), frontend agent (homepage, product listing, cart UI), cms agent (Statamic config, Bard blocks, product blueprint)
**Next:** Phase 6 - Storefront & Checkout - add Stripe payments, order emails, and the remaining customer-facing pages

## [2026-04-01 12:00] Phase 6 - Storefront & Checkout
**Status:** Complete
**Summary:** Customers can now browse, add to cart, and pay. Stripe handles the payment and redirects back to a confirmation page. Once payment is confirmed, an order confirmation email goes out automatically, Royal Mail receives the order for label printing, and a shipping notification with tracking is sent when the parcel is dispatched. Content pages (care instructions, about, contact, FAQ) are also live.
**Key Decisions:**
- Stripe Checkout redirect flow used (not embedded) - keeps the site out of PCI scope and reduces compliance burden
- Royal Mail tracking polled every 15 minutes via a cron job - Click & Drop has no webhooks so polling is the only option
- Order confirmation and shipping notification emails sent via Resend for reliable delivery
- Contact form built as a simple page with backend storage - no third-party form service needed
**Delegated To:** backend agent (Stripe checkout, webhook handler, order fulfilment, Royal Mail tracking poller, order and shipping emails, contact form endpoint), frontend agent (checkout flow, product detail page with variant selector, order confirmation page, care instructions, about, contact, FAQ pages)
**Next:** Phase 7 - Polish - SEO, performance, responsive design audit, and Stripe reconciliation

## [2026-04-01 14:00] Phase 7 - Polish
**Status:** Complete
**Summary:** The site was polished for search visibility and speed. Every page now has proper meta tags and Open Graph data so links shared on social media show a preview image and description. A Lighthouse audit was run and performance tuned to score above 90. All pages were checked and fixed on mobile screens. A Stripe reconciliation job runs nightly to flag any payments that didn't result in an order.
**Key Decisions:**
- SEO handled in Statamic blueprints so the owner can update meta descriptions through the CMS without developer help
- Stripe reconciliation cron runs nightly and flags mismatches - protects against lost orders from webhook failures
- Performance optimisations focused on image sizing and asset caching, not complex build pipelines
- Responsive audit done against real device sizes, not just browser resizing
**Delegated To:** frontend agent (SEO meta tags, Open Graph, structured data, Lighthouse performance pass, responsive design audit), backend agent (Stripe reconciliation cron)
**Next:** Phase 8 - Launch Prep - infrastructure configs, smoke tests, and owner handover

## [2026-04-01 15:30] Phase 8 - Launch Prep
**Status:** Complete
**Summary:** Everything needed for the owner to run the site independently is now in place. The CMS has navigation management, a contact submissions inbox, and order visibility so day-to-day operations don't require a developer. Full infrastructure configuration files have been written for Netlify, Railway, Litestream, backup cron, DNS, and security headers. A smoke test suite validates the entire purchase journey before go-live. A critical bug was also found and fixed: products added in the CMS weren't appearing in the shop until a sync job was wired up.
**Key Decisions:**
- Owner runbook written in plain English - covers adding products, processing orders, and handling common problems without technical knowledge
- Statamic-to-database sync added as a critical fix: CMS products now automatically propagate to the SQLite orders database so the shop reflects what the owner publishes
- Smoke test suite covers the full purchase journey end to end - this runs before every deployment
- All infrastructure config files committed to the repo so there is no undocumented manual setup
**Delegated To:** cms agent (navigation management, contact submissions admin, order visibility in CP, owner runbook), architect agent (Netlify config, Railway config, Litestream config, backup cron, DNS docs, security headers, smoke test suite, Statamic-to-database sync fix)
