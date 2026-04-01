## Task 100: Laravel 12 Scaffold on PHP 8.5 with Statamic 6
**Phase:** 1 | **Agent:** backend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** none

### Context
Foundation task. Every other backend task depends on a working Laravel 12 + Statamic 6 installation. This sets up the project skeleton, directory layout, environment configuration, and confirms PHP 8.5 compatibility.

### What Needs Doing
1. Create a fresh Laravel 12 project using Composer
2. Require `statamic/cms` v6 and run its installer
3. Configure Blade as the template engine (not Antlers) - set `STATAMIC_THEMING_VIEWS_ENABLED=true` and disable Antlers in config
4. Configure `.env` for Railway deployment: `DB_CONNECTION=sqlite`, `DB_DATABASE=/data/database.sqlite`
5. Set up the Dockerfile (PHP 8.5, required extensions: `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `curl`). Pin SQLite to 3.52.0+ in the image
6. Mount Railway persistent volume at `/data` in Dockerfile / `railway.toml`
7. Add `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ROYAL_MAIL_API_KEY` to `.env.example`
8. Confirm `php artisan serve` boots without errors and Statamic control panel loads at `/cp`
9. Commit initial scaffold

### Files
- `composer.json`
- `Dockerfile`
- `railway.toml`
- `.env.example`
- `config/statamic/system.php` (Blade config)
- `config/database.php`

### How to Test
- `composer install` succeeds with no deprecation warnings on PHP 8.5
- `php artisan serve` boots; HTTP 200 on `/`
- Statamic control panel accessible at `/cp` after creating first admin user
- SQLite database file created at configured path

### Unexpected Outcomes
- Statamic 6 not yet published for Laravel 12 - flag and check Statamic release timeline
- PHP 8.5 extension incompatibility with any Statamic dependency - flag specific package

### On Completion
Queue TASK-101 and TASK-112 in parallel.
