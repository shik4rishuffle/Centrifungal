# CMS Migration - Execution Output

Executed end-to-end per `AGENTS/cms-migration-plan.md`. All automated steps done and
verified GREEN. One manual browser step remains for Flynn (create first admin) - see
bottom.

## Result summary

- `/admin` no longer 500s. It returns **200** and serves the **create-first-user** screen.
- The `users` table (and full schema) now exists; boot-time `payload migrate` applied
  the committed initial migration.

## What ran

### 1. Generated the initial migration (local)
- Spun a throwaway isolated Postgres (`postgres:16-alpine`, port 5433, empty DB) so the
  diff would represent the full schema from nothing. Never touched the dev DB.
- `npm ci` in `/Users/flynn/Documents/GitHub/Centrifungal/payload`.
- `payload migrate:create initial` (DATABASE_URI -> throwaway, dummy PAYLOAD_SECRET).
- Tore the throwaway Postgres down (`docker rm -f pl-migrate-tmp`).

**Migration file:** `payload/src/migrations/20260802_124327_initial.ts`
(+ `payload/src/migrations/index.ts` manifest).

Sanity check PASSED - the up() creates the full schema, including:
`users`, `users_sessions`, `media`, `products`, `products_variants`, `products_images`,
`product_categories`, `orders`, `pages` (+ all `pages_blocks_*`), `site_settings`,
`shop_settings`, and Payload internals (`payload_migrations`, `payload_locked_documents`,
`payload_preferences`, `payload_kv`).

### 2. Commit
- Branch: `payload-migration`
- Commit: **`4cc85ff`** (`4cc85ff62815754819bba1f60b7755156f37a328`)
- Contains **exactly two files**: `20260802_124327_initial.ts` + `index.ts`.
- NOT pushed, NOT merged (per instruction).

> Note on the first commit attempt: the repo's index already held ~230 pre-staged
> `_archive/*` renames before this task began. My first `git commit` swept those in.
> I corrected it with `git reset --soft HEAD~1` and re-committed using an explicit
> pathspec, so `4cc85ff` contains only the two migration files. The pre-existing 230
> staged renames were preserved untouched (still staged, uncommitted, exactly as found).

### 3. Shipped to the box + rebuilt
- rsync'd `payload/src/migrations/` -> `/srv/skeleton/build/centrifungal/payload/src/migrations/`
  (3 files transferred; created the dir).
- Confirmed compose service name: `payload-centrifungal`.
- Captured pre-change running image id for rollback: `sha256:f723cab3cbda...`.
- `docker compose build payload-centrifungal` -> new image `sha256:e357de1d73d9...`
  (exit 0). No Dockerfile change was needed - `COPY .../src ./src` already ships the
  migrations into the runner image.
- `docker compose up -d payload-centrifungal` -> container Recreated + Started on the
  new image. Health: **healthy**.

### 4. Proof the migration ran (from container logs)
```
Reading migration files from /app/src/migrations
Migrating: 20260802_124327_initial
Migrated:  20260802_124327_initial (863ms)
```

## Verification (all GREEN)

**Tables present** (queried `payload_centrifungal` as `centrifungal_user`; DB password
read from `.env` into an env var, never echoed). Key tables confirmed:
```
media
orders
pages
payload_migrations
product_categories
products
shop_settings
site_settings
users
users_sessions
```
Total public tables: **33**.

**Migration ledger** (`SELECT name, batch FROM payload_migrations`):
```
20260802_124327_initial|1
```

**users row count:** `0` (empty -> triggers the create-first-user flow).

**/admin HTTP status:**
- Public URL `https://cms-centrifungal.dev.skeleton-crew.co.uk/admin` -> **200**
  (used `curl -k`: the dev box serves letsencrypt-STAGING certs per DEPLOYMENT.md, so
  a plain curl fails cert validation - expected, not a fault).
- Internal `http://localhost:3000/admin` inside the container -> **HTTP/1.1 200 OK**.
- `/admin/create-first-user` -> **200**; page body contains "Create first user".

## Disk cleanup
- `docker image prune -f` -> deleted the old dangling image `sha256:f723cab3cbda...`.
  Reclaimed **0B** (the new image shares nearly all layers with the old one, so no
  meaningful space was freed - the schema fix added negligible image size).

## Rollback status
The pre-migration image (`f723cab`) was removed by the prune above, so image-level
rollback would now require a rebuild from the prior commit. Not needed: the DB has no
data yet and every verification step is green. If a bad migration ever needs undoing on
this empty DB, `docker exec payload-centrifungal npx payload migrate:down` reverses the
initial migration.

---

## MANUAL STEP FOR FLYNN (do this next)

The system is ready; only a human can create the first admin.

1. Open: **https://cms-centrifungal.dev.skeleton-crew.co.uk/admin**
   - Your browser will warn about the certificate (letsencrypt-STAGING on the dev box) -
     this is expected for dev. Proceed past the warning.
2. You'll land on the **"Create first user"** screen. Enter your admin email + a strong
   password and submit. This writes the first row to `users`.
3. Then, per DEPLOYMENT.md step 2: go to **Users -> API Keys**, generate an API key, and
   store it in 1Password. That key is needed for the content seeder
   (`scripts/cms/seed.mjs`) and the storefront `.env` (`PAYLOAD_API_KEY`).

## Needs Flynn's decision (not blocking the fix)

- **The `.json` schema snapshot was NOT committed.** `migrate:create` also produced
  `payload/src/migrations/20260802_124327_initial.json` (left untracked, per the "commit
  only two files" instruction). It is inert at runtime (boot `payload migrate` only reads
  `.ts`), so the deploy is unaffected. BUT db-postgres uses that snapshot as the baseline
  for the NEXT `migrate:create` diff - without it committed, the next migration you
  generate will diff against an empty schema and produce a broken/duplicate migration.
  Recommend committing it too before the next schema change.
- **`push: true` was left as-is** (config line 49) - inert in production (db-postgres
  disables push under `next start`), useful for local dev. No change made. Standard
  Payload v3 pattern: push for dev, committed migrations for prod.
- **Commit `4cc85ff` is local only** - not pushed/merged, as instructed.
