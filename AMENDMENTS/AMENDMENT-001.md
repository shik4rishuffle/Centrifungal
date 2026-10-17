# Amendment 001 - Re-platform to Payload CMS + Skeleton Crew

**Date:** 2026-08-01
**Triggered by:** User request (post-completion re-platform)
**Scope:** The original project (Phases 1-8, complete) shipped a Statamic 6 /
Laravel 13 site on Railway + Netlify. This amendment re-platforms Centrifungal
onto the Skeleton Crew stack: Payload CMS 3 replaces Statamic, a small
Node/Express API replaces the Laravel backend, SQLite moves to the shared
PostgreSQL, and hosting moves to the VPS (Nginx + Traefik + Docker). The build
(Phases A-E below) is already done and verified locally on branch
`payload-migration`; nothing is committed or merged. What remains is deploy +
end-to-end verification + the accessibility audit, all of which need Flynn's VPS
and third-party test keys.

See `PROJECT_BRIEF.md` -> "Migration status - 2026-08-01" for the full build
record and `DEPLOYMENT.md` for the deploy runbook.

## Decisions that shaped this amendment
- **Full re-platform, not a lift-and-shift** - Laravel -> Node/Express; SQLite ->
  shared PostgreSQL. Supersedes the "Laravel in Docker" / "SQLite in a volume"
  rows of the original brief's Target table.
- **Clean-slate products** - no products migrated (old catalogues were
  test/legacy and diverged); schema + 4 categories seeded, Tom adds real products.
- **Everything editable** - content previously hardcoded in the frontend is now
  CMS-editable.
- **Dev/staging proceeds without the backups+quotas revenue gate** - no live data
  yet (owner's call: "send it").

## Already built + locally verified (no further action - recorded for tracking)

| Task ID | Title | Agent | Status | Evidence |
|---|---|---|---|---|
| TASK-310 | Payload CMS schema (collections, globals, blocks, hooks, config) | cms | DONE | `tsc` clean + full `next build` clean |
| TASK-311 | Node/Express backend (Stripe, contact, Royal Mail + reconcile crons, Resend emails) | backend | DONE | installs, imports, boots, `/api/health` OK, degrades w/o CMS |
| TASK-312 | Frontend rewire to Payload REST + backend (12 JS modules, Lexical renderer, variant/SKU cart) | frontend | DONE | syntax-clean, `vitest` 17/17, CSP-safe |
| TASK-313 | Content seeder (categories + SiteSettings + 4 pages, idempotent, verbatim) | backend | DONE | `scripts/cms/seed.mjs`; content = `CONTENT_INVENTORY.md` |
| TASK-314 | Platform wiring (docker-compose, nginx CSP/clean-URLs, build.sh, skeleton CLI) | devops | DONE | deployable via `skeleton new` |
| TASK-315 | Cross-layer adversarial review + fixes | qa | DONE | 16-agent review, 12 real bugs found + fixed |

## Remaining tasks (need Flynn - VPS + test keys)

| Task ID | Title | Agent | Priority | Status | Dependencies |
|---|---|---|---|---|---|
| TASK-316 | Provision on dev VPS: `skeleton new` (Payload source = `payload/`), first admin + API key, deploy storefront | devops | High | Pending | none (needs VPS access) |
| TASK-317 | Run seeder against live Payload; validate migrations + Lexical seed shape | backend | High | Pending | TASK-316 |
| TASK-318 | End-to-end purchase journey: Stripe test checkout -> order -> confirmation + shipping emails; Royal Mail no-op check | qa | High | Pending | TASK-316, TASK-317 (needs Stripe test + Resend keys) |
| TASK-319 | Editor-parity check: confirm Tom can edit everything in `CONTENT_INVENTORY.md` via Payload admin | cms | High | Pending | TASK-317 |
| TASK-320 | Accessibility audit (Lighthouse + pa11y, every page, WCAG AA) + fixes until passing | frontend | High | Pending | TASK-316 (needs deployed dev URL) |
| TASK-321 | Merge decision: `payload-migration` -> `master` (Flynn's gate) | - | High | Pending | TASK-316..320 |

## Notes / known flags
- Royal Mail Click & Drop request shape + shipping-band prices are best-effort
  ports - validate against a real Royal Mail account before go-live (safe now:
  unconfigured -> cron no-ops).
- The Lexical richtext in the seeder is built to spec but unproven until it hits a
  running Payload (TASK-317).
- No images seeded (none in repo) - upload logo/hero/story in the admin.
