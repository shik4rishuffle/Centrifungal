# Infrastructure - Centrifungal

Docker, Nginx, and Supervisor configuration for local development and Railway production deployment.

## Local Development with Docker

The `docker-compose.yml` builds and runs the full backend stack (PHP-FPM, Nginx, Supervisor) in a single container, matching the production environment.

### Prerequisites

- Docker and Docker Compose

### Running

From the repository root:

```bash
cd infrastructure
cp .env.example .env
# Fill in the required values in .env (at minimum APP_KEY)
docker-compose up --build
```

The application will be available at `http://localhost:8080`.

The compose file mounts `./data` as the `/data` volume inside the container, so your SQLite database persists between container restarts.

### Generating an APP_KEY

If you need to generate an app key for the `.env` file:

```bash
docker-compose exec app php artisan key:generate --show
```

Copy the output into your `.env` file.

## Production Deployment (Railway)

The backend deploys to Railway automatically on push to `main`. Railway uses the `Dockerfile` at `infrastructure/Dockerfile` and the configuration in `railway.json`.

### How it Works

1. Railway builds the Docker image from `infrastructure/Dockerfile`
2. The image includes PHP-FPM, Nginx, Supervisor, Composer dependencies, and Litestream
3. `entrypoint.sh` runs on container start - handles migrations, cache warming, and starts Supervisor
4. Supervisor manages PHP-FPM and Nginx processes
5. Litestream continuously replicates the SQLite database to Cloudflare R2

### Railway Environment Variables

Set these in the Railway dashboard:

| Variable | Description |
|---|---|
| `APP_KEY` | Laravel encryption key |
| `APP_URL` | Production URL (e.g. `https://centrifungal.com`) |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `DB_DATABASE` | `/data/database.sqlite` |
| `STRIPE_SECRET_KEY` | Stripe secret key (live mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `ROYAL_MAIL_API_KEY` | Royal Mail API key |
| `ROYAL_MAIL_API_SECRET` | Royal Mail API secret |
| `LITESTREAM_REPLICA_URL` | Cloudflare R2 bucket URL for Litestream |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `CONTACT_FORM_RECIPIENT` | Email for contact form submissions |

### SQLite Persistent Volume

Railway mounts a persistent volume at `/data`. The SQLite database at `/data/database.sqlite` survives redeploys, restarts, and container replacements. This is a first-class Railway feature.

Litestream provides continuous replication to Cloudflare R2 as a backup layer. Railway also takes automatic volume snapshots daily.

## File Reference

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-layer Docker image: PHP 8.4-FPM + Alpine, Nginx, Supervisor, Litestream, Composer dependencies |
| `docker-compose.yml` | Local development compose file with volume mount and env overrides |
| `nginx.conf` | Nginx configuration for proxying to PHP-FPM |
| `supervisord.conf` | Supervisor config managing PHP-FPM and Nginx processes |
| `entrypoint.sh` | Container entrypoint - runs migrations, caching, starts Supervisor |
| `railway.json` | Railway deployment configuration |
| `.env.example` | Production environment variable template |

## Notes

- The Dockerfile currently uses `php:8.4-fpm-alpine` because `php:8.5-fpm-alpine` is not yet available on Docker Hub. Upgrade when the official image is published.
- SQLite 3.52.0+ is required (WAL-reset bug fix). The Alpine base image includes a compatible version. The Dockerfile verifies this at build time.
- The container exposes port 8080, which is Railway's expected port.
