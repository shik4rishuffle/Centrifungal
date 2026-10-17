# Handover

## Project
Centrifungal - re-platform to Payload CMS + Skeleton Crew (Amendment 001, Phase B deploy+verify).

## Current Phase
Amendment 001 - Phase B. TASK-316 (provision) + TASK-317 (seed live CMS) both **COMPLETE**.
CMS `/admin` live (200); content seeded + validated. Awaiting TASK-317 micro-gate approval.

## Status
Awaiting user approval on the TASK-317 micro-gate, then next task. No blockers.

## Last Completed
- TASK-317: seeded the live CMS + validated. First run FAILED (403) - the `PAYLOAD_API_KEY` in the
  client `.env` did not authenticate (admin user existed but `enable_a_p_i_key`/`api_key` were NULL -
  the key had never been generated+Saved in Payload; a UUID-shaped placeholder was in the file). Flynn
  regenerated the key in the admin UI (Enable API Key -> Save -> copy the once-shown key) and updated
  the `.env`; the re-run PASSED all acceptance: 4 categories, SiteSettings (6 nav links), 4 pages,
  idempotent re-run (skip-only, no dupes), and the hand-built Lexical + faqGroup shapes round-trip
  intact via API (the key de-risk). Ran in-container against `http://localhost:3000/api` (TLS-free).
  See `AGENTS/task-317-seed-output.md`. Nothing committed/pushed/merged.
- TASK-316: provisioned + schema fixed + verified. Migration `20260802_124327_initial` committed
  (`4cc85ff`) + schema snapshot (`83cb560`) on branch `payload-migration`. See `AGENTS/cms-migration-output.md`.

## Resume From
On TASK-317 gate approval, pick the next task. Ready now (no new keys needed):
- **TASK-320** a11y audit (Lighthouse + pa11y, WCAG AA) against the deployed dev URL - can start now.
Need Flynn to drop keys into `/srv/skeleton/clients/centrifungal/.env` on the box first:
- **TASK-318** E2E purchase (Stripe TEST secret + webhook signing secret + Resend key).
- **TASK-319** editor-parity vs CONTENT_INVENTORY.md - includes the deferred admin-UI Lexical render eyeball.
- **TASK-321** final merge gate (payload-migration -> master).

## Pending User Decisions
- Provide Stripe TEST secret + webhook signing secret + Resend key for TASK-318 (into the client
  `.env` on the box).
- Merge gate TASK-321.

## Active Blockers
None.

## Key Context
- **Root cause captured for reuse:** Payload 3 + `@payloadcms/db-postgres` ignores `push: true`
  under `next start` (prod), so production MUST ship committed migrations. `push: true` was kept
  (inert in prod, convenient in local dev - standard Payload v3 pattern). This gotcha is still
  pending a `/scribe` vault write (see below) - carry it forward.
- Storefront must NOT use `skeleton deploy` (generic template, no backend/CSP) - bring it up via the
  repo's own `docker-compose.yml`. Vault: `[[skeleton-deploy-generic-template]]`.
- Build context is the rsync'd tree at `/srv/skeleton/build/centrifungal` (PERMANENT - do not delete
  while live). `/admin` verification always needs `curl -k` (staging certs).
- Rollback: `docker exec payload-centrifungal npx payload migrate:down` (no live data), or full
  teardown `./skeleton destroy centrifungal` + `rm -rf /srv/skeleton/build/centrifungal`.
- SSH: `ssh skeleton` (Mac only) or `ssh -i ~/.ssh/id_skeleton -p 2222 deploy@46.225.107.134`.

## Pending Documentation (Scribe)
- File the "db-postgres disables push in prod -> must commit migrations" gotcha via `/scribe`
  (confirmed concretely today; domain: SkeletonCrewShit). Was pending last session too - not blocking.

## Files to Read
- `PROJECT_BRIEF.md` -> "Migration status - 2026-08-02" (full detail).
- `AGENTS/cms-migration-output.md` (execution report) and `AGENTS/cms-migration-plan.md`.
- `AGENTS/devops-output.md` (rsync/pre-flight/wizard sheet).
- `AMENDMENTS/AMENDMENT-001.md`, `DEPLOYMENT.md`, `scripts/cms/seed.mjs`.
- Vault: `[[skeleton-crew-handbook]]`, `[[skeleton-deploy-generic-template]]`,
  `[[skeleton-new-subpath-build-context]]`, `[[skeleton-crew-vps-access]]`.
