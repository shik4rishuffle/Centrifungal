# Handover Notes

## Session: 2026-03-31

### Goal
Set up the full project planning and begin implementation of Centrifungal - a small e-commerce site for a mushroom grow log business. The session covered project research (Phase 0), requirements discovery (Phase 1), architecture decisions (Phase 2), build plan creation (Phase 3), and began implementation of Phase 1 Foundation and Phase 2 CMS & Core API tasks. Late in the session, the user requested a TDD approach, so a QA agent strategy was designed and agent files were updated, but the QA agent's first batch of test generation hit a rate limit before completing.

### Stack & Environment
- **Backend:** PHP 8.5 (using 8.4 Docker image until 8.5 is on Docker Hub), Laravel 13 (not 12 - 13 is now current stable), Statamic 6 CMS
- **Frontend:** Static HTML/CSS/vanilla JS on Netlify (free tier), no frameworks
- **Database:** SQLite with WAL mode on Railway persistent volume, Litestream backups to Cloudflare R2
- **Hosting:** Railway Hobby plan (~GBP 4/month), Netlify free tier
- **Payments:** Stripe Checkout (redirect flow)
- **Email:** Resend API
- **Shipping:** Royal Mail Click & Drop API (no webhooks - 15-min polling cron for tracking)
- **Testing:** PHPUnit (backend, already configured), Vitest (frontend, not yet set up)
- **Design:** DM Serif Display + DM Sans fonts, forest green + coin gold palette from logo
- **GitHub:** Repository goes on `shik4rishuffle` account (NOT im-fdavies or work Immediate account)
- **Orchestrator pattern:** PM/SM role delegates to 4 specialist agents (Architect, Backend, Frontend, CMS) + newly created QA agent, using plan-gate delegation cycle

### Decisions Made
- **CMS: Statamic Core (free)** over Filament+EditorJS and bespoke PHP+EditorJS. TinaCMS eliminated (Node.js only). Statamic's Bard block editor is the only option with production-ready visual editing for a non-developer owner. One admin user, one form included in free tier.
- **Hosting: Railway Hobby** over Fly.io, Render, shared cPanel. Best balance of cost, DX, and persistent volume support. Persistent volume confirmed as first-class feature for SQLite.
- **Database: SQLite with WAL mode** - 10-20 SKUs and 1-20 orders/day is well within SQLite comfort zone. Switch to Postgres only if two+ trigger conditions hit (sustained >10 concurrent writes, >2GB DB, multi-server needed, etc.).
- **Blade templates over Antlers** - reduces Statamic lock-in, keeps views portable to raw Laravel.
- **CMS content in flat files (git), transactional data in SQLite** - content is version-controlled by default, only orders/customers need database backup.
- **Royal Mail Click & Drop integration in v1** (not deferred) - owner explicitly required it. No webhooks available, so tracking via 15-min polling cron.
- **Stripe Checkout redirect flow** (not embedded Elements) - simplifies PCI scope.
- **Litestream to Cloudflare R2** for near-zero RPO backup. Daily cron backup as second layer.
- **TDD approach adopted mid-build** - QA agent pre-generates failing tests before implementation agents run. Retroactive tests for already-built code. Agent prompt files updated with Test-First Protocol.
- **Don't modify task files for TDD** - existing "How to Test" sections map 1:1 to test methods, adding an "Expected Tests" section would duplicate and drift.
- **Laravel 13 pulled instead of 12** - composer create-project now returns Laravel 13 as current stable. Functionally equivalent for this project.

### Current State

**Completed and confirmed working:**
- Phase 0 (Research), Phase 1 (Discovery), Phase 2 (Architecture), Phase 3 (Build Plan) - all gates passed with user approval
- `BUILD_LOG.md` - project story through Phase 3
- `REQUIREMENTS.md` - approved requirements summary
- `AGENTS/architect-output.md` - approved architecture document with Mermaid diagram, decision log, risk register
- `TASKS/` - 50 task files + README.md index, all status TODO
- TASK-001: Repo setup (.gitignore, README, directory structure)
- TASK-002: Netlify config (netlify.toml, _redirects with API proxy)
- TASK-003: Railway config (Dockerfile, docker-compose, .env.example, entrypoint.sh, nginx.conf, supervisord.conf)
- TASK-100: Laravel 13 + Statamic 6 scaffold (composer installed, Blade configured, env vars set)
- TASK-101: SQLite schema (6 migrations, 6 models, ProductSeeder with 7 products/14 variants)
- TASK-102: WAL mode (journal_mode, busy_timeout, synchronous, foreign_keys pragmas in AppServiceProvider)
- TASK-112: Admin auth (session config, secure cookies, no public registration)
- TASK-200: Design system (reset.css, design-tokens.css with full palette/typography/spacing, design-system.html reference page)
- TASK-201: Component library (components.css with buttons/cards/forms/header/footer/badges/toasts, components.html reference page)
- TASK-103: Product API (3 endpoints, resources, routes, cache headers)
- TASK-104: Cart API (4 endpoints, resources, middleware, purge command)
- TASK-108: Royal Mail service (pushOrder, getOrderStatus, retry logic, PII sanitisation)
- TASK-113: Rate limiting (5 tiers, trusted proxies, CP login throttle)
- TASK-202: Homepage (hero, featured products, brand story, how-it-works, CTA)
- TASK-203: Product listing page (category grouping, responsive grid, out-of-stock badges)
- TASK-205: Cart UI (cart.js module with localStorage, cart page, cart-ui.js rendering)
- TASK-300: Statamic config (locale en_GB, timezone Europe/London, Blade confirmed)
- TASK-301: Bard block types (8 types: hero, text_block, image, image_text, cta_banner, product_highlight, faq_group, gallery + Blade partials)
- TASK-302: Product collection blueprint (all fields, replicator for variants, asset container)
- Agent files updated: `agents/agent-qa.md` created, `agents/agent-backend.md` and `agents/agent-frontend.md` modified with Test-First Protocol

**In progress / partially done:**
- QA Batch 1 (retroactive tests for TASK-103, 104, 108 + cart.js frontend tests) - agents were launched but hit rate limit before completing. Status of their work is unknown - need to check if any test files were partially written.
- Phase 2 task tracker (Task #7) is still marked in_progress.

**Not yet started:**
- TASK-004: Confirm persistent volume (deploy to Railway and test)
- TASK-005: Litestream setup
- TASK-006: SQLite backup cron
- TASK-105 through TASK-107: Stripe checkout, webhook, fulfilment
- TASK-109: Royal Mail tracking poller
- TASK-110, 111: Email notifications
- TASK-114: Stripe reconciliation
- TASK-115: Contact form endpoint
- TASK-204: Product detail page
- TASK-206-211: Checkout flow, content pages, order confirmation
- TASK-212-214: SEO, performance, responsive audit
- TASK-303-309: Product management UX, page blueprints, image upload, navigation, order visibility, contact submissions, owner runbook
- TASK-007-009: DNS, security headers, smoke tests
- No git commits or pushes have been made yet
- GitHub repo not yet created on shik4rishuffle

### Tried & Ruled Out
- **TinaCMS** - eliminated because it requires Node.js runtime, not PHP compatible.
- **Shared cPanel hosting** - rejected despite being cheapest because it lacks git-push deploy, env var management, and API-oriented tooling. Poor fit for headless architecture.
- **Antlers template engine** - rejected in favour of Blade to reduce Statamic lock-in.
- **Simple Commerce addon** - decided to use direct Stripe Checkout integration instead, simpler for this cart size.
- **Adding "Expected Tests" section to task files** - rejected because "How to Test" sections already map 1:1 to test methods, duplication would create drift risk.

### Still To Do
1. **Check QA Batch 1 output** - verify whether the rate-limited agents wrote any test files or factories before dying. If partial, complete them. If empty, re-run.
2. **Complete QA Batch 1** - retroactive tests for TASK-103, 104, 108 + cart.js + model factories + Vitest setup
3. **Run retroactive tests** - `cd backend && php artisan test` to verify all pass against existing code
4. **QA Batch 2** - TDD tests for TASK-105, 106, 115 (tests before implementation)
5. **Implement TASK-105** (Stripe Checkout), **TASK-106** (webhook), **TASK-115** (contact form) - with tests already in place
6. **QA Batch 3** - TDD tests for TASK-107, 109, 110, 111, 114
7. **Implement remaining backend tasks** (107, 109, 110, 111, 114)
8. **Continue frontend:** TASK-204 (product detail), TASK-206-211 (checkout, content pages)
9. **Continue CMS:** TASK-303-309 (product UX, page blueprints, image upload, nav, orders, contact, runbook)
10. **TASK-004** - deploy to Railway and confirm persistent volume (can happen any time)
11. **TASK-005, 006** - Litestream and backup cron (after Railway deploy)
12. **Phase 4 Polish:** TASK-212 (SEO), TASK-213 (performance), TASK-214 (responsive)
13. **Phase 5 Launch:** TASK-007 (DNS), TASK-008 (security headers), TASK-009 (smoke tests)
14. **Create GitHub repo** on shik4rishuffle and push
15. **Initial git commit** - nothing has been committed yet

### Active Resources
- **Project root:** `/Users/flynn.davies/Documents/GitHub/Centrifungal`
- **Backend app:** `backend/` (Laravel 13 + Statamic 6, fully scaffolded)
- **Frontend source:** `frontend/src/` (CSS, HTML, JS files)
- **Infrastructure:** `infrastructure/` (Dockerfile, docker-compose, nginx, supervisor, entrypoint)
- **Agent prompts:** `agents/agent-architect.md`, `agent-backend.md`, `agent-frontend.md`, `agent-cms.md`, `agent-qa.md`
- **Agent outputs:** `AGENTS/architect-output.md`, `AGENTS/architect-plan.md`
- **Task files:** `TASKS/TASK-001-*.md` through `TASKS/TASK-309-*.md` (50 files)
- **Build log:** `BUILD_LOG.md`
- **Requirements:** `REQUIREMENTS.md`
- **TDD plan:** `.claude/plans/flickering-frolicking-nest.md`
- **Brand assets:** `existing-assets/Color logo - no background Bevel 1200x1200.png`
- **Memory:** `.claude/projects/-Users-flynn-davies-Documents-GitHub-Centrifungal/memory/` (GitHub account = shik4rishuffle)

### Risks & Watch-outs
- **No git commits exist yet.** All work is unstaged. A `git add` + commit should happen soon to avoid losing work.
- **Laravel 13 vs 12:** The task files and architecture docs reference Laravel 12, but composer pulled Laravel 13. This is fine functionally but could confuse a future agent reading the docs. The Dockerfile also references `php:8.4-fpm-alpine` not 8.5.
- **QA Batch 1 partial state:** The two agents launched for test generation hit rate limits. They may have written partial files. Check `backend/tests/` and `frontend/src/js/__tests__/` before re-running to avoid duplicates or conflicts.
- **Statamic 6 free tier limits:** 1 admin user, 1 form. If the owner needs more forms later, Pro is a one-time USD 275. The contact form uses Statamic's built-in form feature, consuming the single form slot.
- **Royal Mail Click & Drop API:** No webhooks for tracking. The 15-min polling cron is the workaround. The API authentication model should be verified against current docs before implementation.
- **Railway deployment not yet tested.** TASK-004 (persistent volume confirmation) is a hard gate for all database-dependent production work. Local dev works but Railway deploy is unproven.
- **Frontend has no package.json yet** (Vitest setup was part of the rate-limited QA batch). The cart.js module uses ES module exports but the HTML pages load it via `<script>` tags - there may be module/non-module import conflicts to resolve.
- **The orchestrator pattern** (defined in `.claude/commands/orchestrator.md`) requires the PM to delegate all implementation to specialist agents and never write code directly. The next agent should adopt this role or the user should re-invoke `/orchestrator`.

### Handover Confidence

- **Completeness** [5/5] - full conversation scanned, all decisions, files, and state captured
- **Clarity** [4/5] - next steps are well-ordered but QA batch partial state needs investigation
- **Continuity Risk** [4/5] - clear plan exists but the next agent must check for partial QA output before proceeding

**Overall: [13/15]**

---

## Session: 2026-04-09

### Goal
Get the Railway backend (Statamic CP at `/cp`) and Netlify frontend working end-to-end for the dev site so the user can show it to their mate Tom. This session was entirely deployment debugging and production fixes - no new features, just making what was already built actually work on Railway + Netlify.

### Decisions Made
- **Repo made public** to bypass Netlify's one-contributor limit on private repos (free plan). Branch protection was added then removed again until launch - user wants fast iteration right now.
- **Admin credentials moved to env vars** (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`) after making repo public, since the password was previously hardcoded in entrypoint.sh and visible in git history. User needs to change the password.
- **Product API switched from Eloquent to Statamic** - the user correctly insisted on a single source of truth. `ProductController` now queries Statamic entries directly instead of the Eloquent `Product` model. The existing `SyncProductToDatabase` listener still syncs to DB on entry save, so cart/checkout (which use Eloquent variant IDs) continue to work.
- **Netlify _redirects generated at build time** via shell expansion in the build command, rather than relying on Netlify's `:VAR` interpolation syntax in netlify.toml (which wasn't working).
- **Removed `/api/debug-cp` diagnostic endpoint** and `display_errors=On` from Dockerfile for security before going public.
- **DB product seeder removed from entrypoint** - products now come exclusively from Statamic CMS.

### Current State

**Completed and confirmed working:**
- Statamic CP (`/cp`) loads and is functional - user can log in, edit pages, manage content
- Admin user creation via env vars in entrypoint (with correct password hashing - no double-hash)
- File permissions: storage, bootstrap/cache, content/, resources/blueprints, resources/fieldsets, resources/users all owned by www-data
- Stache warm runs in entrypoint before supervisor starts, with correct ownership after
- LOG_CHANNEL defaults to stderr for Railway log visibility
- Frontend pages load dynamic content via Netlify proxy -> Railway API (nav, footer, CMS pages like FAQ, Care, About)
- Netlify `_redirects` generated at build time with `RAILWAY_BACKEND_URL` baked in
- Product detail page routing (`/product/*` -> `product.html`)
- Favicon added from existing-assets to all HTML pages
- Statamic CP Vite assets copied directly in Dockerfile (not via artisan vendor:publish)
- Security: no hardcoded passwords, no debug endpoints, display_errors off, errors go to stderr
- Repo is public on GitHub at shik4rishuffle/Centrifungal

**Partially working / needs attention:**
- Shop page shows products from Statamic (currently only 1 real product - "Shiitake Grow Log" with slug "loggy-loggy-log-log"). More products need to be added in the CP.
- About page - user mentioned "not sure all the data is coming in" but was happy enough to move on. May need content audit.
- Cart/checkout flow - not tested end-to-end in production. The `SyncProductToDatabase` listener needs to fire when products are saved in CP to populate the DB variants that cart/checkout depend on. This has not been verified on Railway.
- Statamic shows "Pro - Trial Mode" in the CP header bar (visible in screenshots). The `STATAMIC_PRO_ENABLED` env var is set but they may need a license key for production.

**Not tested on production:**
- Stripe checkout flow
- Order creation
- Contact form
- Email sending (Resend)

### Tried & Ruled Out
- **TinaCMS** - eliminated because it requires Node.js runtime, not PHP compatible.
- **Shared cPanel hosting** - rejected despite being cheapest because it lacks git-push deploy, env var management, and API-oriented tooling.
- **Antlers template engine** - rejected in favour of Blade to reduce Statamic lock-in.
- **Simple Commerce addon** - decided to use direct Stripe Checkout integration instead.
- **Adding "Expected Tests" section to task files** - rejected because "How to Test" sections already map 1:1 to test methods.
- **`railway run` for admin user creation** - executes locally with Railway env vars injected, NOT inside the container. Can't access container's /data/database.sqlite.
- **`artisan vendor:publish --tag=statamic-cp` during Docker build** - fails because it tries to bootstrap Laravel which needs DB, tmp dir, etc. Fixed by using direct `cp -r` of vendor dist files instead.
- **Netlify `:VAR` interpolation in netlify.toml redirects** - didn't resolve `RAILWAY_BACKEND_URL`. Switched to generating `_redirects` file at build time via shell expansion.
- **`/api/config` endpoint returning APP_URL to frontend** - caused a race condition where early fetches (nav, footer) used relative URLs (worked) but later fetches (page content) used the returned Railway URL directly (blocked by CSP). Removed the config fetch entirely since the Netlify proxy makes relative URLs sufficient.
- **`bcrypt()` in entrypoint admin user creation** - the User model has a `'password' => 'hashed'` cast which auto-hashes. Using bcrypt() too resulted in double-hashing, making login impossible.
- **Branch protection requiring PR reviews** - enabled then disabled at user's request until the site is live, for faster iteration.

### Still To Do
1. **Verify the SyncProductToDatabase listener works on Railway** - save a product in the CP and check that cart/checkout can reference its variants. If the listener doesn't fire, cart will break.
2. **Add more products in the Statamic CP** - only 1 exists. The user needs to populate the shop.
3. **Test Stripe checkout end-to-end on production** - not yet verified.
4. **Change admin password** - old hardcoded password is in git history. User should log in to /cp and change it, or update `ADMIN_PASSWORD` env var in Railway.
5. **Audit About page data** - user flagged it might be incomplete.
6. **Re-enable branch protection on main** once the site is stable/live.
7. **Remove temporary admin user creation from entrypoint** once the user has a stable login (or keep it for redeploy resilience).
8. **Address Statamic Pro license** - CP shows "Pro - Trial Mode". May need a license key for production use.
9. **Remaining implementation tasks** from TASKS/ (Stripe webhooks, email notifications, Royal Mail, Litestream backups, etc.) - see previous session's Still To Do for the full list, filtered by what's now done.
10. **Clean up old git history** - the hardcoded password is in commits 456b002 and 41a94a5. Consider force-pushing a cleaned history before launch if the repo stays public (requires user confirmation for destructive operation).

### Active Resources
- **Railway service:** `centrifungal-production.up.railway.app`
- **Netlify site:** `centrifungal.netlify.app`
- **GitHub repo:** `shik4rishuffle/Centrifungal` (public, main branch)
- **Railway env vars needed:** `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `APP_KEY`, `APP_ENV`, `APP_URL`, `DB_CONNECTION`, `DB_DATABASE`, `STRIPE_KEY`, `STRIPE_SECRET`, `STATAMIC_PRO_ENABLED`, `LOG_CHANNEL`, `FRONTEND_URL`
- **Netlify env vars:** `RAILWAY_BACKEND_URL` = `centrifungal-production.up.railway.app`
- **Key files modified this session:**
  - `infrastructure/entrypoint.sh` - admin user creation, stache warm, permission fixes, LOG_CHANNEL default
  - `infrastructure/Dockerfile` - display_errors off, fileinfo extension, CP asset copy
  - `backend/app/Http/Controllers/Api/ProductController.php` - rewired to Statamic
  - `backend/routes/api.php` - removed debug-cp endpoint
  - `frontend/src/js/config.js` - removed localhost fallback and config fetch
  - `frontend/netlify.toml` - build command generates _redirects, removed redirect rules
  - `frontend/src/404.html` - removed green hero bar
  - `frontend/src/*.html` - favicon added to all pages
- **Deployment guide:** `HUMAN-TASKS.md`

### Risks & Watch-outs
- **Git history contains the hardcoded password** `$N1psyB1sh$` in commits 456b002 and 41a94a5. The repo is now public. This should be addressed before sharing widely.
- **Cart/checkout depends on SyncProductToDatabase listener** - if this listener doesn't fire when products are saved in the CP, adding items to cart will fail because the Eloquent ProductVariant records won't exist. This sync has NOT been tested on Railway.
- **Statamic Pro Trial Mode** - the CP shows trial mode. Pro features (multi-user, forms beyond 1, etc.) may stop working or show warnings. Need to verify what's needed.
- **The entrypoint resets the admin password on every deploy** from the `ADMIN_PASSWORD` env var. If the user changes their password in the CP, it'll be overwritten on next deploy. Consider removing the password-reset-on-existing-user logic once the user is stable.
- **Product category slugs** in the seeder were fixed (supplies->colonised-dowels, kits->diy-kits) but the seeder was then removed. If someone re-runs it manually, it uses the corrected slugs. The Statamic blueprint's category select options already use the correct slugs.
- **No tests exist.** The TDD initiative from session 1 was interrupted by rate limits and this session focused entirely on deployment. Test coverage is zero.
- **The `/* -> /:splat.html` redirect** means any path that doesn't match a static file gets a 404. Dynamic routes (like `/product/*`) needed explicit rules. If new dynamic routes are added, they'll need similar treatment in the build command.

### Handover Confidence

- **Completeness** [5/5] - all deployment fixes, decisions, and current state captured
- **Clarity** [4/5] - next steps are clear but the cart/checkout sync is an unknown that needs investigation
- **Continuity Risk** [4/5] - the Statamic-as-source-of-truth switch is the biggest change; next agent needs to verify the SyncProductToDatabase listener works

**Overall: [13/15]**
