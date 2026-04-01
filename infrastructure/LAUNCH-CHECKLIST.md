# Launch Checklist - Centrifungal

Pre-launch verification checklist. Complete every item before going live.
The automated smoke tests cover sections 1-7. Sections 8-10 require manual steps.

Run the automated checks first:

```sh
bash infrastructure/smoke-tests.sh
```

All automated checks must show PASS before you proceed with the manual items.

---

## Pre-Launch Steps (do these before running smoke tests)

- [ ] Switch Stripe from test mode to live mode
  - In the Stripe Dashboard, toggle to "Live mode"
  - Copy the live secret key (`sk_live_*`) and publishable key (`pk_live_*`)
  - Update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in Railway environment variables
  - Update the publishable key in the Netlify frontend environment variables
  - Verify the live webhook endpoint is configured in Stripe Dashboard > Webhooks
  - Confirm the webhook signing secret is updated in Railway env vars
- [ ] Verify Royal Mail Click and Drop credentials
  - Log in to Click and Drop (https://www.royalmail.com/business/click-drop)
  - Confirm the API key in `ROYAL_MAIL_API_KEY` is active and for the correct account
  - Confirm the account has an OBA (Online Business Account) linked
- [ ] Configure DNS records (see `infrastructure/DNS_SETUP.md`)
  - Netlify: CNAME/ALIAS `@` -> `apex-loadbalancer.netlify.com`
  - Netlify: CNAME `www` -> `centrifungal.netlify.app`
  - Railway: CNAME `api` -> Railway service CNAME target
  - Wait for propagation (check with `dig centrifungal.co.uk +short`)
- [ ] Verify Litestream is replicating to R2
  - SSH into Railway container or check Railway logs for Litestream output
  - Confirm WAL frames are being written to R2 bucket
  - Check R2 bucket in Cloudflare dashboard for recent objects
- [ ] Verify the daily backup cron is set up
  - Confirm `daily-backups/` prefix in R2 bucket contains at least one object
  - Check the backup script is registered in the scheduler (`app/Console/Kernel.php` or scheduled tasks)
- [ ] Enable "Force HTTPS" in Netlify site settings
  - Netlify > Site settings > Domain management > HTTPS > Force HTTPS

---

## Section 1 - Frontend Availability

Automated - run `smoke-tests.sh`.

- [ ] `GET https://centrifungal.co.uk/` returns HTTP 200
- [ ] Homepage renders correctly in browser (no broken layout, no console errors)

---

## Section 2 - API Health Endpoint

Automated - run `smoke-tests.sh`.

- [ ] `GET https://api.centrifungal.co.uk/api/health` returns HTTP 200
- [ ] Response body contains `"status":"healthy"`
- [ ] Response body confirms `"database":"connected"`

---

## Section 3 - HTTPS Enforcement

Automated - run `smoke-tests.sh`.

- [ ] `http://centrifungal.co.uk` redirects (301 or 308) to `https://centrifungal.co.uk`
- [ ] `http://www.centrifungal.co.uk` redirects to HTTPS (manual browser check)

---

## Section 4 - Security Headers

Automated - run `smoke-tests.sh`.

**Frontend (centrifungal.co.uk)**

- [ ] `Strict-Transport-Security` present and includes `max-age=31536000`
- [ ] `X-Frame-Options: DENY` present
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `Referrer-Policy` present
- [ ] `Content-Security-Policy` present

**API (api.centrifungal.co.uk)**

- [ ] `Strict-Transport-Security` present
- [ ] `X-Frame-Options: SAMEORIGIN` present
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `Referrer-Policy` present

---

## Section 5 - Statamic Control Panel

Automated check - run `smoke-tests.sh` (verifies 200 or 302 response).

Manual check:

- [ ] Browse to `https://api.centrifungal.co.uk/cp` - redirects to login page
- [ ] Log in with the owner account
- [ ] Navigate to Collections > Pages and open a page for editing
- [ ] Make a minor edit and save - confirm save succeeds without error
- [ ] Log out cleanly

---

## Section 6 - DNS Resolution

Automated - run `smoke-tests.sh`.

- [ ] `centrifungal.co.uk` resolves to a Netlify IP or CNAME
- [ ] `www.centrifungal.co.uk` resolves
- [ ] `api.centrifungal.co.uk` resolves to the Railway CNAME target

---

## Section 7 - TLS Certificates

Automated - run `smoke-tests.sh`.

- [ ] `centrifungal.co.uk` TLS certificate is valid and not expiring within 30 days
- [ ] `api.centrifungal.co.uk` TLS certificate is valid and not expiring within 30 days

---

## Section 8 - Integrations

### 8a - Stripe

Automated (key mode check) - run `smoke-tests.sh`.

Manual check:

- [ ] `STRIPE_SECRET_KEY` starts with `sk_live_` (not `sk_test_`) in Railway
- [ ] `STRIPE_PUBLISHABLE_KEY` starts with `pk_live_` in Netlify and frontend
- [ ] In Stripe Dashboard, live mode webhook endpoint is registered for `https://api.centrifungal.co.uk/api/webhooks/stripe`
- [ ] Place a real small-value test order using a genuine card (or Stripe's test card in live mode: not applicable - use a real card for a real order, then issue a refund)
- [ ] Confirm the order appears in the Stripe Dashboard under Payments

### 8b - Royal Mail Click and Drop

Automated (credential ping) - run `smoke-tests.sh`.

Manual check:

- [ ] Log in to Click and Drop and confirm the business account is active
- [ ] After placing a test order (section 9 below), verify the order appears in Click and Drop as a shipment awaiting manifest
- [ ] Generate a test manifest and confirm label generation works

### 8c - Resend Email

Automated (API key check) - run `smoke-tests.sh`.

Manual check:

- [ ] Log in to Resend dashboard and confirm the sending domain (`centrifungal.co.uk` or a subdomain) is verified (green tick)
- [ ] Place a test order (section 9 below) and confirm the order confirmation email arrives in the inbox
- [ ] Check the email renders correctly on mobile and desktop
- [ ] Confirm the From address and reply-to are correct

---

## Section 9 - Full Order Flow

This is the most important manual check. Walk through the complete purchase journey end to end.

- [ ] Browse to `https://centrifungal.co.uk` and confirm the product listing loads
- [ ] Open a product page and verify images, description, and price display correctly
- [ ] Add a product to the cart
- [ ] Open the cart and confirm the item is listed with the correct price
- [ ] Proceed to checkout - confirm the Stripe Checkout page loads over HTTPS
- [ ] Complete checkout with a real card (or use Stripe's test card numbers if still in test mode during a pre-launch rehearsal)
- [ ] Confirm the order confirmation page displays after payment
- [ ] Confirm the order confirmation email arrives (check spam if not in inbox)
- [ ] Log in to the Statamic CP and confirm the order appears in the orders collection
- [ ] Log in to Click and Drop and confirm the order appears as a pending shipment
- [ ] Generate a shipping label in Click and Drop
- [ ] Confirm the tracking/dispatch email is sent to the customer email address

---

## Section 10 - Manual Quality Checks

### 10a - Product Management via CMS

- [ ] Log in to Statamic CP
- [ ] Create a new product: add title, description, price, stock quantity, and at least two images
- [ ] Publish the product and confirm it appears on the frontend product listing
- [ ] Edit the product description and confirm the change appears on the frontend
- [ ] Unpublish the product and confirm it disappears from the frontend listing
- [ ] Delete the test product

### 10b - Mobile Responsiveness

Check at least three pages on a real mobile device or browser DevTools mobile emulation (375px wide as a minimum):

- [ ] Homepage - layout, navigation menu, hero section
- [ ] Product listing page - grid layout, filters if any
- [ ] Individual product page - images, add-to-cart button, description
- [ ] Cart and checkout flow (Stripe Checkout is handled by Stripe and is inherently mobile-friendly)

### 10c - PageSpeed Insights

- [ ] Run PageSpeed Insights on `https://centrifungal.co.uk`: https://pagespeed.web.dev/
- [ ] Mobile score is 90 or above
- [ ] Desktop score is 90 or above
- [ ] Address any Core Web Vitals issues flagged as "Poor" before launch

### 10d - Favicon and Open Graph Tags

- [ ] Favicon appears in browser tab on `https://centrifungal.co.uk`
- [ ] View page source or use a browser extension to confirm `<meta property="og:title">` is set
- [ ] `<meta property="og:description">` is set
- [ ] `<meta property="og:image">` is set and the image URL is accessible
- [ ] Use the Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/) or https://www.opengraph.xyz/ to preview how the page appears when shared
- [ ] Confirm the Open Graph image is at least 1200x630 pixels

---

## Post-Launch Monitoring (first 48 hours)

- [ ] Monitor Railway logs for any 500 errors immediately after launch
- [ ] Monitor Netlify deploy logs and function logs
- [ ] Check Stripe Dashboard for the first real order - confirm payment captured correctly
- [ ] Confirm order confirmation email arrived for the first real customer order
- [ ] Check Click and Drop for the first real shipment
- [ ] Verify Litestream WAL frames are being replicated to R2 (check R2 bucket via Cloudflare dashboard)
- [ ] Confirm at least one daily backup lands in R2 `daily-backups/` within 24 hours of launch
- [ ] Run `smoke-tests.sh` again after 24 hours to confirm all checks still pass
- [ ] Check server response times via Netlify analytics or a tool like https://tools.pingdom.com/

---

## Sign-Off

All items above must be checked before the site is considered launch-ready.

| Item | Status | Notes |
|------|--------|-------|
| All smoke tests passing | | |
| Stripe in live mode | | |
| Royal Mail credentials verified | | |
| DNS propagated | | |
| Full order flow tested | | |
| Mobile check passed | | |
| PageSpeed score >= 90 (mobile) | | |
| Favicon and OG tags verified | | |
| First real order confirmed | | |

Launch approved by: _________________ Date: _________________
