## Task 003: Railway Configuration
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-001

### Context
Railway hosts the PHP backend (Laravel 12 + Statamic 6) with a persistent volume for SQLite. The Dockerfile and configuration must be correct before any backend deployment. Getting the persistent volume mount right is critical - data loss is the highest-impact risk.

### What Needs Doing
1. Create `infrastructure/Dockerfile` for the Railway service:
   - Base image: `php:8.5-fpm-alpine` (or `serversideup/php:8.5-fpm-alpine` if available - check).
   - Install required PHP extensions: `pdo_sqlite`, `sqlite3`, `gd`, `bcmath`, `mbstring`, `xml`, `curl`, `zip`.
   - Ensure SQLite version is 3.52.0+ (WAL-reset bug fix - see risk register).
   - Install Composer, run `composer install --no-dev --optimize-autoloader`.
   - Install Nginx or use a process manager (Supervisor) to run PHP-FPM + Nginx.
   - Set working directory to `/app`.
   - Copy application code.
   - Expose port 8080 (Railway convention).
2. Create `infrastructure/docker-compose.yml` for local development parity:
   - PHP service matching the Dockerfile.
   - Volume mount: `./data:/data` to simulate Railway persistent volume locally.
   - Environment variables loaded from `.env`.
3. Create `infrastructure/.env.example` documenting all required environment variables:
   - `APP_KEY`, `APP_ENV`, `APP_URL`
   - `DB_CONNECTION=sqlite`, `DB_DATABASE=/data/database.sqlite`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `ROYAL_MAIL_API_KEY`, `ROYAL_MAIL_API_SECRET`
   - `LITESTREAM_REPLICA_URL` (R2 bucket URL)
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
4. Create `infrastructure/railway.json` (or document Railway dashboard settings):
   - Volume mount: `/data` (persistent volume).
   - Health check endpoint: `/api/health`.
   - Start command: entrypoint script that starts Litestream, then PHP-FPM + Nginx.
5. Create `infrastructure/entrypoint.sh`:
   - If `/data/database.sqlite` does not exist, create it and run migrations.
   - Start Litestream as a subprocess (wrapping the main process).
   - Start PHP-FPM and Nginx.

### Files
- `infrastructure/Dockerfile` (create)
- `infrastructure/docker-compose.yml` (create)
- `infrastructure/.env.example` (create)
- `infrastructure/railway.json` (create)
- `infrastructure/entrypoint.sh` (create)

### How to Test
- `docker build -f infrastructure/Dockerfile .` completes without errors.
- `docker-compose -f infrastructure/docker-compose.yml up` starts the service.
- `php -r "echo SQLite3::version()['versionString'];"` inside the container reports 3.52.0+.
- `/data/database.sqlite` is created on first boot.
- Container exposes port 8080 and responds to HTTP requests.

### Unexpected Outcomes
- If `php:8.5-fpm-alpine` is not yet available on Docker Hub, fall back to `8.4-fpm-alpine` and flag.
- If SQLite 3.52.0+ is not available in the Alpine package repo, flag - may need to compile from source.
- If Railway's volume mount path conflicts with the container filesystem, flag immediately.

### On Completion
Queue TASK-004 (persistent volume confirmation) immediately. TASK-005 (Litestream) and TASK-006 (backup cron) depend on this.
