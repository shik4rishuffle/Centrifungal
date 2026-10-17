# CMS Migration Plan - fix `/admin` 500 (`relation "users" does not exist`)

Plan-only. Nothing here has been executed. No files changed, VPS untouched.

## Root cause (confirmed, not re-derived)

`payload/src/migrations/` does not exist -> the image ships zero migrations ->
boot CMD `npx payload migrate` finds nothing to apply -> empty schema. `push: true`
(config line 49) cannot save us because `@payloadcms/db-postgres` disables push
under `next start` / `NODE_ENV=production` (config comment lines 27-30 already say so).

## Fix in one line

Generate a committed initial migration locally, rsync it into the VPS build
context, rebuild just this client's Payload image so boot-time `npx payload migrate`
creates the schema, then verify `/admin` shows create-first-admin.

---

## Resolved unknowns

### 1. Does `payload migrate:create` need a live DB? (db-postgres)

**Yes.** `@payloadcms/db-postgres` is Drizzle-backed; `migrate:create` connects to
the database, introspects the *current* schema, diffs it against the schema derived
from `payload.config.ts`, and writes the delta as SQL. It is NOT a pure
config-to-SQL generator.

What that means for us: point it at an **empty** Postgres and the diff is the
*entire* schema -> a clean full "initial" migration, exactly what we want.

**Least-privileged approach: a throwaway local Postgres in Docker.** Do NOT point
`migrate:create` at the dev DB (`payload_centrifungal`):
- We want the migration to represent the *full* schema from nothing. The dev DB may
  have partial/garbage tables from earlier `push` attempts, which would corrupt the
  diff.
- Running `migrate:create` never writes to the DB, but connecting to the shared dev
  box is needless blast radius. A local container is disposable and isolated.

`PAYLOAD_SECRET` is required only because `buildConfig` refuses to init with an empty
secret - any dummy value works for generation; it never reaches the DB.

### 2. Exact local generation sequence

Working dir: `/Users/flynn/Documents/GitHub/Centrifungal/payload`

```
# a) throwaway empty Postgres (isolated, disposable)
docker run --rm -d --name pl-migrate-tmp \
  -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload -e POSTGRES_DB=payload \
  -p 5433:5432 postgres:16-alpine
# wait a few seconds for it to accept connections

# b) install deps if not already present
cd /Users/flynn/Documents/GitHub/Centrifungal/payload
npm ci

# c) generate the initial migration against the empty DB
DATABASE_URI="postgres://payload:payload@127.0.0.1:5433/payload" \
PAYLOAD_SECRET="dummy-local-only-not-committed" \
  npx payload migrate:create initial

# d) tear the throwaway DB down
docker rm -f pl-migrate-tmp
```

Expected output files (Payload writes to the default `migrationDir` =
`payload/src/migrations`, since the config sets no override):
- `payload/src/migrations/<timestamp>_initial.ts`  (up = CREATE TABLE users, media,
  products, product_categories, orders, pages, + globals tables, enums, relations;
  down = drop)
- `payload/src/migrations/index.ts`  (the migration manifest Payload reads)

Sanity-check before committing: open the `_initial.ts` up() and confirm it contains
`CREATE TABLE ... "users"` (and the other collections). If `users` is absent, the
diff was taken against a non-empty DB - drop the throwaway, restart it, redo (c).

Note: port 5433 is used to avoid clashing with any local 5432.

### 3. Do the migration files need to be in the Docker image?

**Yes, and they already will be - no Dockerfile change required.** The Dockerfile
copies `src/` wholesale in both stages:
- builder: `COPY src/ src/` (line 24)
- runner: `COPY --from=builder --chown=payload:payload /app/src ./src` (line 48)

So once `payload/src/migrations/` exists in the build context it ships to
`/app/src/migrations` in the runner. Boot CMD `npx payload migrate` (line 61) runs
from `/app`, loads the config, resolves `migrationDir` -> `src/migrations`, finds the
initial migration, applies it. No edits to `payload/Dockerfile` needed.

### 4. Rebuild path on the VPS (this client only, not `skeleton deploy`)

`skeleton deploy` uses a generic template and is wrong here. Rebuild via the client's
own rendered compose.

From Flynn's Mac - push only the new migrations into the build context:
```
rsync -avz \
  /Users/flynn/Documents/GitHub/Centrifungal/payload/src/migrations/ \
  skeleton:/srv/skeleton/build/centrifungal/payload/src/migrations/
```
(Trailing slashes matter. This adds a new dir; nothing else in the context changes
because we are not touching the config - see the `push` note below.)

On the VPS (`ssh skeleton`):
```
cd /srv/skeleton/clients/centrifungal

# confirm the Payload service name in the rendered compose (do not assume)
docker compose config --services          # expect e.g. payload-centrifungal

# tag the current image so we can roll the container back instantly (see 6)
docker inspect --format '{{.Image}}' payload-centrifungal   # note the image id

# rebuild + restart ONLY the Payload service
docker compose build payload-centrifungal
docker compose up -d payload-centrifungal
```

Confirm the migration actually ran (do not trust the shallow wget healthcheck):
```
docker logs payload-centrifungal 2>&1 | grep -iE "migrat"
```
Expect lines like `Reading migration files ...`, `Migrating: <timestamp>_initial`,
`Migrated:  <timestamp>_initial (NNNms)`. If you instead see `No migrations to run`
with an empty schema, the migrations did not reach the image -> re-check the rsync
target path and that `docker compose build` used context
`/srv/skeleton/build/centrifungal` repointed to the `payload` subdir.

Disk watch (box ~85% full): after a confirmed-good rebuild, reclaim the old layers:
```
docker image prune -f
```
Run this only *after* verification in step 5 passes, so the previous image stays
available for rollback until then.

### 5. Verification

a) `users` table exists (password read from `.env` into an env var, never echoed):
```
docker exec \
  -e PGPASSWORD="$(grep -E '^DB_PASSWORD=' /srv/skeleton/clients/centrifungal/.env | cut -d= -f2-)" \
  skeleton-postgres \
  psql -U centrifungal_user -d payload_centrifungal -c '\dt'
```
Expect `users`, `media`, `products`, `product_categories`, `orders`, `pages`, plus
globals + `payload_migrations` (the ledger row proving migrate ran).

b) `/admin` serves the create-first-admin screen:
```
curl -sS -o /dev/null -w '%{http_code}\n' \
  https://cms-centrifungal.dev.skeleton-crew.co.uk/admin
```
Expect `200`. Then Flynn opens the URL in a browser: with an empty `users` table
Payload renders the "Create first user" form. Creating that account is the final
proof - it writes the first row to `users`.

### 6. Rollback

The DB has no real data yet (per DEPLOYMENT.md, no live orders), so rollback is cheap.

If boot fails or the schema is wrong:
- Container level: revert to the previously tagged image -
  `docker compose stop payload-centrifungal` then re-run with the old image id noted
  in step 4 (retag it and `docker compose up -d`), or just leave it stopped.
- DB level, graceful: inside the container,
  `docker exec payload-centrifungal npx payload migrate:down` (runs the down() of the
  last migration, dropping the tables it created).
- DB level, hard reset (fastest, safe because no data): drop and recreate the schema,
  then rebuild with a corrected migration -
  ```
  docker exec -e PGPASSWORD="..." skeleton-postgres \
    psql -U centrifungal_user -d payload_centrifungal \
    -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
  ```
  (Re-grant if needed: `GRANT ALL ON SCHEMA public TO centrifungal_user;`)

Fix the migration locally (regenerate against a fresh throwaway DB), rsync, rebuild.

---

## Commit

Files to commit (on branch `payload-migration`):
- `payload/src/migrations/<timestamp>_initial.ts`
- `payload/src/migrations/index.ts`

No secrets are in these files (they are schema DDL only). The dummy
`PAYLOAD_SECRET`/`DATABASE_URI` used for generation are shell-only, never written.

### Keep `push: true` or change it?

**Keep `push: true` (config line 49) as-is.** It is inert in production
(db-postgres disables push under `next start`), so it does not affect the deployed
container, which now correctly uses migrations. In local `npm run dev` it keeps the
schema-sync convenience Flynn already relies on. This is the standard Payload v3
workflow: push for local dev, committed migrations for prod. Changing it is
unnecessary and would remove a useful dev affordance. No config edit in this plan ->
the rsync in step 4 only adds the migrations dir.

(Optional future hardening, not in scope now: set `prodMigrations` / gate push behind
`NODE_ENV`, but the adapter already does the right thing, so skip.)

---

## Ordered checklist

1. Local: spin throwaway Postgres, `npm ci`, `payload migrate:create initial`, verify
   `CREATE TABLE "users"` in the up(), tear down throwaway.
2. Commit the two migration files.
3. rsync `payload/src/migrations/` -> build context.
4. VPS: confirm service name, tag current image, `docker compose build` + `up -d` the
   Payload service.
5. Grep logs for `Migrating:` / `Migrated:`.
6. Verify `\dt` shows `users` + `payload_migrations`; `curl /admin` = 200; Flynn
   creates first admin.
7. `docker image prune -f` to reclaim disk.
8. Rollback ready (image retag / migrate:down / schema reset) if any step fails.
