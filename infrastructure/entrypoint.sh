#!/bin/sh

# Ensure writable temp and storage directories
export TMPDIR=/tmp
mkdir -p /tmp \
    /app/storage/framework/sessions \
    /app/storage/framework/views \
    /app/storage/framework/cache \
    /app/storage/logs \
    /app/storage/statamic/stache \
    /app/storage/statamic/static-caching \
    /app/storage/app/public
chmod -R 775 /app/storage /app/bootstrap/cache
chown -R www-data:www-data /app/storage /app/bootstrap/cache

echo "[entrypoint] Starting Centrifungal..."

# -------------------------------------------------------------------------
# TASK-004: Verify persistent volume is mounted
# -------------------------------------------------------------------------
/usr/local/bin/check-volume.sh

# Ensure the /data directory exists (Railway persistent volume mount point)
mkdir -p /data
chown www-data:www-data /data

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
fi

# Run migrations (allow warnings without crashing)
echo "[entrypoint] Running migrations..."
php -d error_reporting=E_ERROR /app/artisan migrate --force 2>&1 || echo "[entrypoint] WARNING: migrations returned non-zero, continuing..."
echo "[entrypoint] Migrations complete."

# Clear any stale config cache so env var changes take effect
echo "[entrypoint] Clearing config cache..."
php -d error_reporting=E_ERROR /app/artisan config:clear 2>&1 || true
php -d error_reporting=E_ERROR /app/artisan route:clear 2>&1 || true
php -d error_reporting=E_ERROR /app/artisan view:clear 2>&1 || true

# -------------------------------------------------------------------------
# TASK-005: Start with Litestream wrapping Supervisor
# -------------------------------------------------------------------------
if [ -n "$LITESTREAM_REPLICA_URL" ] && [ -n "$R2_ACCESS_KEY_ID" ]; then
    echo "[entrypoint] Starting Litestream replication + Supervisor (PHP-FPM + Nginx)..."
    exec litestream replicate -config /etc/litestream.yml -exec "supervisord -n -c /etc/supervisor/conf.d/supervisord.conf"
else
    echo "[entrypoint] Litestream not configured - starting Supervisor directly (PHP-FPM + Nginx)..."
    exec supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
fi
