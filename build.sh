#!/usr/bin/env bash
# Build the static storefront into ./public (served read-only by the nginx
# container in docker-compose.yml). Run before `skeleton deploy` / `docker compose up`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/frontend/src"
OUT="$ROOT/public"

if [ ! -d "$SRC" ]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"
cp -R "$SRC/." "$OUT/"

# Drop dev-only / non-published files from the built site.
rm -f  "$OUT/components.html" "$OUT/design-system.html" "$OUT/serve.json" "$OUT/.gitignore"
rm -rf "$OUT/data" "$OUT/js/__tests__"

echo "Built static site into $OUT ($(find "$OUT" -type f | wc -l | tr -d ' ') files)"
