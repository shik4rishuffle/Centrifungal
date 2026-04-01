#!/bin/sh
set -e

echo "[entrypoint] Starting Centrifungal..."

# -------------------------------------------------------------------------
# TASK-004: Verify persistent volume is mounted
# -------------------------------------------------------------------------
/usr/local/bin/check-volume.sh

# Ensure the /data directory exists (Railway persistent volume mount point)
mkdir -p /data

# Create SQLite database if it does not exist
if [ ! -f /data/database.sqlite ]; then
    echo "[entrypoint] No database found at /data/database.sqlite - creating..."

    # If Litestream is configured, try restoring from the replica first
    if [ -n "$LITESTREAM_REPLICA_URL" ] && [ -n "$R2_ACCESS_KEY_ID" ]; then
        echo "[entrypoint] Litestream is configured - attempting restore from replica..."
        if litestream restore -config /etc/litestream.yml /data/database.sqlite 2>/dev/null; then
            echo "[entrypoint] Database restored from Litestream replica."
        else
            echo "[entrypoint] No replica found or restore failed - creating fresh database."
            touch /data/database.sqlite
        fi
    else
        touch /data/database.sqlite
    fi

    chown www-data:www-data /data/database.sqlite

    echo "[entrypoint] Running migrations..."
    php /app/artisan migrate --force
    echo "[entrypoint] Migrations complete."
else
    echo "[entrypoint] Existing database found at /data/database.sqlite."

    # Run any pending migrations on startup
    echo "[entrypoint] Running pending migrations..."
    php /app/artisan migrate --force
    echo "[entrypoint] Migrations complete."
fi

# Cache configuration for production
if [ "$APP_ENV" = "production" ]; then
    echo "[entrypoint] Caching configuration for production..."
    php /app/artisan config:cache
    php /app/artisan route:cache
    php /app/artisan view:cache
fi

# -------------------------------------------------------------------------
# TASK-005: Start with Litestream wrapping Supervisor
# -------------------------------------------------------------------------
# If Litestream env vars are set, use Litestream to wrap the Supervisor process.
# Litestream will continuously replicate the SQLite WAL to the configured replica
# and will shut down gracefully when Supervisor exits.
if [ -n "$LITESTREAM_REPLICA_URL" ] && [ -n "$R2_ACCESS_KEY_ID" ]; then
    echo "[entrypoint] Starting Litestream replication + Supervisor (PHP-FPM + Nginx)..."
    exec litestream replicate -config /etc/litestream.yml -exec "supervisord -n -c /etc/supervisor/conf.d/supervisord.conf"
else
    echo "[entrypoint] Litestream not configured - starting Supervisor directly (PHP-FPM + Nginx)..."
    exec supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
fi
