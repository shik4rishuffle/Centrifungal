Continue work on the Centrifungal e-commerce site (mushroom grow logs). The site is now deployed and partially working: Railway backend at centrifungal-production.up.railway.app with Statamic CMS, Netlify frontend at centrifungal.netlify.app, repo public at shik4rishuffle/Centrifungal on main branch.

Please look through `.agent/handover-notes.md` to get a full understanding of the work that's been done recently.

The last session was entirely deployment debugging. The Statamic CP at /cp is working (admin login, page editing, content management). The frontend loads pages dynamically via a Netlify proxy that forwards /api/* requests to Railway. The critical architectural change made was switching the ProductController to read directly from Statamic entries instead of Eloquent models, making the CMS the single source of truth for products. The existing SyncProductToDatabase listener at `backend/app/Listeners/SyncProductToDatabase.php` is supposed to sync Statamic product entries to the Eloquent Product/ProductVariant tables when saved, because the cart and checkout controllers still reference Eloquent variant IDs. This sync has NOT been verified on Railway and is the most important thing to check next.

The shop currently shows only one product (the test "Shiitake Grow Log" created in the CP). The frontend product listing, detail pages, and routing all work. The cart/checkout flow has not been tested end-to-end in production. The admin user is created via env vars (ADMIN_EMAIL, ADMIN_PASSWORD) in the entrypoint, with the password synced on every deploy. The entrypoint also handles migrations, stache warm, cache clearing, and file ownership (www-data for storage, content, resources directories).

Key files to understand the current state: `infrastructure/entrypoint.sh` (deployment lifecycle), `infrastructure/Dockerfile` (build), `frontend/netlify.toml` (proxy and redirects - _redirects generated at build time), `backend/app/Http/Controllers/Api/ProductController.php` (reads from Statamic), `backend/app/Listeners/SyncProductToDatabase.php` (syncs to DB for cart), `HUMAN-TASKS.md` (deployment guide for the user).

The old hardcoded admin password ($N1psyB1sh$) is still in git history (commits 456b002 and 41a94a5) and the repo is public. Statamic CP shows "Pro - Trial Mode". No tests exist. Branch protection on main is currently off at the user's request until launch.

Verify the SyncProductToDatabase listener fires correctly when products are saved in the CP on Railway, then help the user populate products and test the cart/checkout flow end-to-end.
