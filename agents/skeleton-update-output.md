# DevOps output: `skeleton update` + webapp www redirect

Edited file (working copy only):
`/private/tmp/claude-502/-Users-flynn-Documents-GitHub-Centrifungal/50839ae1-96db-45ef-bb27-914ab17807e3/scratchpad/skeleton-work/skeleton.new`

The live VPS, `/srv/skeleton/*`, and the SkeletonCrew git repo were NOT touched. All work happened in the scratchpad working copy.

Validation: `bash -n` passes. `shellcheck` reports only pre-existing info/style findings (see the shellcheck section). File grew from 2187 to 2350 lines.

---

## 1. Change summary (`diff -u`-style, with final line ranges)

Six change sites. Line numbers below are in the final edited `skeleton.new`.

### 1a. `add_www_redirect` generalised (lines 60-86)

Added a 5th parameter `prefix` (defaults to `static` for backward-compat) and threaded it through every router name, middleware name, and the sed anchor.

```diff
 add_www_redirect() {
     local compose_file="$1"
     local slug="$2"
     local domain="$3"
     local resolver="$4"
+    # Router/service prefix: 'static' for Payload frontends, 'webapp' for
+    # generic web apps. Defaults to 'static' so the original Payload callers
+    # stay byte-identical even if they omit the argument.
+    local prefix="${5:-static}"

     local labels_file
     labels_file=$(mktemp)
     cat > "$labels_file" << WWWEOF
-      - "traefik.http.routers.static-${slug}-www.rule=Host(\`www.${domain}\`)"
-      - "traefik.http.routers.static-${slug}-www.entrypoints=websecure"
-      - "traefik.http.routers.static-${slug}-www.tls.certresolver=${resolver}"
-      - "traefik.http.routers.static-${slug}-www.middlewares=static-${slug}-www-redirect"
-      - "traefik.http.middlewares.static-${slug}-www-redirect.redirectregex.regex=^https://www\\\\.(.*)"
-      - "traefik.http.middlewares.static-${slug}-www-redirect.redirectregex.replacement=https://\$\${1}"
-      - "traefik.http.middlewares.static-${slug}-www-redirect.redirectregex.permanent=true"
+      - "traefik.http.routers.${prefix}-${slug}-www.rule=Host(\`www.${domain}\`)"
+      - "traefik.http.routers.${prefix}-${slug}-www.entrypoints=websecure"
+      - "traefik.http.routers.${prefix}-${slug}-www.tls.certresolver=${resolver}"
+      - "traefik.http.routers.${prefix}-${slug}-www.middlewares=${prefix}-${slug}-www-redirect"
+      - "traefik.http.middlewares.${prefix}-${slug}-www-redirect.redirectregex.regex=^https://www\\\\.(.*)"
+      - "traefik.http.middlewares.${prefix}-${slug}-www-redirect.redirectregex.replacement=https://\$\${1}"
+      - "traefik.http.middlewares.${prefix}-${slug}-www-redirect.redirectregex.permanent=true"
 WWWEOF

-    # Insert www labels after the static service's loadbalancer label
-    sed -i "/static-${slug}\.loadbalancer\.server\.port/r ${labels_file}" "$compose_file"
+    # Insert www labels after the service's loadbalancer label
+    sed -i "/${prefix}-${slug}\.loadbalancer\.server\.port/r ${labels_file}" "$compose_file"
     rm -f "$labels_file"
 }
```

The escaping is unchanged: `\\\\.` in the heredoc renders to `\\.` in the compose file, and `\$\${1}` renders to `$${1}`. Verified output below.

### 1b. Payload call site in `cmd_new` (line 719)

```diff
-        add_www_redirect "${client_dir}/docker-compose.yml" "$slug" "$domain" "$cert_resolver"
+        add_www_redirect "${client_dir}/docker-compose.yml" "$slug" "$domain" "$cert_resolver" "static"
```

### 1c. Payload call site in `cmd_promote` (line 1672)

```diff
-    add_www_redirect "${client_dir}/docker-compose.yml" "$slug" "$new_domain" "$new_cert_resolver"
+    add_www_redirect "${client_dir}/docker-compose.yml" "$slug" "$new_domain" "$new_cert_resolver" "static"
```

Both payload call sites now pass `static` explicitly. Combined with the `${5:-static}` default this is doubly safe: the rendered labels and the sed anchor are byte-identical to the original for the Payload flow.

### 1d. `cmd_webapp_new`: prod-only www prompt (lines 886-896)

Inserted right after `print_step "Domain: ${domain}"`, before the source prompt:

```diff
     print_step "Domain: ${domain}"

+    # 3b. www -> apex redirect (prod only; dev subdomains have no www sibling)
+    local add_www=false
+    if [ "$mode" = "prod" ]; then
+        local www_confirm=""
+        read -rp "Add a www -> ${domain} redirect? [Y/n]: " www_confirm
+        www_confirm="${www_confirm:-Y}"
+        if [[ "$www_confirm" =~ ^[Yy]$ ]]; then
+            add_www=true
+        fi
+    fi
+
     # 4. Source
```

Dev mode skips the prompt entirely (no `www.` sibling on dev subdomains), so `add_www` stays `false`.

### 1e. `cmd_webapp_new`: apply the redirect after render, before build (lines 1293-1297)

Inserted between the `envsubst`/`print_step "docker-compose.yml generated"` block and step 8 (`docker compose up -d --build`):

```diff
         > "${client_dir}/docker-compose.yml"
     print_step "docker-compose.yml generated"

+    # 7b) Add www -> apex redirect labels (prod only, if the operator opted in)
+    if [ "$mode" = "prod" ] && [ "$add_www" = true ]; then
+        add_www_redirect "${client_dir}/docker-compose.yml" "$slug" "$domain" "$cert_resolver" "webapp"
+        print_step "www redirect configured (www.${domain} -> ${domain})"
+    fi
+
     # 8) Build + start the container
```

### 1f. `cmd_webapp_new`: summary note (lines 1386-1389)

```diff
     echo "  Slug: ${slug}"
     echo "  Domain: ${domain}"
+    if [ "$mode" = "prod" ] && [ "$add_www" = true ]; then
+        echo "  www redirect: www.${domain} -> ${domain}"
+    fi
     echo "  Mode: ${mode}"
     echo "  Client dir: ${client_dir}"
```

### 1g. New `cmd_update` function (lines 2187-2318) + dispatch/help wiring

- `cmd_update` function added immediately before `# --- Main Dispatch ---`.
- Dispatch case: `update) cmd_update "${2:-}" ;;` added between `destroy)` and `list)` (line 2334).
- Top-level usage string extended to `{setup|new|deploy|promote|backup|destroy|update|list}` (line 2331) and a help line added (line 2346): `update    Pull latest source and rebuild a client (payload or webapp)`.

---

## 2. New `cmd_update` function (full)

```bash
cmd_update() {
    # Unified rebuild-and-recreate for BOTH Payload and webapp clients. Pulls
    # the latest source (when the build context is a git checkout), rebuilds the
    # single service, then health-polls and routing-verifies it. Migrations are
    # NOT run explicitly: Payload runs them at container boot via its Dockerfile
    # CMD, so a recreate handles them.
    local slug="${1:-}"
    if [ -z "$slug" ]; then
        echo "Usage: skeleton update <slug>"
        print_error "A client slug is required (run 'skeleton list' to see clients)."
    fi

    local client_dir="${CLIENTS_DIR}/${slug}"
    if [ ! -d "$client_dir" ]; then
        print_error "Client '${slug}' not found - run 'skeleton list'"
    fi

    check_prerequisites

    if [ ! -f "${client_dir}/.env" ]; then
        print_error "Client .env file not found: ${client_dir}/.env"
    fi

    # Source client env (pre-declare every key so set -u is safe, like cmd_destroy).
    local APP_SLUG APP_BUILD_CONTEXT APP_DOMAIN CLIENT_DOMAIN CMS_DOMAIN PAYLOAD_BUILD_CONTEXT
    APP_SLUG="" APP_BUILD_CONTEXT="" APP_DOMAIN="" CLIENT_DOMAIN="" CMS_DOMAIN="" PAYLOAD_BUILD_CONTEXT=""
    # shellcheck disable=SC1090
    source "${client_dir}/.env"

    # Detect client type: a webapp client sets APP_SLUG in its .env.
    local kind="payload"
    local service=""
    local build_context=""
    local verify_url=""
    if [ -n "${APP_SLUG:-}" ]; then
        kind="webapp"
        service="webapp-${slug}"
        build_context="${APP_BUILD_CONTEXT}"
        verify_url="https://${APP_DOMAIN}/"
    else
        kind="payload"
        service="payload-${slug}"
        build_context="${PAYLOAD_BUILD_CONTEXT}"
        verify_url="https://${CMS_DOMAIN:-$CLIENT_DOMAIN}/admin"
    fi

    echo ""
    echo -e "${BOLD}Skeleton Crew - Update: ${slug} (${kind})${NC}"
    echo ""

    if [ -z "$build_context" ]; then
        print_error "No build context recorded in ${client_dir}/.env - cannot rebuild."
    fi
    if [ ! -d "$build_context" ]; then
        print_error "Build context ${build_context} does not exist - rebuild aborted."
    fi

    # --- Source refresh: pull latest if the build context lives in a git repo ---
    local repo_root=""
    repo_root=$(git -C "$build_context" rev-parse --show-toplevel 2>/dev/null || true)
    if [ -n "$repo_root" ]; then
        echo "Pulling latest source in ${repo_root}..."
        if git -C "$repo_root" pull --ff-only; then
            print_step "Source updated (git pull --ff-only in ${repo_root})"
        else
            print_warn "git pull --ff-only failed in ${repo_root} - rebuilding from the current checkout."
        fi
    else
        print_warn "Source is not a git checkout - rebuilding from the on-box files. rsync your local changes up first if you have any."
    fi

    # --- Rebuild + recreate ONLY this service (no frontend profile, no other services) ---
    echo ""
    echo "Rebuilding and recreating ${service} (this may take a while)..."
    if ! (cd "$client_dir" && docker compose up -d --build "$service"); then
        print_error "docker compose up -d --build ${service} failed. Check: docker compose -f ${client_dir}/docker-compose.yml logs ${service}"
    fi
    print_step "${service} rebuilt and recreated"

    # --- Health-poll: running-and-not-restarting (40 x 3s = 120s) ---
    echo ""
    echo "Waiting for the container to settle..."
    local run_attempts=0
    local container_up=false
    while [ $run_attempts -lt 40 ]; do
        local state=""
        state=$(docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null || echo "not_found")
        local restarting=""
        restarting=$(docker inspect --format='{{.State.Restarting}}' "$service" 2>/dev/null || echo "true")
        if [ "$state" = "running" ] && [ "$restarting" = "false" ]; then
            container_up=true
            echo ""
            break
        fi
        if [ "$state" = "exited" ] || [ "$state" = "dead" ]; then
            echo ""
            break
        fi
        printf "."
        run_attempts=$((run_attempts + 1))
        sleep 3
    done

    if [ "$container_up" = true ]; then
        print_step "Container is running"
    else
        print_warn "Container did not reach a stable running state within 120 seconds. Check: docker logs ${service}"
    fi

    # --- Routing verification (retry: the app may still be booting; warn-only) ---
    echo ""
    echo "Verifying Traefik routing..."
    local curl_status="000"
    local route_attempts=0
    while [ $route_attempts -lt 5 ]; do
        curl_status=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$verify_url" 2>/dev/null || echo "000")
        if [[ "$curl_status" =~ ^(2|3)[0-9][0-9]$ ]]; then
            break
        fi
        route_attempts=$((route_attempts + 1))
        sleep 3
    done
    if [[ "$curl_status" =~ ^(2|3)[0-9][0-9]$ ]]; then
        print_step "Traefik routing verified (HTTP ${curl_status})"
    else
        print_warn "Routing returned HTTP ${curl_status} - some apps 404 at '/', or DNS/certs may still be settling. Re-test with: curl -I ${verify_url}"
    fi

    # --- Summary ---
    echo ""
    echo -e "${BOLD}Update complete for ${slug}.${NC}"
    echo ""
    print_step "Rebuilt ${service} (${kind})"
    echo "  URL:  ${verify_url}"
    echo "  Logs: docker logs -f ${service}"
    echo ""
}
```

Design notes:
- Kind detection matches `cmd_destroy`/`cmd_list` exactly (a webapp client sets `APP_SLUG`).
- `check_prerequisites` is called with no argument (default `payload`), per the brief's ordering (prereqs before sourcing the .env). On the live box both compose templates exist, so this passes for webapp clients too.
- The health-poll and routing-verify blocks are copied verbatim from `cmd_webapp_new` (40x3s running/not-restarting; 5x3s curl retry, warn-only). This works for Payload too: Payload does have a healthcheck, but polling for `running` + `not restarting` is a strict subset of "healthy or at least up", so it is a safe generic check; the `/admin` routing curl still confirms the CMS is actually serving.
- No explicit migration step - Payload runs migrations at container boot (Dockerfile CMD), so `docker compose up -d --build payload-<slug>` recreates the container and migrations run on start.
- Only the single named service is rebuilt/recreated. The frontend profile is never forced, so a Payload client's `static-<slug>` container is left untouched.

---

## 3. `add_www_redirect` + both call sites

Generalised function: see section 1a for the full diff. Signature is now:

```
add_www_redirect <compose_file> <slug> <domain> <resolver> [prefix=static]
```

Call sites (three total, all now passing an explicit prefix):

- `cmd_new` (payload), line 719: `... "$cert_resolver" "static"`
- `cmd_promote` (payload), line 1672: `... "$new_cert_resolver" "static"`
- `cmd_webapp_new` (webapp, new), line 1295: `... "$cert_resolver" "webapp"`

### Rendered-output verification

Rendering the heredoc with `prefix=webapp`, `slug=demo`, `domain=demo.com`, `resolver=letsencrypt-prod` produced exactly the brief's known-good format:

```
      - "traefik.http.routers.webapp-demo-www.rule=Host(`www.demo.com`)"
      - "traefik.http.routers.webapp-demo-www.entrypoints=websecure"
      - "traefik.http.routers.webapp-demo-www.tls.certresolver=letsencrypt-prod"
      - "traefik.http.routers.webapp-demo-www.middlewares=webapp-demo-www-redirect"
      - "traefik.http.middlewares.webapp-demo-www-redirect.redirectregex.regex=^https://www\\.(.*)"
      - "traefik.http.middlewares.webapp-demo-www-redirect.redirectregex.replacement=https://$${1}"
      - "traefik.http.middlewares.webapp-demo-www-redirect.redirectregex.permanent=true"
```

`\\.` in the regex and `https://$${1}` in the replacement are byte-correct. Swapping `prefix=static` yields output identical to the original payload version.

### Anchor-match confirmation

- webapp template (`docker-compose.webapp.template.yml`, line 39) has `traefik.http.services.webapp-${APP_SLUG}.loadbalancer.server.port=${APP_PORT}`. After envsubst the new anchor `/webapp-<slug>\.loadbalancer\.server\.port/` matches it.
- payload template (`docker-compose.template.yml`) has two loadbalancer lines: `payload-` (line 48) and `static-` (line 71). The `static` prefix anchors on line 71 only, exactly as before.

Note: BSD `sed -i` on macOS could not run the end-to-end insertion locally (`sed: -I or -i may not be used with stdin`) - the script targets a Linux VPS using GNU sed. The insertion mechanism itself is unchanged from the proven payload code; only the (verified) anchor pattern and label body are parameterised.

---

## 4. `bash -n` and shellcheck results

- `bash -n skeleton.new` -> pass (no output).
- `shellcheck skeleton.new` -> only pre-existing info/style findings, none introduced by this task:
  - `SC2016` on the two `envsubst '...'` single-quoted argument lists (lines 714, 1288, 1667) - INTENTIONAL and required: `envsubst` needs the literal `$VAR` names, so they must not expand.
  - `SC1091` / `SC1090` on `source "${client_dir}/.env"` (lines 1427, 1532, 1809, 1927, and the new 2214) - the sourced file is a runtime artifact not present at lint time. The new `cmd_update` source line carries the same `# shellcheck disable=SC1090` inline comment as every existing sourcing site and behaves identically.
  - `SC2001` on three pre-existing `sed 's|^https\?://||'` protocol-strip lines (440, 876, 1554) - not touched by this task.

No new shellcheck findings originate from the added/changed code.

---

## 5. Test plan: `skeleton update or-am-i-high` (a webapp client)

Preconditions: `or-am-i-high` already exists as a webapp client (its `clients/or-am-i-high/.env` has `APP_SLUG=or-am-i-high`, `APP_BUILD_CONTEXT=...`, `APP_DOMAIN=...`). Postgres and Traefik containers healthy/running.

Rollout of the new code first (working copy -> box): copy the edited `skeleton.new` over the live `skeleton` on the VPS (operator's normal box-promotion step - out of scope here). Confirm rollout with:
- `skeleton` (no args) -> the usage block now lists `update` in `{...|destroy|update|list}` and shows the `update    Pull latest source and rebuild a client (payload or webapp)` help line.
- `grep -n 'cmd_update' /path/to/skeleton` -> function + dispatch present.

Step-by-step expected behaviour of `skeleton update or-am-i-high`:

1. Arg present, `clients/or-am-i-high/` exists -> no error. (Negative check: `skeleton update` with no slug prints the usage line then `[FAIL] A client slug is required...`; `skeleton update nope` prints `[FAIL] Client 'nope' not found - run 'skeleton list'`.)
2. `check_prerequisites` -> passes silently if Docker/Postgres/Traefik are up; otherwise a clear `[FAIL]`.
3. `.env` sourced. `APP_SLUG` is set -> header prints `Skeleton Crew - Update: or-am-i-high (webapp)`. `service=webapp-or-am-i-high`, `verify_url=https://<APP_DOMAIN>/`.
4. Build-context guards: if `APP_BUILD_CONTEXT` is empty or missing on disk, a `[FAIL]` before any rebuild.
5. Source refresh:
   - If the build context is inside a git checkout -> `Pulling latest source in <repo_root>...` then either `[ok] Source updated (git pull --ff-only in <repo_root>)` or, on a non-fast-forward/dirty tree, `[warn] git pull --ff-only failed ... - rebuilding from the current checkout.` (continues, does not abort).
   - If it is an rsync'd local path (no `.git`) -> `[warn] Source is not a git checkout - rebuilding from the on-box files. rsync your local changes up first if you have any.`
6. `Rebuilding and recreating webapp-or-am-i-high ...` -> `docker compose up -d --build webapp-or-am-i-high` runs in the client dir. Only that service is rebuilt; no other container is touched. On failure -> `[FAIL]` with the `docker compose ... logs` hint.
7. Health-poll (up to 120s): prints dots, then `[ok] Container is running` once the container is `running` and not `restarting`; `[warn]` with a `docker logs` hint if it crash-loops or never settles.
8. Routing verify (5x3s): `[ok] Traefik routing verified (HTTP 2xx/3xx)`, or `[warn] Routing returned HTTP <code> - some apps 404 at '/'...` (warn-only; some webapps legitimately 404 at `/`).
9. Summary: `Update complete for or-am-i-high.`, `[ok] Rebuilt webapp-or-am-i-high (webapp)`, `URL: https://<APP_DOMAIN>/`, `Logs: docker logs -f webapp-or-am-i-high`.

How to confirm the new code actually rolled out and ran:
- Before/after image id: `docker inspect --format '{{.Image}}' webapp-or-am-i-high` should change after a real code update (new build layer).
- `docker inspect --format '{{.State.StartedAt}}' webapp-or-am-i-high` should show a fresh timestamp (container recreated).
- `git -C <APP_BUILD_CONTEXT> log -1 --oneline` (if a git checkout) should show the pulled-latest commit that the rebuild used.
- `docker logs -f webapp-or-am-i-high` to watch boot, then `curl -I https://<APP_DOMAIN>/` for the live response.

Regression checks to run alongside:
- `skeleton update <a-payload-slug>` -> header shows `(payload)`, `service=payload-<slug>`, verify URL `https://<CMS_DOMAIN>/admin`; only `payload-<slug>` is recreated, `static-<slug>` is left as-is; Payload migrations run at boot.
- A fresh `skeleton new` (payload, prod) and `skeleton promote` still render an identical `static-<slug>-www` redirect block (byte-for-byte), confirming the `static` default/explicit-arg path is unchanged.
- `skeleton new --type webapp` in prod now prompts `Add a www -> <domain> redirect? [Y/n]:`; answering Y inserts the `webapp-<slug>-www` labels and the summary shows `www redirect: www.<domain> -> <domain>`; dev mode never prompts.

---

OUTPUT READY -- AGENTS/skeleton-update-output.md
