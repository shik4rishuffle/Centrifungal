# Deployment Setup - Human Tasks

Everything you need to do to get the dev site live. The code is ready - this is just wiring up the hosting services.

---

## 1. Railway (Backend API)

Railway runs the PHP/Statamic backend. It builds from the Dockerfile and gives you a public URL.

### Create the project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** > **Deploy from GitHub repo**
3. Select the **shik4rishuffle/Centrifungal** repo
4. Railway will detect the Dockerfile automatically - if it asks, point it to `infrastructure/Dockerfile`
5. Set the **Root Directory** to `/` (the Dockerfile path is relative to the repo root)

### Add a persistent volume

This is where your SQLite database lives. Without it, your data resets on every deploy.

1. Go to your service > **Settings** > **Volumes**
2. Click **Add Volume**
3. Mount path: `/data`
4. Give it a name like `centrifungal-data`

### Set environment variables

Go to your service > **Variables** and add these:

| Variable | Value | Notes |
|---|---|---|
| `APP_KEY` | (generate one - see below) | Required. Laravel encryption key |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | Never true in production |
| `APP_URL` | `https://your-service.up.railway.app` | Railway gives you this URL after first deploy |
| `DB_CONNECTION` | `sqlite` | |
| `DB_DATABASE` | `/data/database.sqlite` | Must match the volume mount |
| `STRIPE_KEY` | Your Stripe publishable key (`pk_test_...`) | From Stripe dashboard |
| `STRIPE_SECRET` | Your Stripe secret key (`sk_test_...`) | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | (skip for now) | Set up later when you add webhooks |
| `FRONTEND_URL` | `https://your-site.netlify.app` | For CORS - update after Netlify deploy |

**To generate APP_KEY:** run this locally in terminal:
```
cd backend && php artisan key:generate --show
```
Copy the output (starts with `base64:`) and paste it as the APP_KEY value.

### Raw env list (copy-paste into Railway bulk editor)

```
APP_KEY="<generate with php artisan key:generate --show>"
APP_ENV="production"
APP_DEBUG="false"
APP_URL="https://your-service.up.railway.app"
DB_CONNECTION="sqlite"
DB_DATABASE="/data/database.sqlite"
STRIPE_KEY="<pk_test_... from Stripe dashboard > API keys > Publishable key>"
STRIPE_SECRET="<sk_test_... from Stripe dashboard > API keys > Secret key (same one in backend/.env)>"
STRIPE_WEBHOOK_SECRET="<whsec_... set up later when you add webhooks>"
STATAMIC_PRO_ENABLED="true"
FRONTEND_URL="https://your-site.netlify.app"
RESEND_API_KEY=""
CONTACT_FORM_RECIPIENT=""
```

### Deploy

Railway should auto-deploy when you push to main. After the first deploy:

1. Check the deploy logs for errors
2. Visit `https://your-service.up.railway.app/api/health` - you should see `{"status":"healthy"}`
3. Copy your Railway URL - you need it for Netlify

---

## 2. Netlify (Frontend)

Netlify serves the static HTML/CSS/JS frontend and proxies API requests to Railway.

### Connect the repo

1. Go to [app.netlify.com](https://app.netlify.com) and sign in
2. Click **Add new site** > **Import an existing project** > **GitHub**
3. Select the **shik4rishuffle/Centrifungal** repo
4. Set these build settings:
   - **Base directory:** `frontend`
   - **Build command:** `echo 'No build step - static site'`
   - **Publish directory:** `frontend/src`
5. Click **Deploy site**

### Set environment variable

1. Go to **Site settings** > **Environment variables**
2. Add one variable:

| Variable | Value |
|---|---|
| `RAILWAY_BACKEND_URL` | Your Railway service URL (e.g. `centrifungal-api.up.railway.app`) |

**Important:** no `https://` prefix, no trailing slash - just the hostname.

3. Trigger a redeploy (Deploys > Trigger deploy) so Netlify picks up the variable

### Test it

1. Visit your Netlify URL
2. Check the homepage loads with products
3. Try the shop, FAQ, care instructions pages
4. Try adding something to cart and checking out (Stripe test mode)

---

## 3. Update cross-references

Now that both services are live, update each to know about the other:

1. **Railway:** update `FRONTEND_URL` to your actual Netlify URL (e.g. `https://centrifungal.netlify.app`)
2. **Railway:** update `APP_URL` to your actual Railway URL

---

## 4. Share the dev link

Send your mate the Netlify URL. That's the frontend. The Railway URL is the API - users never see it directly.

---

## Optional later

- **Custom domain:** Add your domain in Netlify (Site settings > Domain management) and set up DNS
- **Stripe webhooks:** Create a webhook in Stripe dashboard pointing to `https://your-railway-url/api/stripe/webhook`, then set `STRIPE_WEBHOOK_SECRET` in Railway
- **Resend email:** Add `RESEND_API_KEY` in Railway when you're ready for order confirmation emails
- **Litestream backups:** Set up R2 credentials in Railway for continuous SQLite replication (see `infrastructure/.env.example` for the full list)
- **CMS access:** The Statamic control panel is at `https://your-railway-url/cp` - you'll need to create an admin user first (`php artisan make:user` via Railway's console)
