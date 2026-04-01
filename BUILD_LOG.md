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
