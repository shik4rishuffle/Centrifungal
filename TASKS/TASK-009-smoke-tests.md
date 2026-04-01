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
