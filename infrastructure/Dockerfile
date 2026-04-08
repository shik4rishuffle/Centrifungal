# Centrifungal - Railway Deployment Container
# PHP 8.4 with FPM + Nginx on Alpine
#
# NOTE: Using php:8.4-fpm-alpine as php:8.5-fpm-alpine is not yet available
# on Docker Hub. Upgrade to 8.5-fpm-alpine when the official image is published.
# Track availability at: https://hub.docker.com/_/php/tags?name=8.5-fpm-alpine

# Stage 1: Node.js - build Vite assets for the app and Statamic CP
FROM node:22-alpine AS node-builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

# Stage 2: PHP runtime
FROM php:8.4-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    sqlite \
    sqlite-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libxml2-dev \
    curl-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    && rm -rf /var/cache/apk/*

# Ensure SQLite 3.52.0+ is installed (WAL-reset bug fix - see risk register).
# Alpine 3.21+ ships SQLite 3.47+; if your base image is older, you may need
# to compile SQLite from source to get 3.52.0+. Verify at build time:
RUN sqlite3 --version

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_sqlite \
    gd \
    bcmath \
    mbstring \
    xml \
    curl \
    zip \
    intl \
    fileinfo

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install Litestream binary (TASK-005)
# Litestream wraps the Supervisor process and continuously replicates the SQLite
# WAL to Cloudflare R2. Config: /etc/litestream.yml. Env vars control activation.
ARG LITESTREAM_VERSION=0.3.13
ADD https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz \
    && rm /tmp/litestream.tar.gz \
    && chmod +x /usr/local/bin/litestream

# Set working directory
WORKDIR /app

# Copy application code from backend/ directory
COPY backend/ .

# Create the /data directory and a placeholder DB so artisan commands don't fail at build time
RUN mkdir -p /data && touch /data/database.sqlite

# Install PHP dependencies (production only)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --no-scripts \
    && php artisan package:discover --ansi || true

# Copy Statamic CP assets to public/vendor/statamic/cp
# Required because composer --no-scripts skips post-install publishing,
# and public/vendor/ is gitignored so these files aren't in the repo.
# We copy directly instead of running artisan vendor:publish to avoid
# bootstrapping Laravel (which needs a DB, tmp dir, etc.) at build time.
RUN mkdir -p /app/public/vendor/statamic/cp \
    && cp -r /app/vendor/statamic/cms/resources/dist/* /app/public/vendor/statamic/cp/

# Copy infrastructure config files
COPY infrastructure/nginx.conf /etc/nginx/http.d/default.conf
COPY infrastructure/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infrastructure/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY infrastructure/litestream.yml /etc/litestream.yml
COPY infrastructure/check-volume.sh /usr/local/bin/check-volume.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/check-volume.sh

# PHP error display for debugging
RUN echo "display_errors = On" >> /usr/local/etc/php/conf.d/errors.ini \
    && echo "error_reporting = E_ALL" >> /usr/local/etc/php/conf.d/errors.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/conf.d/errors.ini \
    && echo "error_log = /dev/stderr" >> /usr/local/etc/php/conf.d/errors.ini

# Set correct permissions
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache /data \
    && chmod -R 775 /app/storage /app/bootstrap/cache \
    && mkdir -p /tmp && chmod 1777 /tmp

# Expose Railway's expected port
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
