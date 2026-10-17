# TASK-317 - Seed Plan (PLAN ONLY, not executed)

Goal: run `scripts/cms/seed.mjs` against the live Payload CMS on the dev VPS, and
validate the result. This document is the plan; nothing on the box was mutated
to produce it (all recon below is read-only: `docker ps`, `docker inspect`,
`docker exec ... wget -qO- <GET>`, `ls`, `grep`).

## 1. Confirmed live state (recon results, corrections to the handover noted)

- `payload-centrifungal` container: **Up, healthy** (47h uptime at time of recon),
  image `centrifungal-payload-centrifungal`, node v22.14.0 inside.
- Container networks: `backend` and `proxy` (both external bridge networks) - confirmed
  via `docker inspect`.
- DB reachable at `skeleton-postgres:5432/payload_centrifungal` (from container env,
  value not printed here).
- Schema: 33 tables, migration ledger has exactly `20260802_124327_initial` at batch 1
  (matches `agents/cms-migration-output.md`).
- **Clean slate confirmed live** via unauthenticated GET (Pages/ProductCategories have
  `read: () => true`, no auth needed for reads):
  - `GET /api/product-categories?limit=1` -> `totalDocs: 0`
  - `GET /api/pages?limit=1` -> `totalDocs: 0`
  - `GET /api/globals/site-settings` -> `navLinks: []` (unpopulated / default shape)
- **Correction to handover's claimed `.env` path:** the handover says the API key was
  placed in "the client `.env` on the box" without giving an exact path, and this
  task's brief guessed `/srv/skeleton/build/centrifungal/.env`. That file **does not
  exist** (`ls` -> No such file or directory). The actual client env used by the
  running `payload-centrifungal` stack is **`/srv/skeleton/clients/centrifungal/.env`**
  (mode 600, last modified today). Confirmed `PAYLOAD_API_KEY=` line is present and
  **non-empty** (36 chars - key value itself was never printed or echoed).
  - `/srv/skeleton/build/centrifungal/` is a **different, currently-undeployed** stack:
    the storefront (`backend-centrifungal` + `static-centrifungal` from
    `docker-compose.yml` there). Those containers are NOT running (only
    `payload-centrifungal` is up). Its `.env.example` references `PAYLOAD_API_KEY` for
    the checkout backend, but no real `.env` has been created there yet - that's
    TASK-318 territory, out of scope here.
- `scripts/cms/seed.mjs` is already present on the box at
  `/srv/skeleton/build/centrifungal/scripts/cms/seed.mjs` (byte-identical header
  confirmed), rsync'd there during an earlier task. It is **not** inside the
  `payload-centrifungal` container filesystem (`/app` has no `scripts/` dir there).
- Users collection: `slug: 'users'`, `auth.useAPIKey: true` - confirms the seeder's
  `Authorization: users API-Key <key>` header format is correct for this schema.
- No `psql` client available on the box or in the container (only `wget`/`node` inside
  the container; no `curl` inside the container either, but `wget` is present and
  sufficient for GET checks). SQL validation below therefore goes via
  `docker exec ... psql`-less route: use Payload's own admin/API instead of raw SQL,
  OR run a one-off `node:22-alpine` container attached to the `backend` network with a
  `pg` client if raw SQL is truly wanted (not needed - API checks are equivalent and
  simpler; see Section 3).

## 2. Exact seed-run command, where, key sourcing, TLS handling

**Preferred approach: run *inside* the `payload-centrifungal` container itself**, not
just "on the docker network" - since the seed script only needs HTTP(S) access to the
API, and the container already has node 22 + can reach itself on `localhost:3000` with
zero TLS involved (no cert chain to satisfy at all, not even an internal one). This is
simpler than spinning up a sibling container on the `backend` network and is lower-risk
(no extra container to clean up, no image pull).

Steps (to run in the execution phase, not now):

1. Copy the seed script into the container (read-only source, one-shot copy, not part
   of the image):
   ```
   docker cp /srv/skeleton/build/centrifungal/scripts/cms/seed.mjs \
     payload-centrifungal:/tmp/seed.mjs
   ```
   (Or `docker cp` straight from a freshly-pulled repo checkout on the box if the
   rsync'd copy is ever suspected stale - diff first: `diff <(docker exec
   payload-centrifungal cat /tmp/seed.mjs) scripts/cms/seed.mjs` after copy, or just
   `md5sum` both before running.)

2. Source the API key from the **actual** client env file (corrected path) on the host,
   without ever putting the literal value on a command line or in output:
   ```
   set -a
   . /srv/skeleton/clients/centrifungal/.env
   set +a
   ```
   This exports `PAYLOAD_API_KEY` (and friends) into the calling shell's environment
   only - not printed, not logged.

3. Run the seeder inside the container against the **internal HTTP URL**
   (`http://localhost:3000/api` - it's the container's own loopback, so "internal" here
   is literally local, not even a hop across the `backend` docker network):
   ```
   docker exec \
     -e PAYLOAD_API_URL=http://localhost:3000/api \
     -e PAYLOAD_API_KEY="$PAYLOAD_API_KEY" \
     payload-centrifungal node /tmp/seed.mjs
   ```
   `-e VAR="$VAR"` passes the *value* through the Docker API/exec call (visible to
   `docker inspect`/process args only transiently, not written to any file or shell
   history line - the history line contains the variable reference `"$PAYLOAD_API_KEY"`,
   not the literal secret).

4. Clean up the copied script after a successful run:
   ```
   docker exec payload-centrifungal rm -f /tmp/seed.mjs
   ```

**Why this beats a sibling container on the `backend` network:** no extra container
lifecycle to manage, no image pull needed (node already inside), no risk of the sibling
container failing to resolve `payload-centrifungal` due to network-attach ordering, and
the loopback route has strictly fewer moving parts than a cross-container Docker DNS
hop. Both are TLS-free, so either satisfies the "no cert validation" requirement.

**Fallback (only if `docker cp`/`docker exec` into the CMS container is blocked for
some reason, e.g. read-only container hardening added later):** run the seeder from
the box's own shell (which has node - not yet confirmed, would need `node --version`
check on the deploy user's shell) against the **public** HTTPS URL, with the TLS
staging-cert bypass passed **inline, on the box, never committed**:
```
set -a; . /srv/skeleton/clients/centrifungal/.env; set +a
NODE_TLS_REJECT_UNAUTHORIZED=0 \
PAYLOAD_API_URL=https://cms-centrifungal.dev.skeleton-crew.co.uk/api \
PAYLOAD_API_KEY="$PAYLOAD_API_KEY" \
node /srv/skeleton/build/centrifungal/scripts/cms/seed.mjs
```
This is strictly worse: it disables TLS verification for the whole Node process
(broader blast radius than "just this one internal call"), and it's an easy copy-paste
mistake to leave `NODE_TLS_REJECT_UNAUTHORIZED=0` in a shared shell profile or a
committed helper script. Only use it if the in-container route is unavailable, and only
as a one-shot inline env var, never persisted anywhere.

## 3. Validation steps (exact commands)

All via the container's own `wget` (no auth needed - reads are public) or authenticated
GETs where the collection/global requires it. Run after the seed:

```
docker exec payload-centrifungal sh -c \
  'wget -qO- "http://localhost:3000/api/product-categories?limit=10"'
# expect: totalDocs: 4, slugs = grow-logs, colonised-dowels, diy-kits, tinctures

docker exec payload-centrifungal sh -c \
  'wget -qO- "http://localhost:3000/api/globals/site-settings"'
# expect: navLinks.length === 6, siteName === "Centrifungal", heroTitle present

docker exec payload-centrifungal sh -c \
  'wget -qO- "http://localhost:3000/api/pages?limit=10"'
# expect: totalDocs: 4, slugs = about, contact, faq, care-instructions
```

If a raw-SQL cross-check is wanted in addition to the API checks (belt-and-braces,
since the API is Payload's own read path and could theoretically mask a write-side
issue): spin up a throwaway `postgres:16-alpine` (client-only, not a server) attached
to the `backend` network:
```
docker run --rm -it --network backend postgres:16-alpine \
  psql "$DATABASE_URI" -c \
  "SELECT count(*) FROM product_categories; SELECT count(*) FROM pages; SELECT count(*) FROM site_settings;"
```
(`DATABASE_URI` sourced the same env-file way, never printed). Not required for
acceptance - the API checks above are sufficient and exercise the actual path the
storefront will use - but available if a discrepancy needs root-causing.

## 4. Idempotency proof

1. Run the seeder once (Section 2). Capture stdout - expect `+ category ...` / `+ page
   ...` / `+ site-settings populated` lines (creates).
2. Run the exact same `docker exec ... node /tmp/seed.mjs` command a second time,
   unchanged.
3. Expect stdout on the second run to show **only** skip lines: `= category ... exists,
   skip`, `= page ... exists, skip`, `= site-settings already populated, skip` - zero
   `+` lines.
4. Cross-check via the validation GETs in Section 3: `totalDocs` for
   `product-categories` and `pages` must be unchanged (4 and 4) after the second run -
   proves no duplicate rows were created, not just that the script logged "skip".

## 5. Lexical-shape verification (the actual risk this task exists to de-risk)

The seeder hand-builds Payload's Lexical `editorState` JSON for the `richText`/
`textBlock` bodies (see `text()`, `paragraph()`, `heading()`, `orderedList()`,
`richText()` builders in `scripts/cms/seed.mjs` lines 44-77). This shape has never hit
a running Payload instance. Two ways it can go wrong: Payload's field validation could
reject the POST outright (caught immediately - `apiSend` throws on non-OK status, the
seeder's `main()` will exit non-zero and the run will visibly fail), or - the more
insidious case - Payload could silently accept but **normalise/mutate** the field on
save (accepted, but not exactly what was sent), or the Lexical editor could fail to
render it in the admin UI even though the raw JSON round-trips via the API.

Verification steps (run after seeding, in order of how load-bearing each is):

1. **Round-trip via API** (proves the POST was accepted and the field readable back):
   ```
   docker exec payload-centrifungal sh -c \
     'wget -qO- "http://localhost:3000/api/pages?where[slug][equals]=care-instructions&limit=1"'
   ```
   Inspect the returned `docs[0].layout[0].body.root.children` - confirm it's non-empty
   and contains the expected structure: 1 paragraph, 1 heading (`tag: "h2"`), 1 ordered
   list with 4 list items. This is the strongest single check since
   `care-instructions` is the only page exercising all three builders
   (paragraph/heading/orderedList).
2. **FAQ block shape** (different block type, not richText at all - confirm
   `blockType: 'faqGroup'` round-trips with all 6 Q&A items intact):
   ```
   docker exec payload-centrifungal sh -c \
     'wget -qO- "http://localhost:3000/api/pages?where[slug][equals]=faq&limit=1"'
   ```
   Confirm `docs[0].layout[0].items.length === 6`.
3. **Admin UI render check (manual, needs a human/browser - flag as a follow-up, not
   blocking automated acceptance):** open
   `https://cms-centrifungal.dev.skeleton-crew.co.uk/admin/collections/pages`, open the
   `care-instructions` doc, confirm the Lexical editor renders the paragraph, `H2`
   heading, and numbered list **without an error boundary / blank editor** - this is
   the only way to catch "valid JSON, but the editor chokes on rendering it" which an
   API-only check cannot see. Recommend Flynn (or QA in TASK-319, which already covers
   editor-parity) do this as part of the very next manual step, since it's cheap and
   this task's automated GETs can't substitute for it.

**Risk if the shape is wrong:** if Payload rejects the POST, the seeder throws and
exits non-zero *before* creating a bad doc for that resource (categories seeded before
site-settings before pages, per `main()`'s order - so categories/settings would still
land even if e.g. the FAQ page's shape is bad, since pages run last). If Payload
silently accepts a malformed-but-valid-JSON shape (no reject, no obvious error), that
would only surface in the admin-UI check in step 3 above.

## 6. Risks + rollback

- **Additive/idempotent by design** - re-running is safe (Section 4). No partial-write
  risk beyond standard single-doc POSTs (each category/page/global write is a single
  Payload API call; no multi-document transaction spans a `+`/skip decision).
- **If the Lexical shape is rejected or wrong for the FAQ or Care Instructions pages**
  specifically (the only two pages with non-trivial layout beyond a single paragraph):
  the seeder throws on that POST and stops. Categories and site-settings (seeded
  earlier in `main()`) would already exist and would need no rollback - they're correct
  either way. Only the specific failing page doc (if partially created - Payload create
  calls are atomic per-document, so a rejected POST creates nothing) would need
  attention; if a doc *was* created but with a wrong/normalised shape (accepted but not
  as intended), manual deletion via the admin UI (`Pages` collection, delete the
  specific doc) is the fix, then patch the builder function in `seed.mjs` and re-run -
  idempotency means the fixed run will pick up only the missing/corrected doc, no
  cleanup of the already-good categories/settings/other-pages needed.
- **No data-loss risk to existing content** - DB is confirmed clean-slate (Section 1),
  so there is nothing to lose; worst case is deleting a bad seeded doc and re-running.
- **Secret handling risk mitigated:** the corrected `.env` path
  (`/srv/skeleton/clients/centrifungal/.env`) is now documented for future tasks
  (TASK-318 environment work will likely need the same correction) - the handover's
  path was wrong and would have caused a confusing "file not found" if followed
  literally.

---

PLAN READY — awaiting orchestrator approval
