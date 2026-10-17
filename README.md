# Centrifungal

Mushroom grow-log e-commerce. Customers browse, add to a cart, and check out via
Stripe; the owner manages everything through the CMS. Runs on the **Skeleton Crew
platform**: a per-client Payload CMS + a static storefront + a small Node
checkout backend, behind shared Traefik with shared Postgres.

> Migrated from the original Laravel 13 + Statamic 6 stack on Railway. The old
> code is archived under `_archive/` (reversible). See `DEPLOYMENT.md` for the
> deploy runbook and the agency handbook for platform background.

## Architecture

- **`payload/`** - Payload CMS 3 (Next.js 15 + Postgres, Lexical). Products,
  categories, pages (block builder), site settings, orders. Admin at
  `cms.{domain}/admin`. Built + run by `skeleton new`.
- **`backend/`** - Node/Express API on `/api` (:3001): Stripe checkout + webhook
  -> order, contact form, Royal Mail dispatch/tracking + Stripe reconcile crons,
  Resend transactional email.
- **`frontend/src/`** - vanilla HTML/CSS/JS storefront (no framework). `build.sh`
  copies it to `public/`, served by nginx. Content hydrates from the Payload REST
  API (`cms.{domain}/api`); commerce hits the backend (`/api`, same origin).
- **`docker-compose.yml`** + **`nginx/`** - the storefront pair (backend + static)
  behind Traefik.
- **`scripts/cms/seed.mjs`** - idempotent CMS seeder (categories, site settings,
  pages).

## Tech stack

| Layer | Technology |
|---|---|
| CMS | Payload CMS 3 (Next.js 15, React 19) |
| Database | PostgreSQL 16 (shared `skeleton-postgres`, per-client DB + role) |
| Checkout/contact API | Node.js + Express |
| Payments | Stripe Checkout (redirect) |
| Email | Resend |
| Shipping | Royal Mail Click & Drop (weight-based) |
| Frontend | Vanilla HTML/CSS/JS (no build step; `build.sh` -> `public/`) |
| Reverse proxy / TLS | Traefik v3 (shared) |
| Hosting | Hetzner VPS (Skeleton Crew platform) |
| Testing | Vitest (frontend) |

## Local development

- **Payload:** `cd payload && npm install && npm run dev` (needs a Postgres and a
  `.env` - copy `payload/.env.example`). Admin at `http://localhost:3000/admin`.
- **Backend:** `cd backend && npm install && npm run dev` (copy `backend/.env.example`).
- **Frontend:** `./build.sh` then serve `public/` (e.g. `python3 -m http.server -d public 8080`).
  Add `<meta name="cms-api-base" content="http://localhost:3000/api">` and
  `<meta name="api-base-url" content="http://localhost:3001">` for local wiring,
  or point at a dev deploy.

## Deploy

See **`DEPLOYMENT.md`**. In short: `skeleton new` (Payload, pointed at the
`payload/` subdir) -> create first admin + API key -> `node scripts/cms/seed.mjs`
-> fill `.env` -> `./build.sh` -> `skeleton deploy` -> `skeleton promote` for prod.
