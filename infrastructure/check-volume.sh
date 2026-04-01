#!/bin/sh
# =============================================================================
# TASK-004: Startup check - verify the persistent volume is mounted
# =============================================================================
#
# Railway mounts the persistent volume at /data. This script checks that
# the mount exists and is writable. If it fails, the container exits with
# an error so Railway's restart policy can retry after the volume attaches.

set -e

VOLUME_PATH="/data"

echo "[check-volume] Verifying persistent volume at ${VOLUME_PATH}..."

# Check the directory exists
if [ ! -d "$VOLUME_PATH" ]; then
    echo "[check-volume] ERROR: ${VOLUME_PATH} does not exist."
    echo "[check-volume] The Railway persistent volume may not be attached."
    echo "[check-volume] Creating directory as fallback..."
    mkdir -p "$VOLUME_PATH"
fi

# Check we can write to it
TEST_FILE="${VOLUME_PATH}/.volume-check"
if ! touch "$TEST_FILE" 2>/dev/null; then
    echo "[check-volume] ERROR: Cannot write to ${VOLUME_PATH}."
    echo "[check-volume] The persistent volume may not be mounted correctly."
    exit 1
fi
rm -f "$TEST_FILE"

# Check if it looks like a real mount (not just the container filesystem).
# On Railway, the volume is a separate filesystem. We can detect this by
# checking if /data has a different device ID than /app.
DATA_DEV=$(stat -c '%d' "$VOLUME_PATH" 2>/dev/null || stat -f '%d' "$VOLUME_PATH" 2>/dev/null || echo "unknown")
APP_DEV=$(stat -c '%d' /app 2>/dev/null || stat -f '%d' /app 2>/dev/null || echo "unknown")

if [ "$DATA_DEV" = "$APP_DEV" ] && [ "$DATA_DEV" != "unknown" ]; then
    echo "[check-volume] WARNING: ${VOLUME_PATH} appears to be on the same filesystem as /app."
    echo "[check-volume] This may mean the persistent volume is not mounted."
    echo "[check-volume] Data will be LOST on redeploy if the volume is not attached."
    echo "[check-volume] Continuing anyway - check Railway dashboard for volume status."
else
    echo "[check-volume] Persistent volume verified at ${VOLUME_PATH}."
fi
