# syntax=docker/dockerfile:1.7
# ============================================================
# Payload CMS - WaterSnail Pottery (per-client instance)
# Multi-stage build: builder compiles, runner ships lean image.
# Authored under TASK-059; see AGENTS/payload-bootstrap/task-059-plan.md.
# ============================================================

# ------------------------------------------------------------
# Stage 1: builder - install deps + run `next build`
# ------------------------------------------------------------
FROM node:22.14-alpine3.21 AS builder

# sharp's native vips binding needs build toolchain on Alpine.
RUN apk add --no-cache vips-dev python3 make g++

WORKDIR /app

# Manifest first for layer caching - reinstall only if package.json/lock changes.
COPY package.json package-lock.json ./
RUN npm ci

# Source + config for the Next/Payload build.
COPY tsconfig.json next.config.mjs ./
COPY src/ src/

RUN npm run build

# ------------------------------------------------------------
# Stage 2: runner - lean image, non-root, runtime-only deps
# ------------------------------------------------------------
FROM node:22.14-alpine3.21 AS runner

# Runtime needs the vips library (no headers) + wget for the
# Compose-level healthcheck (`wget -q --spider http://localhost:3000/api/access`).
RUN apk add --no-cache vips wget

# Non-root user - explicit UID/GID 1001 for predictable volume permissions.
RUN addgroup -S payload -g 1001 && adduser -S payload -G payload -u 1001

WORKDIR /app

# Copy build artefacts from builder, owned by the non-root user.
COPY --from=builder --chown=payload:payload /app/.next ./.next
COPY --from=builder --chown=payload:payload /app/node_modules ./node_modules
COPY --from=builder --chown=payload:payload /app/package.json ./package.json
COPY --from=builder --chown=payload:payload /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=payload:payload /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=payload:payload /app/src ./src

# Pre-create the media mount target with correct ownership so the named
# volume inherits non-root permissions on first attach.
RUN mkdir -p /app/media && chown -R payload:payload /app/media

USER payload

EXPOSE 3000

# No HEALTHCHECK directive - healthcheck is defined at the Compose layer
# (rendered by `skeleton new` in TASK-064) to keep a single source of truth.

CMD ["sh", "-c", "npx payload migrate && npm start"]
