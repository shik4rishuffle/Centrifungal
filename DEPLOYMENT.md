# Centrifungal - Deployment

Centrifungal now runs on the Skeleton Crew platform: a per-client **Payload CMS**
container + a **static storefront** (nginx) + a small **Node checkout/contact
backend**, all behind shared Traefik and using the shared Postgres. See the
agency handbook (`SkeletonCrewShit/business shit/skeleton-crew-handbook.md`) for
platform background.

## Repo layout

- `payload/` - Payload CMS 3 app (built + run by `skeleton new`). Root `Dockerfile`
  + `package.json` (declares `payload`); listens on :3000, serves `/admin`.
- `backend/` - Node/Express API (Stripe checkout + webhook, contact, Royal Mail +
  reconcile crons, Resend email). Listens on :3001, `/api/*`.
- `frontend/src/` - vanilla HTML/CSS/JS storefront (source). `build.sh` copies it to
  `public/`, which the nginx container serves.
- `docker-compose.yml` - the storefront pair (backend + static nginx) behind Traefik.
- `nginx/default.conf` - static server: security headers, CSP (allows the CMS
  origin), clean URLs, `/product/{slug}` rewrite.
- `scripts/cms/seed.mjs` - idempotent CMS seeder (categories, SiteSettings, pages).

## First deploy (dev)

Run on the VPS (`ssh` in, `cd /srv/skeleton`):

1. **Provision the CMS.** The Payload app lives in the `payload/` subdir, and the
   shipped `skeleton` CLI validates the source root - so point it at the subdir
   with an absolute path (the `--subpath` flag is not in the shipped CLI yet; see
   the handbook's doc-drift note):
   ```
   ./skeleton new
   #   mode: dev
   #   company name: Centrifungal   (slug -> centrifungal)
   #   admin email: <you>
   #   Payload source: /srv/skeleton/clients/centrifungal/... OR a local clone's
   #                   absolute path to the repo's payload/ directory
   ```
   This creates the `payload_centrifungal` DB + role, generates `PAYLOAD_SECRET`,
   and boots `payload-centrifungal` at `cms-centrifungal.dev.skeleton-crew.co.uk`.

2. **First admin + API key.** Open `https://cms-centrifungal.dev.skeleton-crew.co.uk/admin`,
   create the first admin, then Users -> API Keys -> generate one (store in 1Password).

3. **Seed content.**
   ```
   PAYLOAD_API_URL=https://cms-centrifungal.dev.skeleton-crew.co.uk/api \
   PAYLOAD_API_KEY=<key> node scripts/cms/seed.mjs
   ```

4. **Storefront env.** In the client dir, `cp .env.example .env` and fill in:
   Stripe test keys + webhook secret, `RESEND_API_KEY`, `PAYLOAD_API_KEY` (same
   key), `CLIENT_DOMAIN`, `CERT_RESOLVER=letsencrypt-staging`. Point the Stripe
   dashboard webhook at `https://<CLIENT_DOMAIN>/api/webhooks/stripe`.

5. **Build + deploy the storefront.**
   ```
   ./build.sh                      # frontend/src -> public/
   docker compose up -d --build    # (or: skeleton deploy centrifungal)
   ```

6. **Verify:** `curl https://<CLIENT_DOMAIN>/api/health`, load the site, place a
   Stripe test order, confirm the order + emails, run the accessibility audit.

## Promote to production

Point DNS (A records: `centrifungal.co.uk`, `cms.centrifungal.co.uk`, optional
`www`) at the VPS, then `./skeleton promote centrifungal`. Swap `.env` to live
Stripe keys, `CERT_RESOLVER=letsencrypt-prod`, `CLIENT_DOMAIN=centrifungal.co.uk`,
`SITE_URL=https://centrifungal.co.uk`, re-point the Stripe webhook, rebuild.
Remove the `X-Robots-Tag "noindex"` line from `nginx/default.conf` at launch.

> Shared-infra gate: per the agency's paid-client rule, production for a client
> with real orders needs offsite Postgres backups + per-client disk quotas in
> place. Centrifungal has no live data yet, so dev/staging is unblocked.
