# DevOps Output: `skeleton new --type webapp`

Implementation of a generic Dockerised web-app provisioning path for the
Skeleton Crew CLI. All work was done in an isolated working copy. Nothing on
the live VPS, `/srv/skeleton/*`, or the `SkeletonCrew` git repo was touched.

## Working-copy artifacts

- `skeleton.new` - full modified script (2140 lines; baseline `skeleton.live` was 1471).
- `templates.live/docker-compose.webapp.template.yml`
- `templates.live/Dockerfile.node`
- `templates.live/Dockerfile.python`

(All under
`/private/tmp/claude-502/-Users-flynn-Documents-GitHub-Centrifungal/50839ae1-96db-45ef-bb27-914ab17807e3/scratchpad/skeleton-work/`.)

`skeleton.live` is left pristine for diffing.

---

## What changed and where (unified `diff -u skeleton.live skeleton.new`)

Ten hunks. Old-file line ranges -> new-file line ranges (from the `@@` headers):

| # | Hunk (`@@`) | Area | Nature |
|---|-------------|------|--------|
| 1 | `-138,7 +138,21` | after `clone_or_link_payload_source` | ADD generic `clone_or_link_source` wrapper |
| 2 | `-155,9 +169,18` | `check_prerequisites` | GENERALISE - optional `kind` arg selects payload vs webapp template check |
| 3 | `-259,26 +282,52` | `cmd_new_usage` | UPDATE usage text (document `--type`) |
| 4 | `-309,6 +358,12` | `cmd_new` arg loop | ADD `--type` parse + webapp handoff |
| 5 | `-736,7 +791,577` | between `cmd_new` and `cmd_deploy` | ADD `cmd_webapp_new` (new function) |
| 6-9 | `-1257..-1361 +1882..+2031` | `cmd_destroy` | GENERALISE - webapp-aware teardown |
| 10 | `-1460,7 +2129,7` | main dispatch help | UPDATE `new` help line |

New / changed function locations in `skeleton.new`:

- `clone_or_link_source()` - line 145 (thin generic wrapper over the existing
  `clone_or_link_payload_source`, which is not payload-specific).
- `check_prerequisites()` - line 149 (now takes an optional first arg;
  default `payload` keeps every existing caller byte-for-byte identical).
- `cmd_new()` - line 303 (added `--type` cases to the arg loop and a
  `if [ "$app_type" = "webapp" ]; then cmd_webapp_new "$subpath"; return; fi`
  handoff before `check_prerequisites`; the Payload flow below is unchanged).
- `cmd_webapp_new()` - lines 795-1363 (entirely new).
- `cmd_destroy()` - line 1867 (detects a webapp client via `APP_SLUG` in its
  `.env` and tears down `webapp-<slug>`, drops the DB/role parsed from
  `DATABASE_URL` when present, and skips the Payload-only media volume; the
  Payload branch is preserved).

### Payload-path safety

Every removed line belongs to the reshaped `check_prerequisites`,
`cmd_new_usage`, `cmd_destroy`, and the dispatch help string. None touch the
Payload `cmd_new` interactive/side-effect logic. With `--type` defaulting to
`payload`, the handoff branch is skipped and the existing Payload flow runs
exactly as before. `shellcheck` code counts for the Payload path are unchanged;
the only new findings are one extra `SC2001` (the webapp domain-strip, matching
the existing Payload style) and one extra `SC2016` (the webapp `envsubst`
allow-list - the required single-quote form).

---

## New template files (full text)

### `templates.live/docker-compose.webapp.template.yml`

```yaml
# docker-compose.webapp.template.yml - per-client generic webapp template
#
# Render via:
#   envsubst '$APP_SLUG $APP_DOMAIN $APP_BUILD_CONTEXT $APP_PORT $CERT_RESOLVER' \
#       < templates/docker-compose.webapp.template.yml \
#       > clients/${APP_SLUG}/docker-compose.yml
#
# The allow-list form is REQUIRED. Without it, any literal `$$` a future
# helper might inject (Traefik regex backreferences) would be expanded by
# `envsubst` and break Compose parsing.
#
# Placeholders (5 total - all 5 must be in the allow-list above):
#   APP_SLUG           - slug of app name (container/router naming)
#   APP_DOMAIN         - {slug}.{DEV_DOMAIN} (dev) or {domain} (prod)
#   APP_BUILD_CONTEXT  - absolute path to the build context (source[/subpath])
#   APP_PORT           - internal port the app listens on
#   CERT_RESOLVER      - letsencrypt-staging (dev) or letsencrypt-prod (prod)
#
# The service attaches to BOTH proxy (Traefik-facing) and backend
# (shared-Postgres side). backend is harmless when the app has no database;
# it lets a DB-using app reach skeleton-postgres.

services:
  webapp-${APP_SLUG}:
    build:
      context: ${APP_BUILD_CONTEXT}
    container_name: webapp-${APP_SLUG}
    restart: unless-stopped
    env_file: .env
    networks:
      - proxy
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.webapp-${APP_SLUG}.rule=Host(`${APP_DOMAIN}`)"
      - "traefik.http.routers.webapp-${APP_SLUG}.entrypoints=websecure"
      - "traefik.http.routers.webapp-${APP_SLUG}.tls.certresolver=${CERT_RESOLVER}"
      - "traefik.http.services.webapp-${APP_SLUG}.loadbalancer.server.port=${APP_PORT}"

networks:
  proxy:
    external: true
  backend:
    external: true
```

### `templates.live/Dockerfile.node`

```dockerfile
# Dockerfile.node - scaffolded by 'skeleton new --type webapp' for Node apps.
# The port and start-command placeholders below are filled in via sed when the
# file is scaffolded into a client build context.
FROM node:20-alpine

WORKDIR /app

# Copy manifest(s) first for better layer caching.
COPY package*.json ./

# Prefer a reproducible install; fall back when there is no lockfile.
RUN npm ci --omit=dev || npm install --omit=dev

# Copy the rest of the application source.
COPY . .

ENV NODE_ENV=production

EXPOSE __APP_PORT__

CMD ["sh","-c","__START_CMD__"]
```

### `templates.live/Dockerfile.python`

```dockerfile
# Dockerfile.python - scaffolded by 'skeleton new --type webapp' for Python apps.
# The port and start-command placeholders below are filled in via sed when the
# file is scaffolded into a client build context.
FROM python:3.12-slim

WORKDIR /app

# Copy requirements first for better layer caching.
COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source.
COPY . .

EXPOSE __APP_PORT__

CMD ["sh","-c","__START_CMD__"]
```

The literal tokens `__APP_PORT__` and `__START_CMD__` are replaced with `sed`
at scaffold time. The start command is escaped for sed replacement
metacharacters (`&`, `/`, `\`) so commands like `node server.js && echo /done`
survive intact.

---

## Verification

### `bash -n`

```
$ bash -n skeleton.new
SYNTAX OK
```

### shellcheck (0.11.0, installed via Homebrew for this task)

Baseline `skeleton.live` and the new `skeleton.new` were both linted with
`shellcheck -s bash`. Delta introduced by this change:

- `SC2016` x1 - the webapp `envsubst` single-quote allow-list. INTENTIONAL and
  required (double quotes would let the shell expand the vars before envsubst
  and would break any future `$$` backrefs). The existing Payload `envsubst`
  lines already carry the same finding.
- `SC2001` x1 - `domain=$(echo "$domain" | sed 's|^https\?://||')` in the
  webapp prod-domain branch. Deliberately mirrors the identical, pre-existing
  Payload/promote lines for stylistic consistency.

Pre-existing findings unchanged: `SC1091` x4 (dynamic `source` of client
`.env`, already `# shellcheck disable`-commented in context), `SC2001` x2,
`SC2016` x2. No `SC2034` or other new warning classes were introduced (an
earlier unused-var finding was removed by trimming the destroy pre-declare to
only the webapp keys actually read).

### Functional dry-runs (stubbed docker/postgres/curl)

All paths were exercised end-to-end with an arg-aware `docker` stub, a `curl`
stub, and a stub `postgres/.env`:

1. Scaffold path - local source with no Dockerfile, node stack, port 4242, no
   DB, one extra env var. Result: client dir, `.env` (with `PORT=4242`,
   `APP_PORT=4242`, `ANTHROPIC_API_KEY=...`, no `DATABASE_URL`), scaffolded
   `Dockerfile` (`EXPOSE 4242`, `CMD ["sh","-c","npm start"]`), rendered compose,
   container polled to `running`, routing verified. Exit 0.
2. Existing-Dockerfile + DB path - local source with a Dockerfile, DB=yes.
   Result: no scaffold ("using existing Dockerfile"), DB `webapp_<slug>` +
   role `<slug>_user` created, `DATABASE_URL` injected into `.env`, creds
   printed once. Exit 0.
3. Rollback - `docker compose up` forced to fail. Result: DB + role dropped,
   scaffolded Dockerfile removed from the source dir, client dir removed; the
   linked local source dir itself was NOT deleted (operator-owned). Clean.
4. `docker compose config`-equivalent - the rendered compose parses as valid
   YAML: one service `webapp-<slug>` on both `proxy` and `backend`, six Traefik
   labels, both networks `external: true`, no leftover `${...}`/`__TOKEN__`.
5. `--type bogus` -> `[FAIL] --type must be 'payload' or 'webapp'`; `--help`
   shows the updated usage; top-level usage line mentions `--type`.
6. `DATABASE_URL` parse in `cmd_destroy` verified against a real base64
   password containing `/` -> `db_user=oami2_user`, `db_name=webapp_oami2`.

---

## DEV-mode test plan: deploy `or-am-i-high`

`or-am-i-high` is a Node app that listens on 4242, wants `ANTHROPIC_API_KEY`,
and runs in demo mode without it. It has no database. This plan assumes the
local-path source flow (rsync onto the VPS), which is the smoothest path.

### 0. Stage the new files onto the VPS (into the live Skeleton install)

Back up the current script first, then copy in the new script and templates.
Adjust `SKEL_ROOT` to the live install path (e.g. `/srv/skeleton`).

```bash
SKEL_ROOT=/srv/skeleton
# from the working copy on your machine:
WORK=/private/tmp/claude-502/-Users-flynn-Documents-GitHub-Centrifungal/50839ae1-96db-45ef-bb27-914ab17807e3/scratchpad/skeleton-work

# backup live script (rollback point)
ssh vps "cp ${SKEL_ROOT}/skeleton ${SKEL_ROOT}/skeleton.bak.$(date +%Y%m%d-%H%M%S)"

# ship script + the three new templates (does NOT overwrite the payload template)
rsync -av "${WORK}/skeleton.new"                                      vps:${SKEL_ROOT}/skeleton
rsync -av "${WORK}/templates.live/docker-compose.webapp.template.yml" vps:${SKEL_ROOT}/templates/
rsync -av "${WORK}/templates.live/Dockerfile.node"                    vps:${SKEL_ROOT}/templates/
rsync -av "${WORK}/templates.live/Dockerfile.python"                  vps:${SKEL_ROOT}/templates/
ssh vps "chmod +x ${SKEL_ROOT}/skeleton"
```

### 1. Stage the app source on the VPS

```bash
# rsync the or-am-i-high working tree to an operator-owned path on the VPS
rsync -av --exclude node_modules --exclude .git \
    ~/path/to/or-am-i-high/  vps:/opt/sources/or-am-i-high/
```

### 2. Run the command

```bash
ssh -t vps
cd /srv/skeleton
./skeleton new --type webapp
```

Answer the prompts exactly:

| Prompt | Answer | Notes |
|--------|--------|-------|
| `Mode [1]:` | `1` | dev (staging certs, dev domain suffix) |
| `App name:` | `or-am-i-high` | slug -> `or-am-i-high` |
| `Domain [or-am-i-high.<DEV_DOMAIN>]:` | (Enter) | single domain, no cms sibling |
| `App source (git URL or absolute path):` | `/opt/sources/or-am-i-high` | absolute local path -> linked, not cloned |
| `Internal port ... [3000]:` *(if it already has a Dockerfile)* | `4242` | shown only when a Dockerfile is present |
| `Stack [1]:` *(only if NO Dockerfile)* | `1` | node |
| `Start command [npm start]:` *(only if scaffolding)* | (Enter) | or `node server.js` |
| `Internal port ... [3000]:` *(only if scaffolding)* | `4242` | |
| `Needs a database? [y/N]:` | `N` | no DB |
| `Env var (KEY=VALUE, blank to finish):` | `ANTHROPIC_API_KEY=<your-key>` | or skip for demo mode |
| `Env var (KEY=VALUE, blank to finish):` | (Enter) | finish |
| `Proceed? [Y/n]:` | `Y` | |

If `or-am-i-high` ships its own Dockerfile, the flow prints "using existing
Dockerfile" and only asks for the internal port (answer `4242`). If not, it
prompts for stack/start-command/port and scaffolds `Dockerfile.node` into
`/opt/sources/or-am-i-high/Dockerfile` (that scaffolded file is registered for
rollback and, on success, is left in place).

### 3. Verify

```bash
# container is up and not restart-looping
docker ps --filter name=webapp-or-am-i-high
docker inspect -f '{{.State.Status}} restarting={{.State.Restarting}}' webapp-or-am-i-high

# app logs (should show it listening on 4242 / demo mode)
docker logs --tail 50 webapp-or-am-i-high

# .env is 600 and carries PORT + the extra var, no DATABASE_URL
ls -l /srv/skeleton/clients/or-am-i-high/.env
sudo sed -n '1,20p' /srv/skeleton/clients/or-am-i-high/.env

# routing (staging cert -> use -k). Some apps 404 at '/', which is fine.
curl -skI https://or-am-i-high.<DEV_DOMAIN>/

# overview
./skeleton list
```

Expected: container `running` with `restarting=false`; `.env` mode 600 with
`PORT=4242` and `ANTHROPIC_API_KEY=...`; the command's own routing check prints
a 2xx/3xx (or a warn on 404, which is acceptable).

### 4. Tear down

```bash
cd /srv/skeleton
./skeleton destroy or-am-i-high
# type 'or-am-i-high' to confirm
# 'Create a backup before destroying?' -> N (no DB/volume for this app)
```

`cmd_destroy` detects the webapp client from `APP_SLUG` in its `.env`, brings
the compose project down, force-removes `webapp-or-am-i-high`, skips the
Postgres DB/role (none) and the media volume (none), and removes the client
directory. Because the source was a linked absolute path outside the client
dir, it is left untouched (a warning notes it can be removed manually):
`rm -rf /opt/sources/or-am-i-high` if you want it gone. If you scaffolded a
Dockerfile into it and want to reset the source, delete that file:
`rm -f /opt/sources/or-am-i-high/Dockerfile`.

### 5. Rollback of the CLI change itself

```bash
ssh vps "cp ${SKEL_ROOT}/skeleton.bak.<timestamp> ${SKEL_ROOT}/skeleton"
```

The three new template files are additive and can be left in place; they are
only read by the webapp flow.

---

## Notes / decisions

- `check_prerequisites` was made argument-driven rather than always checking
  both templates, so a box that only has the Payload template still runs the
  Payload flow unchanged.
- For a git-URL source the Dockerfile cannot be inspected until after clone, so
  stack/port prompting is deferred into the side-effect phase for git sources
  only; for local-path sources (the `or-am-i-high` case) it happens up front so
  the summary shows the port before you confirm.
- `env_file: .env` means the container receives every key in the client `.env`
  (including bookkeeping keys like `APP_SLUG`). None are secrets beyond
  `DATABASE_URL`/operator-supplied vars, so this is acceptable for v1; a future
  tightening could split app env from bookkeeping env.
- `cmd_list` still renders in Payload terms; making it webapp-aware was out of
  scope for this task and left untouched to avoid churn.
