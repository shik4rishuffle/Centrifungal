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

## [2026-08-01 11:00] Amendment 001 - Re-platform to Payload CMS + Skeleton Crew
**Status:** In Progress
**Summary:** After the original Statamic/Laravel build completed (Phase 8), the owner asked to re-platform Centrifungal onto the Skeleton Crew stack - Payload CMS instead of Statamic, a small Node backend instead of Laravel, the shared PostgreSQL instead of SQLite, and VPS hosting instead of Railway + Netlify. The full re-platform has already been built and verified locally on a safe branch (`payload-migration`) - the CMS schema, the Node backend, the rewired frontend, the content seeder, the platform config, and a 16-agent cross-layer review that caught and fixed 12 real bugs. Nothing is committed or merged; the live site is untouched. What remains is deploying to the dev VPS and verifying the whole thing end to end, plus the accessibility audit - all of which need the owner's VPS access and test keys.
**Key Decisions:**
- Framed the re-platform as a formal amendment (AMENDMENT-001) rather than informal follow-up, so the remaining deploy + verification work is tracked and gated like any other build.
- Full re-platform, not a lift-and-shift: Laravel -> Node/Express, SQLite -> shared PostgreSQL. This supersedes two rows of the original brief's target architecture.
- Clean-slate products (old catalogues were test/legacy); everything previously hardcoded is now editable in the CMS.
- Dev/staging proceeds without the backups + revenue gate because there is no live data yet.
**Tasks Added:** TASK-310..315 (build - already DONE), TASK-316..321 (deploy + verify - Pending, need Flynn).
**Delegated To:** cms, backend, frontend, devops, qa agents (build already executed autonomously last session; remaining tasks not yet delegated - awaiting VPS access).
**Next:** Gate on the amendment scope. On approval + VPS access, execute TASK-316 (DevOps: provision on the dev VPS) first.

## [2026-08-01 11:40] Amendment 001 - VPS access confirmed, deploy staged (paused)
**Status:** In Progress
**Summary:** Reconnected to the Skeleton Crew VPS and confirmed everything needed to deploy Centrifungal, without touching anything (read-only recon only). The SSH shortcut wasn't set up on this machine, so the connection was rebuilt from scratch: it turned out the box uses a non-standard SSH port (2222, not 22) and the login user is `deploy`, not root. Centrifungal isn't on the box yet. Because the migration code is still uncommitted, the plan is to copy the working tree up with rsync and provision from that local path using the CLI's `--subpath` flag (which, contrary to an old note, is present on the live server). All of these VPS learnings were written into the Obsidian vault as a single source of truth. Stopped deliberately before running the deploy, at Flynn's request (end of day).
**Key Decisions:**
- Deploy from an rsync'd copy of the uncommitted working tree rather than a git clone, so the "don't merge yet" gate stays clean and the whole thing is reversible.
- Documented the VPS access + provisioning route in the vault (new note `skeleton-crew-vps-access`, corrected the `--subpath` doc-drift) so the next run doesn't rediscover it.
**Delegated To:** none (orchestrator-driven recon + documentation).
**Next:** Resume TASK-316 - rsync the tree up, run `skeleton new --subpath payload`, verify the CMS boots. Then seed, E2E, a11y, merge. Full steps in AGENTS/handover.md.

## [2026-08-02 08:05] Amendment 001 - Provisioned on VPS; blocked on empty CMS schema
**Status:** Blocked
**Summary:** Deployment began. Flynn provisioned the Centrifungal Payload CMS on the dev VPS via the hybrid split (DevOps agent staged the code and ran read-only pre-flight checks; Flynn ran the interactive `skeleton new` wizard). The CMS container is up and reachable, but the admin panel is down - it throws a server-side exception because the database has no tables. Root cause traced from the container logs: the Payload app ships no committed migrations and the Postgres adapter ignores dev "push" mode in production, so the schema was never created. Also set up the `ssh skeleton` shortcut on Flynn's Mac and updated four vault notes documenting today's platform findings. Paused for the day with the fix understood.
**Key Decisions:**
- Provisioned from an rsync'd copy of the uncommitted working tree (keeps the merge gate clean); the build context is permanent at `/srv/skeleton/build/centrifungal`.
- The storefront will NOT use `skeleton deploy` (the generic template has no backend and no custom nginx/CSP) - it will come up via the repo's own `docker-compose.yml`.
**Delegated To:** DevOps agent (rsync + pre-flight + wizard answer sheet -> AGENTS/devops-output.md); orchestrator drove the recon, the ssh-config fix, and the /scribe documentation run.
**Next:** Fix the CMS schema (generate + commit Payload migrations, rebuild), then create the first admin + API key, then TASK-317 seed. Full resume steps in AGENTS/handover.md and PROJECT_BRIEF.md (2026-08-02 status).

## [2026-08-02 14:00] Amendment 001 - CMS schema fixed; TASK-316 complete
**Status:** Complete (TASK-316)
**Summary:** Cleared yesterday's blocker and finished provisioning. The CMS admin panel was down because the database had no tables; the fix was to generate the missing Payload migration and rebuild so the container creates the schema on boot. The CMS agent generated the migration safely against a disposable local database (the live dev database was never touched), committed it, copied it to the server, and rebuilt just this client's CMS container. The rebuild applied the migration cleanly (`Migrated: 20260802_124327_initial`), all expected tables now exist, and the admin panel returns a healthy 200 serving its create-first-user screen. TASK-316 (provision + verify) is now complete. Paused at Flynn's request; the only remaining step before seeding is a manual browser action - creating the first admin account and generating an API key.
**Key Decisions:**
- Generated the migration against a throwaway local Postgres (not the shared dev DB) so the initial migration captures the full schema from empty and the dev box stays out of the blast radius.
- Kept `push: true` in the Payload config - it is inert in production (the adapter disables it under `next start`) and useful for local dev; the committed migration is what production relies on. Standard Payload v3 pattern.
- Committed the migration's `.json` schema snapshot as well (separate commit) so the next `migrate:create` has a correct baseline to diff against.
**Delegated To:** CMS agent (planned + executed the migration fix end-to-end -> AGENTS/cms-migration-plan.md, AGENTS/cms-migration-output.md); orchestrator verified the live result independently and committed the snapshot.
**Next:** Flynn creates the first admin in the browser + generates an API key, then TASK-317 (seed). Full resume steps in AGENTS/handover.md.

## [2026-08-04 12:00] Amendment 001 - TASK-317 complete (CMS seeded + validated)
**Status:** Complete (TASK-317)
**Summary:** Loaded the site's starting content into the live CMS and confirmed it all took. First attempt failed cleanly: the API key sitting in the server's config file did not actually work - a check against the database showed the admin account existed but no API key had ever been generated and saved for it (the value in the file was a placeholder-shaped string, not a real key). Flynn regenerated the key properly in the admin panel (enable + Save, which shows the real key once) and updated the config. The re-run passed everything: the 4 product categories, the site-wide settings (all the copy that used to be hardcoded), and the 4 content pages (About, Contact, FAQ, Care Instructions) were created. Re-running a second time made no duplicates (the seeder correctly skips existing content). Crucially, the rich-text and FAQ content - hand-built to Payload's internal format and never before tested against a running CMS - came back from the CMS byte-for-byte intact, which was the main risk this step existed to retire.
**Key Decisions:**
- Ran the seeder from inside the CMS container against its own loopback address - no HTTPS, so the dev box's staging TLS certificate never entered the picture (a plain internet call would have failed cert validation). No security setting was weakened anywhere.
- Added a fail-fast authentication pre-check to the re-run so a bad key would stop us before any writes, rather than mid-seed.
- The human "does it render in the editor" eyeball on the rich text is deferred to TASK-319 (editor parity), which already covers it - TASK-317 proves the data seeds and round-trips.
- Corrected a wrong path inherited from the handover: the client config file is `/srv/skeleton/clients/centrifungal/.env`, not the build-tree path.
**Delegated To:** Backend agent (planned + executed seed and validation -> AGENTS/task-317-seed-plan.md, AGENTS/task-317-seed-output.md); orchestrator verified the output and drove the key-regeneration loop with Flynn.
**Next:** TASK-320 (accessibility audit - needs no new keys, can start now) and TASK-318 (end-to-end purchase - needs Stripe test + Resend keys in the client .env) and TASK-319 (editor parity, includes the Lexical render eyeball). TASK-321 is the final merge gate.
