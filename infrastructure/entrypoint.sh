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

# Default LOG_CHANNEL to stderr for Railway visibility
if [ -z "$LOG_CHANNEL" ]; then
    export LOG_CHANNEL=stderr
    echo "[entrypoint] LOG_CHANNEL not set - defaulting to stderr for Railway"
fi

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
php -d error_reporting=E_ALL /app/artisan migrate --force 2>&1 || echo "[entrypoint] WARNING: migrations returned non-zero, continuing..."
echo "[entrypoint] Migrations complete."

# Clear any stale config cache so env var changes take effect
echo "[entrypoint] Clearing config cache..."
php -d error_reporting=E_ALL /app/artisan config:clear 2>&1 || true
php -d error_reporting=E_ALL /app/artisan route:clear 2>&1 || true
php -d error_reporting=E_ALL /app/artisan view:clear 2>&1 || true

# Create admin user from env vars if provided (set ADMIN_EMAIL + ADMIN_PASSWORD in Railway)
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
    echo "[entrypoint] Ensuring admin user exists..."
    php /app/artisan tinker --execute="
    \$user = \App\Models\User::where('email', env('ADMIN_EMAIL'))->first();
    if (!\$user) {
        \$user = \App\Models\User::create([
            'name' => env('ADMIN_NAME', 'Admin'),
            'email' => env('ADMIN_EMAIL'),
            'password' => bcrypt(env('ADMIN_PASSWORD')),
        ]);
        echo 'Admin user created.';
    } else {
        echo 'Admin user already exists.';
    }
    if (!\$user->super) {
        \$user->super = true;
        \$user->save();
        echo ' Super admin flag set.';
    }
    " 2>&1 || echo "[entrypoint] WARNING: admin user creation failed, continuing..."
else
    echo "[entrypoint] ADMIN_EMAIL/ADMIN_PASSWORD not set - skipping admin user creation."
fi

# Warm the Statamic Stache so CP first-load doesn't timeout
echo "[entrypoint] Warming Statamic Stache..."
php -d error_reporting=E_ALL /app/artisan statamic:stache:warm 2>&1 || echo "[entrypoint] WARNING: stache warm failed, continuing..."
echo "[entrypoint] Stache warm complete."

# Fix ownership after all entrypoint commands (which run as root) so PHP-FPM (www-data) can write
chown -R www-data:www-data /app/storage /app/bootstrap/cache

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
