# DevOps Output - TASK-316 Phase 1 (Hybrid Deploy: rsync + pre-flight + wizard answer sheet)

**Date:** 2026-08-02
**Scope:** Rsync working tree to VPS build dir, read-only pre-flight checks, extract
exact `skeleton new --subpath payload` wizard answer sheet. **No provisioning was
performed.** `./skeleton new`, `docker compose up`, `docker build`, and all other
mutating commands were NOT run. This stops after the rsync, per the approved split -
Flynn runs the interactive wizard next.

---

## 1. Rsync result

**Command run** (from local repo root, branch `payload-migration`, uncommitted
working tree):

```bash
cd /Users/flynn/Documents/GitHub/Centrifungal
rsync -avz --delete --stats \
  --exclude='.git' --exclude='node_modules' --exclude='.next' \
  --exclude='media' --exclude='.env' --exclude='_archive' \
  -e 'ssh -i ~/.ssh/id_skeleton -p 2222 -o BatchMode=yes -o ConnectTimeout=15' \
  ./ deploy@46.225.107.134:/srv/skeleton/build/centrifungal/
```

**One deviation from the baseline:** `/srv/skeleton/build/` did not exist yet, and
rsync cannot create more than one missing leading directory component, so the first
attempt failed with `mkdir "/srv/skeleton/build/centrifungal" failed: No such file or
directory`. Fixed by running `mkdir -p /srv/skeleton/build` on the VPS first (an
empty staging directory, not a client/container/DB mutation), then re-running the
exact rsync command unchanged. This is the only other command that touched the VPS
filesystem.

**Exclude cross-check against `DEPLOYMENT.md`'s repo layout** (done before running):
none of `payload/`, `backend/`, `frontend/src/`, `docker-compose.yml`, `nginx/`,
`scripts/`, `build.sh` are dropped by the excludes - confirmed by content, not just
name, after transfer (see section 2). There is no root `Dockerfile` or root
`package.json` in this repo (Payload's own `Dockerfile`/`package.json` live under
`payload/`), so those two items from the cross-check list don't apply here. No local
`.env` (secrets) files exist in the working tree - only `.env.example` templates,
which are not caught by the `--exclude='.env'` pattern and transferred intentionally
(harmless templates). `_archive/` is the retired Laravel/Statamic stack, confirmed
excluded. `public/` is gitignored but not rsync-excluded, so the pre-built static
site (from a prior local `./build.sh` run) transferred correctly.

**Result:** success.
- Files: 251 total, 213 transferred (rest were directory entries)
- Total transferred size: 1,616,227 bytes sent / 4,934 bytes received (delta-xfer,
  first sync)
- Total file size on remote: 2,886,756 bytes (~2.8 MB)
- On-disk size of the landed directory: **3.4 MB** (`du -sh`)

**Top-level listing landed at `/srv/skeleton/build/centrifungal/`:**
```
.agent/  agents/  AMENDMENTS/  backend/  BUILD_LOG.md  build.sh  data/
DEPLOYMENT.md  DESIGN_BRIEF.md  docker-compose.yml  .editorconfig  .env.example
existing-assets/  frontend/  .gitignore  HUMAN-TASKS.md  nginx/  payload/
PROJECT_BRIEF.md  public/  README.md  REQUIREMENTS.md  scripts/  TASKS/
```
Confirmed absent: `.git`, `node_modules`, `.next`, `_archive` (none landed, at any depth checked).

---

## 2. Pre-flight results

### Disk
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        38G   31G  5.5G  85% /
```
**Verdict: TIGHT, not blocking.** 5.5 GB free on the single root filesystem (which is
also Docker's data root). `docker system df` shows a large reclaimable buffer sitting
idle:
```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          29        8         14.39GB   12.37GB (85%)
Build Cache     141       0         4.169GB   4.169GB
```
~16.5 GB is reclaimable via `docker system prune` / `docker builder prune` but I did
**not** run either (mutating, out of scope, and it touches build cache/images shared
by other clients' history). The rsynced source itself is only 3.4 MB, so the rsync
posed no disk risk. The risk is at `skeleton new` build time: `npm ci` + `sharp`
native build (needs `vips-dev python3 make g++`) + `next build` inside the Docker
builder stage. Watersnail-pottery's existing Payload image build (visible in the
14.39 GB image total) suggests a single client's image layers run to roughly 1-2 GB;
5.5 GB free should clear that with margin, but it is not generous on a shared box.
**Recommendation for Flynn before running the wizard:** run `docker image prune`
and/or `docker builder prune` (not run by me) to reclaim headroom cheaply and
non-destructively - it only removes dangling images/unused build cache, not running
containers or volumes for skeleton-crew/too-do/watersnail-pottery.

### RAM
```
Mem:            3819        1186         272          14        2718        2633
              (total)     (used)      (free)    (shared)  (buff/cache) (available)
```
**Verdict: SAFE.** 2,633 MB "available" (the reclaimable metric that matters, not raw
"free") against a new footprint of `payload-centrifungal` (300-600 MB) +
`backend-centrifungal` (hard-capped at 220m via `mem_limit` in `docker-compose.yml`)
+ `static-centrifungal` (nginx:alpine, tens of MB) = roughly 600-900 MB worst case.
Comfortable headroom.

### Name-clash check
All read-only, no mutation:
- `docker ps -a` / `docker volume ls` / `docker network ls` grepped for
  `centrifungal`: **no matches** (no container, volume, or network).
- `/srv/skeleton/clients/` : no `centrifungal` subdirectory.
- Postgres, read-only queries via `docker exec skeleton-postgres psql -U payload`
  (peer/trust auth over the container's local unix socket - no password needed or
  exposed):
  - `SELECT 1 FROM pg_database WHERE datname='payload_centrifungal'` -> no rows
  - `SELECT 1 FROM pg_roles WHERE rolname='centrifungal_user'` -> no rows

  Note: the DB/role name pattern (`payload_{slug}` / `{slug}_user`) was confirmed by
  reading `slug_to_db_name()` and the DDL block in `cmd_new` (section 3) - the role
  check uses `centrifungal_user`, not `payload_centrifungal` (an earlier draft check
  used the wrong pattern for the role and was redone with the correct one above).
- **Verdict: clean, no clash on any axis.**

### Source integrity (on the VPS, post-rsync)
| Path | Status |
|---|---|
| `payload/Dockerfile` | PASS |
| `payload/package.json` (declares `"payload"`) | PASS |
| `build.sh` | PASS |
| `docker-compose.yml` | PASS |
| `nginx/default.conf` | PASS |
| `backend/` | PASS |
| `frontend/src/` | PASS |
| `scripts/cms/seed.mjs` | PASS |

All 8 checks pass. I additionally ran the platform CLI's own
`validate_payload_source()` logic by hand against the effective build context
(`/srv/skeleton/build/centrifungal/payload`) - it checks exactly `Dockerfile`
exists, `package.json` exists, and `package.json` matches `"payload"\s*:` - all
three hold, so `skeleton new --subpath payload` will pass its internal source
validation.

### `check_prerequisites` gate (runs automatically at the top of `skeleton new`, before any prompt)
| Check | Result |
|---|---|
| `docker info` reachable | OK |
| `skeleton-postgres` container health | `healthy` |
| `traefik` container status | `running` |
| `${TEMPLATES_DIR}/docker-compose.template.yml` exists | present (3,462 bytes) |

All pass - the wizard will not abort on prerequisites.

---

## 3. Wizard answer sheet - `./skeleton new --subpath payload`

Extracted directly from `/srv/skeleton/skeleton` (`cmd_new`, lines 258-517) - this is
the live script on the VPS, not the (stale) copy of the runbook. Run this from
`/srv/skeleton` on the VPS.

**Confirms the handover's claim:** yes - for an **absolute local path** source, the
Branch, Source-target-path, and Subpath prompts are all skipped. Mechanism, exactly:
- Branch prompt: only fires if the source string matches `GIT_URL_REGEX`
  (`^(git@|https?://).*\.git$|...`). An absolute path (`/srv/...`) never matches, so
  it's skipped unconditionally.
- Source-target-path prompt: same guard - for a non-git source, `source_target_path`
  is set directly to the input path (`source_target_path="$source_input"`), no prompt.
- Subpath prompt: guarded by `[ -z "$subpath" ] && [[ git url ]]` - since
  `--subpath payload` is passed on the command line, `$subpath` is already non-empty,
  so this prompt is skipped for that reason alone (it would also be skipped for the
  git-url reason being false, since the source is a local path - belt and braces).

Also confirms: for a local absolute path, `clone_or_link_payload_source()` does
**no copy and no symlink** - it just returns the token `linked_source`. The wizard's
rollback handler explicitly no-ops on this path ("operator-owned absolute path is
never touched"). **This means `/srv/skeleton/build/centrifungal/` becomes the
permanent build context** - `PAYLOAD_BUILD_CONTEXT` in the generated
`docker-compose.yml` will point straight at
`/srv/skeleton/build/centrifungal/payload`, and every future `docker compose build`
for this client rebuilds from that exact directory. It must not be deleted while the
client is live (see Rollback, section 4).

### Ordered prompts (in the order they appear; skipped prompts are noted inline)

| # | Exact prompt text | Type this | Resulting value |
|---|---|---|---|
| 1 | `Mode [1]:` | `1` (or press Enter - `1` is the default) | `mode=dev` |
| 2 | `Company name:` | `Centrifungal` | `company_name=Centrifungal`, `slug=centrifungal` (derived by `slugify()`: lowercase, spaces/underscores -> hyphens, strip non `[a-z0-9-]`, collapse/trim hyphens) |
| 3 | `Domain [centrifungal.dev.skeleton-crew.co.uk]:` | press Enter (blank) | `domain=centrifungal.dev.skeleton-crew.co.uk` (default = `{slug}.{DEV_DOMAIN}`; confirmed `DEV_DOMAIN=dev.skeleton-crew.co.uk` in `/srv/skeleton/.env`); `cms_domain=cms-centrifungal.dev.skeleton-crew.co.uk` (dev mode always uses the `cms-{slug}` prefix form, set automatically - not prompted) |
| 4 | `Admin email:` | `fdavies.freelance@gmail.com` | `admin_email=fdavies.freelance@gmail.com` |
| 5 | `Payload source (git URL or absolute path):` | `/srv/skeleton/build/centrifungal` | `source_input` = that path; not a git URL -> **branch prompt skipped**, **source-target-path prompt skipped** (`source_target_path` = same path directly) |
| - | *(Branch [main]:)* | **not shown** - source isn't a git URL | n/a |
| - | *(Source target path [...]:)* | **not shown** - source isn't a git URL | n/a |
| - | *(Subpath within repo...:)* | **not shown** - `--subpath payload` already supplied on the command line | `subpath=payload` (from the flag) -> `effective_build_context = /srv/skeleton/build/centrifungal/payload` |
| 6 | *(automatic conflict checks run here - no input needed; all 4 already verified clean in section 2: directory, container name, DB name, role name)* | - | - |
| 7 | `Proceed? [Y/n]:` | `Y` (or press Enter - default is Y) | Confirms and triggers the side-effect block |

### What happens after "Proceed?" (informational - for context on what "success" looks like; still triggered by Flynn's own Enter key, not by me)
In order: creates `/srv/skeleton/clients/centrifungal/`, writes
`/srv/skeleton/clients/centrifungal/.env` (chmod 600, contains the generated
`DB_PASSWORD` and `PAYLOAD_SECRET` in plaintext), creates
`/srv/skeleton/clients/centrifungal/public/` (empty), runs `CREATE DATABASE
payload_centrifungal`, `CREATE ROLE centrifungal_user ...`, grants + transfers
ownership, renders `/srv/skeleton/clients/centrifungal/docker-compose.yml` from the
platform template, runs `docker compose up -d` (Payload container only, **no**
`--profile frontend`), polls for `payload-centrifungal` health for up to 120s, then
curls `https://cms-centrifungal.dev.skeleton-crew.co.uk/admin` to sanity-check
Traefik routing. **The wizard prints the generated `DB_PASSWORD` and
`PAYLOAD_SECRET` to the terminal in its final summary** - Flynn should capture those
into 1Password immediately (per the handbook convention referenced in DEPLOYMENT.md).

---

## 4. Rollback

If anything about the wizard run needs to be fully reversed:

```bash
# 1. Destroy the provisioned client (container, DB, role, generated client dir).
#    Interactive: will ask you to type the slug 'centrifungal' to confirm, then
#    optionally back up first, then optionally delete the *cloned* source
#    (not relevant here - see note below).
cd /srv/skeleton && ./skeleton destroy centrifungal

# 2. Remove the rsynced build directory (skeleton destroy does NOT touch this -
#    for an absolute local path source it is explicitly a no-op in the wizard's
#    own rollback logic: "operator-owned absolute path is never touched").
rm -rf /srv/skeleton/build/centrifungal
```

What each command removes:
- `./skeleton destroy centrifungal`: stops + removes `payload-centrifungal` (and
  `static-centrifungal` if a `skeleton deploy` had happened), removes the
  `payload-centrifungal-media` named volume, drops the `centrifungal_user` Postgres
  role, drops the `payload_centrifungal` database, and deletes
  `/srv/skeleton/clients/centrifungal/` (the generated `.env` + rendered
  `docker-compose.yml` + empty `public/`). It will prompt to delete "cloned source"
  too, but since we used a local path (not a git URL), there is no separate clone to
  delete - the underlying `/srv/skeleton/build/centrifungal/` source is left alone
  either way (that's step 2, done manually).
- `rm -rf /srv/skeleton/build/centrifungal`: removes the rsynced source tree this
  task created. Fully reverses this task's one write. Nothing else on the VPS is
  touched by either command - `skeleton destroy` operates strictly on the named
  client's own resources.

If only this task's rsync needs reversing (wizard never run), step 2 alone is
sufficient and safe - `/srv/skeleton/clients/centrifungal/` doesn't exist yet, so
there is nothing for `skeleton destroy` to act on.

---

## 5. Post-wizard verification plan (for the later verify task - not run now)

Read-only checks, run over the same SSH connection, after Flynn confirms the wizard
completed:

```bash
# Container health
docker inspect --format='{{.State.Health.Status}}' payload-centrifungal   # expect: healthy
docker ps --filter name=payload-centrifungal --format '{{.Names}}\t{{.Status}}'

# Traefik routing + HTTP status
curl -sk -o /dev/null -w '%{http_code}\n' https://cms-centrifungal.dev.skeleton-crew.co.uk/admin   # expect: 200 (or 302 to a login/first-user screen)

# DB created + owned correctly (read-only, same peer-auth pattern as the pre-flight check)
docker exec skeleton-postgres psql -U payload -tAc "SELECT datname, pg_get_userbyid(datdba) FROM pg_database WHERE datname='payload_centrifungal'"
docker exec skeleton-postgres psql -U payload -tAc "SELECT rolname FROM pg_roles WHERE rolname='centrifungal_user'"

# Client dir + generated files landed as expected
ls -la /srv/skeleton/clients/centrifungal/
cat /srv/skeleton/clients/centrifungal/docker-compose.yml   # confirm PAYLOAD_BUILD_CONTEXT points at /srv/skeleton/build/centrifungal/payload

# Logs, if anything looks off
docker logs --tail 100 payload-centrifungal
```

**Important scope note for whoever runs the next phase:** `skeleton new` only starts
the `payload-centrifungal` container (Payload CMS itself). It does **not** start the
storefront (`backend-centrifungal` + `static-centrifungal` from this repo's own
`docker-compose.yml`) - that is a separate step per `DEPLOYMENT.md` step 5. See the
flag below - `DEPLOYMENT.md`'s parenthetical suggesting `skeleton deploy centrifungal`
as an equivalent alternative to `docker compose up -d --build` is not accurate as
written.

---

## 6. Flags / anomalies

1. **`/srv/skeleton/build/` didn't exist and had to be created.** Not anticipated by
   the recon or handover. Fixed with a plain `mkdir -p` (empty dir, no client/data
   impact) before re-running the exact baseline rsync unchanged. Noted above in
   section 1.

2. **DEPLOYMENT.md step 5's `(or: skeleton deploy centrifungal)` is misleading.**
   Reading `/srv/skeleton/templates/docker-compose.template.yml` (the file
   `skeleton new` renders into `/srv/skeleton/clients/centrifungal/docker-compose.yml`,
   and the same file `skeleton deploy` later runs `docker compose --profile frontend
   up -d` against) shows it defines only two services: `payload-${slug}` and a
   **generic** `static-${slug}` (plain `nginx:alpine` serving
   `${client_dir}/public`, no custom CSP/security headers, no backend/API container
   at all). This repo's own root `docker-compose.yml` is a **different, richer**
   definition - `backend-centrifungal` (Node/Express, Stripe/contact/crons) +
   `static-centrifungal` (nginx with `nginx/default.conf`'s CSP that explicitly
   allow-lists the CMS origin, clean-URL rewrites, security headers). Running
   `skeleton deploy centrifungal` would start the platform's generic static
   container against an **empty** `/srv/skeleton/clients/centrifungal/public/` (a
   directory the wizard creates fresh) - not this repo's built `public/` that just
   landed at `/srv/skeleton/build/centrifungal/public/`, and it would never start
   `backend-centrifungal` at all. The correct step-5 path is to run this repo's own
   `docker-compose.yml` directly (`cd /srv/skeleton/build/centrifungal && docker
   compose up -d --build`, after populating a client `.env` there per step 4) - not
   `skeleton deploy`. Flagging for whoever executes deploy steps 4-6 later; not
   fixed here (out of scope for this rsync/pre-flight/wizard-extraction task, and
   would require an architecture call - possibly Architect's or Flynn's, not mine to
   make unilaterally).

3. **Handover's claim about local-path prompt-skipping is CONFIRMED**, with the
   precise mechanism documented in section 3 (three independent guard clauses, not
   one).

4. **Disk headroom is tight (5.5 GB free / 85% used)** but not blocking - see
   section 2. Recommend Flynn prune reclaimable Docker space (~16.5 GB available,
   confirmed via `docker system df`) before running the wizard, as a precaution, not
   a hard requirement. Not run by me (mutating).

5. Everything else (recon-confirmed facts in the brief: no centrifungal
   container/volume/network/DB/role/client-dir, `--subpath` present on the live CLI,
   DNS wildcard resolving, shared containers healthy) re-verified cheaply and
   matched exactly - no drift found there.

---

**Local repo files referenced:** `/Users/flynn/Documents/GitHub/Centrifungal/DEPLOYMENT.md`,
`/Users/flynn/Documents/GitHub/Centrifungal/AMENDMENTS/AMENDMENT-001.md`,
`/Users/flynn/Documents/GitHub/Centrifungal/AGENTS/handover.md`,
`/Users/flynn/Documents/GitHub/Centrifungal/docker-compose.yml`,
`/Users/flynn/Documents/GitHub/Centrifungal/build.sh`,
`/Users/flynn/Documents/GitHub/Centrifungal/nginx/default.conf`,
`/Users/flynn/Documents/GitHub/Centrifungal/payload/package.json`,
`/Users/flynn/Documents/GitHub/Centrifungal/payload/Dockerfile`.

**VPS files read (read-only):** `/srv/skeleton/skeleton` (the CLI, ~1471 lines - read
in full via targeted `sed` ranges covering all of `cmd_new`, its helpers, and
`cmd_deploy`), `/srv/skeleton/templates/docker-compose.template.yml`,
`/srv/skeleton/.env` (grepped for `DEV_DOMAIN` only).
