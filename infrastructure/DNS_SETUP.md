# DNS and Domain Setup - centrifungal.co.uk

## Overview

The Centrifungal site uses a split architecture:

- **Frontend** (Netlify): `centrifungal.co.uk` and `www.centrifungal.co.uk`
- **Backend API** (Railway): `api.centrifungal.co.uk`

Both platforms handle SSL certificates automatically via Let's Encrypt.

## DNS Records

Add these records at your domain registrar or DNS provider (e.g. Cloudflare DNS).

### Frontend - Netlify

| Type | Name | Value | TTL | Notes |
|-------|------|-------|-----|-------|
| CNAME | `@` (root) | `apex-loadbalancer.netlify.com` | Auto | Some registrars don't support CNAME on root - use Netlify DNS or an ALIAS record instead |
| CNAME | `www` | `centrifungal.netlify.app` | Auto | Redirect or serve from www |

If your DNS provider supports ALIAS/ANAME records for the root domain, use:

| Type | Name | Value | TTL |
|-------|------|-------|-----|
| ALIAS | `@` | `apex-loadbalancer.netlify.com` | Auto |
| CNAME | `www` | `centrifungal.netlify.app` | Auto |

**Netlify setup steps:**

1. Go to Netlify > Site settings > Domain management
2. Add custom domain: `centrifungal.co.uk`
3. Also add: `www.centrifungal.co.uk`
4. Netlify will automatically provision SSL via Let's Encrypt
5. Enable "Force HTTPS" in the SSL/TLS settings

### Backend API - Railway

| Type | Name | Value | TTL |
|-------|------|-------|-----|
| CNAME | `api` | `<your-service>.up.railway.app` | Auto |

The Railway CNAME target is shown in: Railway Dashboard > Service > Settings > Networking > Custom Domain.

**Railway setup steps:**

1. Go to Railway Dashboard > Service > Settings > Networking
2. Add custom domain: `api.centrifungal.co.uk`
3. Railway will show you the CNAME target to point to
4. Railway automatically provisions and renews SSL certificates

## SSL/TLS

Both Netlify and Railway handle SSL automatically:

- **Netlify**: Provisions a Let's Encrypt certificate for the frontend domains. Supports automatic renewal. Enable "Force HTTPS" to redirect HTTP to HTTPS.
- **Railway**: Provisions a Let's Encrypt certificate for the API domain. HTTPS is enforced by default.

No manual certificate management is required.

## Verification

After configuring DNS, verify propagation:

```sh
# Check frontend
dig centrifungal.co.uk CNAME +short
dig www.centrifungal.co.uk CNAME +short
curl -I https://centrifungal.co.uk

# Check backend API
dig api.centrifungal.co.uk CNAME +short
curl -s https://api.centrifungal.co.uk/api/health | jq .
```

DNS propagation can take up to 48 hours, but usually completes within minutes if using a modern DNS provider like Cloudflare.

## Email (Optional)

If you need email for the domain (e.g. `hello@centrifungal.co.uk`), add MX records per your email provider's instructions. This is separate from the web hosting setup. The site currently uses Resend for transactional email, which uses its own sending domain.

## Troubleshooting

- **"DNS_PROBE_FINISHED_NXDOMAIN"**: DNS records not propagated yet, or incorrect. Check with `dig`.
- **SSL errors after adding domain**: Wait a few minutes for the certificate to provision. Netlify and Railway both do this automatically.
- **Root domain not working on Netlify**: Your DNS provider may not support CNAME on root. Consider switching to Netlify DNS or a provider that supports ALIAS records.
- **Mixed content warnings**: Ensure both `APP_URL` (Railway) and the frontend are using HTTPS. Check the CSP header allows the correct origins.
