#!/bin/sh
set -e

echo "[entrypoint] Starting Centrifungal..."

# Ensure the /data directory exists (Railway persistent volume mount point)
mkdir -p /data

# Create SQLite database if it does not exist
if [ ! -f /data/database.sqlite ]; then
    echo "[entrypoint] No database found at /data/database.sqlite - creating..."
    touch /data/database.sqlite
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

# Placeholder: Start Litestream as a wrapper process (TASK-005)
# In production, Litestream will wrap Supervisor so it can continuously
# replicate the SQLite database to R2. The command will look like:
#   exec litestream replicate -exec "supervisord -c /etc/supervisor/conf.d/supervisord.conf"
#
# For now, start Supervisor directly:
echo "[entrypoint] Starting Supervisor (PHP-FPM + Nginx)..."
exec supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
