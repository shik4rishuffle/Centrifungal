# Centrifungal

Centrifungal is a mushroom grow log e-commerce site. Customers browse products, add items to a cart, and check out via Stripe. The site owner manages all content and products through the Statamic CMS control panel - no developer required for day-to-day operations.

## Architecture

The project is split into three layers:

- **Backend** - Laravel 13 + Statamic 6 (PHP 8.5), deployed to Railway. Serves the JSON API and CMS control panel.
- **Frontend** - Static HTML/CSS/JS, deployed to Netlify. API requests are proxied through Netlify to avoid CORS.
- **Infrastructure** - Docker, Nginx, and Supervisor configs for local development and Railway deployment.

External services: Stripe (payments), Resend (transactional email), Royal Mail Click & Drop (shipping), Cloudflare R2 (Litestream SQLite backups).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Laravel 13, PHP 8.5 |
| CMS | Statamic 6 (Core free tier) |
| Database | SQLite (WAL mode) on persistent volume |
| Payments | Stripe Checkout (redirect flow) |
| Email | Resend |
| Shipping | Royal Mail Click & Drop API |
| Frontend | Static HTML/CSS/JS (no build step) |
| Frontend hosting | Netlify (free tier) |
| Backend hosting | Railway (Hobby plan, ~USD 5/mo) |
| DB backup | Litestream to Cloudflare R2 |
| Testing | PHPUnit (backend), Vitest (frontend) |

## Directory Structure

```
centrifungal/
  backend/          Laravel 13 + Statamic 6 application
  frontend/         Static HTML/CSS/JS site
  infrastructure/   Dockerfile, Nginx, Supervisor, docker-compose
  agents/           Architecture plans and agent outputs
  data/             Local Docker volume mount (gitignored)
  REQUIREMENTS.md   Project scope and constraints
  BUILD_LOG.md      Build progress log
```

## Quick Start

Each layer has its own README with full setup instructions:

- [Backend README](backend/README.md) - PHP API and CMS setup
- [Frontend README](frontend/README.md) - Static site development
- [Infrastructure README](infrastructure/README.md) - Docker and deployment

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List all products |
| GET | `/api/products/categories` | List product categories |
| GET | `/api/products/{slug}` | Get a single product by slug |
| GET | `/api/cart` | Get the current cart |
| POST | `/api/cart/items` | Add an item to the cart |
| PATCH | `/api/cart/items/{id}` | Update a cart item quantity |
| DELETE | `/api/cart/items/{id}` | Remove an item from the cart |
| POST | `/api/checkout` | Create a Stripe Checkout session |
| POST | `/api/contact` | Submit the contact form |

Additionally, the backend handles a Stripe webhook at `POST /webhook/stripe` (not under `/api`).

The Statamic CMS control panel is accessible at `/cp` on the backend.

## Environments

| Environment | Backend | Frontend |
|---|---|---|
| Local development | `docker-compose up` or `php artisan serve` on port 8080/8000 | Open HTML files directly or use a local server |
| Production | Railway (auto-deploys from GitHub push to main) | Netlify (auto-deploys from GitHub push to main) |

In production, the frontend proxies `/api/*` requests to the Railway backend URL via a Netlify redirect rule. The `RAILWAY_BACKEND_URL` environment variable must be set in the Netlify UI.
