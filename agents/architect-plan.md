# Phase 3 - Infrastructure & Cross-Cutting Task Breakdown

Date: 2026-03-31
Source: `architect-output.md` (approved), `REQUIREMENTS.md` (approved)

---

## Task 001: Repository Setup
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** none

### Context
Every other task depends on a working monorepo. This is the first thing that must exist before any agent can begin work.

### What Needs Doing
1. Initialise the Git repository (if not already initialised) with a `main` branch.
2. Create the top-level directory structure:
   ```
   /
   ├── backend/          # Laravel 12 + Statamic 6 application
   ├── frontend/         # Static HTML/CSS/JS source (built and deployed to Netlify)
   ├── infrastructure/   # Dockerfile, docker-compose.yml, Litestream config, backup scripts
   ├── AGENTS/           # Agent instructions and plans (already exists)
   ├── .gitignore
   ├── README.md
   └── REQUIREMENTS.md   # Already exists
   ```
3. Create `.gitignore` covering:
   - PHP: `vendor/`, `.env`, `storage/framework/`, `bootstrap/cache/`
   - Node: `node_modules/`, `dist/`
   - SQLite: `*.sqlite`, `*.sqlite-journal`, `*.sqlite-wal`, `*.sqlite-shm`
   - OS: `.DS_Store`, `Thumbs.db`
   - IDE: `.idea/`, `.vscode/` (except shared settings if needed)
4. Create a minimal `README.md` with project name, one-line description, and links to `REQUIREMENTS.md` and `AGENTS/architect-output.md`.

### Files
- `.gitignore` (create)
- `README.md` (create)
- `backend/` (create directory)
- `frontend/` (create directory)
- `infrastructure/` (create directory)

### How to Test
- `git status` shows a clean working tree after initial commit.
- All three subdirectories exist.
- `.gitignore` prevents committing `vendor/`, `node_modules/`, `.env`, and `*.sqlite` files.

### Unexpected Outcomes
- If the repo is already initialised with a different branch structure, flag before restructuring.
- If existing files would be moved or deleted, flag for approval.

### On Completion
Unblocks all other TASK-002 through TASK-009. Queue TASK-002 and TASK-003 in parallel.

---

## Task 002: Netlify Configuration
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-001

### Context
The static frontend is served from Netlify's free tier CDN. Configuration must be in place before any frontend deployment, and must include proper redirects so API calls reach Railway.

### What Needs Doing
1. Create `frontend/netlify.toml` with:
   - `[build]` section: `publish = "dist"`, `command = "npm run build"` (placeholder - frontend agent will refine).
   - `[[redirects]]` rule proxying `/api/*` to the Railway backend URL (use environment variable `RAILWAY_BACKEND_URL`). Set `status = 200` (rewrite, not redirect) and `force = true`.
   - `[[headers]]` section delegated to TASK-008 (add placeholder comment).
2. Create `frontend/_redirects` as a fallback for any redirect rules Netlify needs outside `netlify.toml`.
3. Document the required Netlify environment variables:
   - `RAILWAY_BACKEND_URL` - the Railway service URL (e.g., `https://centrifungal-api.up.railway.app`).

### Files
- `frontend/netlify.toml` (create)
- `frontend/_redirects` (create)

### How to Test
- `netlify.toml` parses without errors (run `npx netlify-toml-parser frontend/netlify.toml` or validate manually).
- `/api/*` redirect rule points to `RAILWAY_BACKEND_URL` with status 200.
- Build command and publish directory are set.

### Unexpected Outcomes
- If the frontend build tool is not yet decided, use placeholder values and note them for the frontend agent to update.
- If Netlify's proxy rewrite has CORS implications with Railway, flag for TASK-008.

### On Completion
Frontend agent can begin deploying static assets. Queue TASK-007 (DNS) and TASK-008 (headers) when ready.

---

## Task 003: Railway Configuration
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-001

### Context
Railway hosts the PHP backend (Laravel 12 + Statamic 6) with a persistent volume for SQLite. The Dockerfile and configuration must be correct before any backend deployment. Getting the persistent volume mount right is critical - data loss is the highest-impact risk.

### What Needs Doing
1. Create `infrastructure/Dockerfile` for the Railway service:
   - Base image: `php:8.5-fpm-alpine` (or `serversideup/php:8.5-fpm-alpine` if available - check).
   - Install required PHP extensions: `pdo_sqlite`, `sqlite3`, `gd`, `bcmath`, `mbstring`, `xml`, `curl`, `zip`.
   - Ensure SQLite version is 3.52.0+ (WAL-reset bug fix - see risk register).
   - Install Composer, run `composer install --no-dev --optimize-autoloader`.
   - Install Nginx or use a process manager (Supervisor) to run PHP-FPM + Nginx.
   - Set working directory to `/app`.
   - Copy application code.
   - Expose port 8080 (Railway convention).
2. Create `infrastructure/docker-compose.yml` for local development parity:
   - PHP service matching the Dockerfile.
   - Volume mount: `./data:/data` to simulate Railway persistent volume locally.
   - Environment variables loaded from `.env`.
3. Create `infrastructure/.env.example` documenting all required environment variables:
   - `APP_KEY`, `APP_ENV`, `APP_URL`
   - `DB_CONNECTION=sqlite`, `DB_DATABASE=/data/database.sqlite`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `ROYAL_MAIL_API_KEY`, `ROYAL_MAIL_API_SECRET`
   - `LITESTREAM_REPLICA_URL` (R2 bucket URL)
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
4. Create `infrastructure/railway.json` (or document Railway dashboard settings):
   - Volume mount: `/data` (persistent volume).
   - Health check endpoint: `/api/health`.
   - Start command: entrypoint script that starts Litestream, then PHP-FPM + Nginx.
5. Create `infrastructure/entrypoint.sh`:
   - If `/data/database.sqlite` does not exist, create it and run migrations.
   - Start Litestream as a subprocess (wrapping the main process).
   - Start PHP-FPM and Nginx.

### Files
- `infrastructure/Dockerfile` (create)
- `infrastructure/docker-compose.yml` (create)
- `infrastructure/.env.example` (create)
- `infrastructure/railway.json` (create)
- `infrastructure/entrypoint.sh` (create)

### How to Test
- `docker build -f infrastructure/Dockerfile .` completes without errors.
- `docker-compose -f infrastructure/docker-compose.yml up` starts the service.
- `php -r "echo SQLite3::version()['versionString'];"` inside the container reports 3.52.0+.
- `/data/database.sqlite` is created on first boot.
- Container exposes port 8080 and responds to HTTP requests.

### Unexpected Outcomes
- If `php:8.5-fpm-alpine` is not yet available on Docker Hub, fall back to `8.4-fpm-alpine` and flag.
- If SQLite 3.52.0+ is not available in the Alpine package repo, flag - may need to compile from source.
- If Railway's volume mount path conflicts with the container filesystem, flag immediately.

### On Completion
Queue TASK-004 (persistent volume confirmation) immediately. TASK-005 (Litestream) and TASK-006 (backup cron) depend on this.

---

## Task 004: Confirm Persistent Volume - SQLite Survives Redeploy
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-003

### Context
This is a non-negotiable Phase 1 gate. The architecture depends on SQLite on a Railway persistent volume. If data does not survive a redeploy, the entire database strategy must change (fallback: Postgres). This must be proven before any other backend work proceeds.

### What Needs Doing
1. Deploy the Dockerfile from TASK-003 to Railway with the persistent volume mounted at `/data`.
2. SSH or exec into the running container (via `railway shell` or Railway CLI).
3. Create a test SQLite database at `/data/test-persistence.sqlite`.
4. Insert a known test row: `CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO test VALUES (1, 'survives-redeploy');`
5. Trigger a redeploy (push a trivial commit or use `railway up`).
6. After the new container is running, verify:
   - `/data/test-persistence.sqlite` still exists.
   - `SELECT value FROM test WHERE id = 1;` returns `survives-redeploy`.
7. Document the result in a verification log.
8. Clean up the test database.

### Files
- `infrastructure/verify-persistence.sh` (create - script to automate steps 3-6)
- `AGENTS/verification-log.md` (create - record the result with timestamp)

### How to Test
- The test row inserted before redeploy is readable after redeploy.
- Pass: proceed with SQLite architecture.
- Fail: escalate immediately. Do not proceed with any database-dependent tasks.

### Unexpected Outcomes
- If the volume does not persist: STOP. Flag to orchestrator. The fallback is Railway Postgres addon (free tier available). This changes TASK-003, TASK-005, TASK-006, and all backend database configuration.
- If the volume persists but with corruption or permission changes, flag for investigation.

### On Completion
If PASS: unblocks TASK-005, TASK-006, and all backend database work. Record "PERSISTENT VOLUME CONFIRMED" in verification log.
If FAIL: escalate to orchestrator with recommendation to switch to Postgres.

---

## Task 005: Litestream Setup - Continuous Replication to Cloudflare R2
**Phase:** 2 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-004

### Context
Litestream provides near-zero RPO backup by continuously replicating SQLite WAL frames to Cloudflare R2. This is the primary disaster recovery mechanism. If the Railway volume fails or is corrupted, Litestream allows restoring to within seconds of the last write.

### What Needs Doing
1. Install Litestream in the Dockerfile (add to TASK-003's Dockerfile):
   - Download the latest Litestream binary for Alpine Linux.
   - Place at `/usr/local/bin/litestream`.
2. Create `infrastructure/litestream.yml` configuration:
   ```yaml
   dbs:
     - path: /data/database.sqlite
       replicas:
         - type: s3
           bucket: centrifungal-backup
           path: litestream
           endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
           access-key-id: ${R2_ACCESS_KEY_ID}
           secret-access-key: ${R2_SECRET_ACCESS_KEY}
           retention: 72h
           sync-interval: 1s
   ```
3. Update `infrastructure/entrypoint.sh` to run `litestream replicate` as the process wrapper:
   - Use `litestream replicate -exec "supervisord -c /etc/supervisor/supervisord.conf"` pattern so Litestream wraps the main process.
4. Create a Cloudflare R2 bucket named `centrifungal-backup` (document the manual steps - R2 bucket creation is a dashboard/CLI action):
   - Enable S3-compatible API access.
   - Create an API token with read/write access to the bucket.
   - Document the required env vars: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, R2 endpoint URL.
5. Create `infrastructure/restore-from-litestream.sh`:
   - Stops the running application.
   - Runs `litestream restore -o /data/database.sqlite`.
   - Verifies the restored database with an integrity check: `sqlite3 /data/database.sqlite "PRAGMA integrity_check;"`.
   - Restarts the application.

### Files
- `infrastructure/litestream.yml` (create)
- `infrastructure/restore-from-litestream.sh` (create)
- `infrastructure/Dockerfile` (modify - add Litestream binary)
- `infrastructure/entrypoint.sh` (modify - wrap with Litestream)

### How to Test
- Deploy to Railway. Insert a test row into the database.
- Check R2 bucket - WAL frames should appear within seconds.
- Destroy the SQLite file on the volume (`rm /data/database.sqlite`).
- Run `restore-from-litestream.sh`.
- Verify the test row is present in the restored database.
- `PRAGMA integrity_check` returns `ok`.

### Unexpected Outcomes
- If Litestream fails to connect to R2, check endpoint URL format and credentials. Cloudflare R2's S3 compatibility has specific endpoint requirements.
- If replication lag exceeds 10 seconds under normal load, flag for investigation.
- If Litestream significantly increases container memory usage (beyond 50MB overhead), flag - may need to adjust Railway resource allocation.

### On Completion
Litestream is operational. Queue TASK-006 (daily backup cron) which provides the second backup layer.

---

## Task 006: SQLite Backup Cron - Daily Offsite Copy with Tested Restore
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-004

### Context
Litestream provides continuous replication, but a belt-and-suspenders approach requires a daily full backup as well. This is a separate, independent backup mechanism that uses SQLite's `.backup` command to produce a consistent snapshot. The restore procedure must be tested and documented so the owner (or a future developer) can recover from any failure scenario.

### What Needs Doing
1. Create `infrastructure/backup-daily.sh`:
   - Use `sqlite3 /data/database.sqlite ".backup /tmp/backup-$(date +%Y%m%d-%H%M%S).sqlite"` to produce a consistent snapshot.
   - Run `sqlite3 /tmp/backup-*.sqlite "PRAGMA integrity_check;"` to verify the backup.
   - Upload to Cloudflare R2 under a `daily-backups/` prefix using `aws s3 cp` (S3-compatible CLI) or `rclone`.
   - Retain the last 30 daily backups (delete older ones).
   - Log success/failure to stdout (Railway captures container logs).
2. Create `infrastructure/backup-manual.sh`:
   - Same logic as daily backup but with a `manual-` prefix in the filename.
   - Intended for the owner to trigger before risky operations (e.g., bulk product changes).
   - Can be invoked via `railway run bash infrastructure/backup-manual.sh` or an admin endpoint.
3. Create `infrastructure/restore-from-backup.sh`:
   - Lists available backups in R2.
   - Downloads the specified backup (or latest if no argument).
   - Stops the application.
   - Replaces `/data/database.sqlite` with the backup.
   - Runs `PRAGMA integrity_check`.
   - Restarts the application.
4. Schedule the daily backup:
   - Add a Laravel scheduled command that runs `backup-daily.sh` at 03:00 UTC daily.
   - Alternatively, use Railway's cron job feature if available.
5. Document the restore procedure in `infrastructure/RESTORE-RUNBOOK.md`:
   - Step-by-step instructions a non-developer can follow with Railway CLI.
   - Covers three scenarios: (a) restore from daily backup, (b) restore from Litestream, (c) restore from Railway volume snapshot.
6. Test the restore procedure end-to-end:
   - Create a backup, delete the database, restore, verify data integrity.

### Files
- `infrastructure/backup-daily.sh` (create)
- `infrastructure/backup-manual.sh` (create)
- `infrastructure/restore-from-backup.sh` (create)
- `infrastructure/RESTORE-RUNBOOK.md` (create)
- `backend/app/Console/Kernel.php` or equivalent Laravel 12 scheduling config (modify)

### How to Test
- Run `backup-daily.sh` manually. Verify a `.sqlite` file appears in R2 under `daily-backups/`.
- Run `PRAGMA integrity_check` on the uploaded backup - returns `ok`.
- Run `restore-from-backup.sh` targeting the backup just created. Verify data is intact.
- Verify the scheduled command runs at the expected time (check Laravel schedule list).
- Run `backup-manual.sh` and verify a `manual-` prefixed backup appears in R2.

### Unexpected Outcomes
- If `sqlite3` CLI is not available in the container, install it in the Dockerfile.
- If R2 upload fails due to credential or endpoint issues, ensure the same credentials as Litestream are used (TASK-005).
- If the backup file is larger than expected (>100MB for this scale of site), flag for investigation.

### On Completion
Backup strategy is complete. Both continuous (Litestream) and daily (cron) backups are operational with tested restore procedures. This is a Phase 1 gate - must be confirmed before launch.

---

## Task 007: DNS and Domain Setup
**Phase:** 3 | **Agent:** architect
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-002, TASK-003

### Context
The site needs a custom domain pointing to Netlify (frontend) and a subdomain or path for the Railway API. DNS must be configured before launch.

### What Needs Doing
1. Document the DNS configuration plan (domain registrar TBD - check with owner):
   - `centrifungal.co.uk` (or chosen domain) - A/CNAME record pointing to Netlify.
   - `api.centrifungal.co.uk` - CNAME record pointing to Railway service URL.
   - Alternatively, use Netlify's `/api/*` proxy (TASK-002) to avoid a separate API subdomain.
2. Configure Netlify custom domain:
   - Add domain in Netlify dashboard.
   - Enable automatic HTTPS (Let's Encrypt).
   - Verify DNS propagation.
3. Configure Railway custom domain (if using API subdomain):
   - Add `api.centrifungal.co.uk` in Railway dashboard.
   - Railway provides automatic HTTPS.
4. Decide on the API routing strategy and document the decision:
   - Option A: Netlify proxy (`/api/*` rewrites to Railway) - simpler, single domain, no CORS issues.
   - Option B: Separate `api.` subdomain - cleaner separation, but requires CORS headers.
   - Recommendation: Option A (Netlify proxy) unless performance testing reveals unacceptable latency from the proxy hop.
5. If the domain registrar is Cloudflare, document the specific configuration (Cloudflare proxy vs DNS-only mode for Netlify compatibility).

### Files
- `infrastructure/DNS-SETUP.md` (create - step-by-step instructions for domain configuration)
- `frontend/netlify.toml` (modify - add custom domain configuration if needed)

### How to Test
- `dig centrifungal.co.uk` returns the expected Netlify IP/CNAME.
- `curl -I https://centrifungal.co.uk` returns HTTP 200 with valid TLS certificate.
- `curl -I https://centrifungal.co.uk/api/health` returns HTTP 200 from Railway backend.
- HTTPS redirect works: `curl -I http://centrifungal.co.uk` returns 301 to HTTPS.

### Unexpected Outcomes
- If the domain is not yet purchased, flag to orchestrator. Provide registrar recommendation (Cloudflare Registrar for at-cost pricing, or Namecheap).
- If the owner wants a `.com` instead of `.co.uk`, this does not affect the technical setup.
- If Cloudflare proxy mode causes issues with Netlify's SSL, switch to DNS-only mode.

### On Completion
Domain is live and pointing to both Netlify and Railway. Queue TASK-008 (security headers) and TASK-009 (smoke tests).

---

## Task 008: Security Headers (CSP, HSTS, etc.)
**Phase:** 3 | **Agent:** architect
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-002, TASK-003

### Context
Security headers protect against XSS, clickjacking, MIME sniffing, and other common web attacks. They must be configured on both Netlify (static assets) and Railway (API responses) before launch.

### What Needs Doing
1. Add security headers to `frontend/netlify.toml` under `[[headers]]`:
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Permissions-Policy = "camera=(), microphone=(), geolocation=()"
       Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
       Content-Security-Policy = "default-src 'self'; script-src 'self' https://js.stripe.com; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"
   ```
2. Configure the same headers on the Railway/Laravel side via middleware:
   - Create a `SecurityHeaders` middleware in Laravel.
   - Apply to all API responses.
   - CSP for API responses can be more restrictive (no script-src needed).
3. Stripe-specific CSP considerations:
   - `script-src` must include `https://js.stripe.com` for Stripe.js.
   - `frame-src` must include `https://js.stripe.com` and `https://hooks.stripe.com` for Stripe Checkout redirect.
   - `connect-src` must include `https://api.stripe.com` for API calls.
4. Test CSP does not break any page functionality:
   - Checkout flow with Stripe.
   - Image loading (product images may come from a CDN or Statamic asset pipeline).
   - Font loading (Google Fonts or self-hosted).
5. If using Google Fonts, add `https://fonts.googleapis.com` to `style-src` and `https://fonts.gstatic.com` to `font-src`.

### Files
- `frontend/netlify.toml` (modify - add headers section)
- `backend/app/Http/Middleware/SecurityHeaders.php` (create)
- `backend/bootstrap/app.php` or route middleware config (modify - register middleware)

### How to Test
- Run `curl -I https://centrifungal.co.uk` and verify all security headers are present.
- Run `curl -I https://centrifungal.co.uk/api/health` and verify API security headers.
- Use [securityheaders.com](https://securityheaders.com) to scan the live site - target A+ rating.
- Complete a full Stripe Checkout flow - no CSP violations in the browser console.
- Browse all pages - no CSP violations in the browser console.

### Unexpected Outcomes
- If CSP blocks Stripe Checkout, relax the specific directive (do not use `unsafe-inline` for scripts).
- If product images are hosted on an external CDN not yet decided, the `img-src` directive will need updating. Flag for the frontend agent to confirm image hosting.
- If the Statamic control panel breaks due to CSP, add an exception for `/cp/*` routes only.

### On Completion
Security headers are deployed. Queue TASK-009 (smoke tests) to verify nothing is broken.

---

## Task 009: Smoke Tests - End-to-End Launch Checklist
**Phase:** 5 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008

### Context
This is the final gate before launch. Every critical path must be verified end-to-end on the production environment. Failure of any test blocks launch.

### What Needs Doing
1. Create `infrastructure/smoke-tests.sh` - an executable checklist script that runs all verifications:
   - **Frontend availability:** `curl -sI https://centrifungal.co.uk` returns HTTP 200.
   - **API availability:** `curl -sI https://centrifungal.co.uk/api/health` returns HTTP 200 with JSON body `{"status": "ok"}`.
   - **HTTPS enforcement:** `curl -sI http://centrifungal.co.uk` returns 301 redirect to HTTPS.
   - **Security headers:** All headers from TASK-008 are present on both frontend and API responses.
   - **Statamic CP access:** `curl -sI https://centrifungal.co.uk/cp` returns HTTP 200 (or 302 to login).
   - **SQLite database:** API health endpoint confirms database connection (include a DB query in health check).
   - **Litestream replication:** Verify R2 bucket contains recent WAL frames (< 5 minutes old).
   - **Backup cron:** Verify at least one daily backup exists in R2 `daily-backups/` prefix.
   - **Stripe integration:** Hit the Stripe test-mode checkout endpoint - verify a Stripe Checkout session is created.
   - **Resend integration:** Send a test email via the API health check (or a dedicated test endpoint). Verify delivery.
   - **Royal Mail integration:** Verify API credentials are valid (authenticated ping to Click & Drop API).
   - **DNS resolution:** `dig centrifungal.co.uk` returns expected records.
   - **TLS certificate:** Verify certificate is valid and not expiring within 30 days.
2. Create `infrastructure/LAUNCH-CHECKLIST.md` - a human-readable checklist for manual verification:
   - All smoke test items above, plus:
   - Owner can log into Statamic CP and edit a page.
   - Owner can add a product with images.
   - Test order flows through: browse -> cart -> Stripe Checkout -> order created -> Click & Drop -> tracking update -> shipping email.
   - Mobile responsiveness spot check (3 pages minimum).
   - PageSpeed Insights score > 90 on mobile.
   - Favicon and Open Graph meta tags are present.
3. Script should output PASS/FAIL for each check with clear error messages for failures.
4. Script exit code: 0 if all pass, 1 if any fail.

### Files
- `infrastructure/smoke-tests.sh` (create)
- `infrastructure/LAUNCH-CHECKLIST.md` (create)

### How to Test
- Run `bash infrastructure/smoke-tests.sh` against the production environment.
- Every check outputs PASS.
- Exit code is 0.
- Manually walk through the LAUNCH-CHECKLIST.md items that require browser interaction.

### Unexpected Outcomes
- If any smoke test fails, do not launch. Identify the failing component and trace back to the responsible task (TASK-001 through TASK-008).
- If Stripe is still in test mode at launch time, flag - the switch to live keys must be a deliberate, documented step.
- If Royal Mail API returns authentication errors, verify credentials with the owner (they must have a Click & Drop business account).

### On Completion
All smoke tests pass. Site is cleared for launch. Hand off to orchestrator with "LAUNCH READY" status.

---

## Task Dependency Graph

```
TASK-001 (repo setup)
  ├── TASK-002 (Netlify config) ──────────┐
  │     └── TASK-007 (DNS) ──────────────┤
  │     └── TASK-008 (security headers) ──┤
  └── TASK-003 (Railway config)           │
        └── TASK-004 (confirm volume) ****│**** PHASE 1 GATE
              ├── TASK-005 (Litestream)   │
              └── TASK-006 (backup cron) **** PHASE 1 GATE
                                          │
TASK-009 (smoke tests) ◄─────────────────┘ depends on ALL above
```

## Phase Summary

| Phase | Tasks | Rationale |
|---|---|---|
| 1 | TASK-001, TASK-002, TASK-003, TASK-004, TASK-006 | Foundation. Volume persistence and backup must be proven before any data-dependent work begins. |
| 2 | TASK-005 | Litestream is a second-layer backup. Important but not a launch blocker if daily backups (TASK-006) are working. |
| 3 | TASK-007, TASK-008 | DNS and security headers depend on both frontend and backend being deployed. |
| 5 | TASK-009 | Final launch gate. Cannot run until everything else is done. |
