## Task 007: DNS and Domain Setup
**Phase:** 3 | **Agent:** architect
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-002, TASK-003

### Context
The site needs a custom domain pointing to Netlify (frontend) and a subdomain or path for the Railway API. DNS must be configured before launch.

### What Needs Doing
1. Document the DNS configuration plan (domain registrar TBD - check with owner):
   - `centrifungal.co.uk` (or chosen domain) - A/CNAME record pointing to Netlify.
   - `api.centrifungal.co.uk` - CNAME record pointing to Railway service URL.
   - Alternatively, use Netlify's `/api/*` proxy (TASK-002) to avoid a separate API subdomain.
2. Configure Netlify custom domain:
   - Add domain in Netlify dashboard.
   - Enable automatic HTTPS (Let's Encrypt).
   - Verify DNS propagation.
3. Configure Railway custom domain (if using API subdomain):
   - Add `api.centrifungal.co.uk` in Railway dashboard.
   - Railway provides automatic HTTPS.
4. Decide on the API routing strategy and document the decision:
   - Option A: Netlify proxy (`/api/*` rewrites to Railway) - simpler, single domain, no CORS issues.
   - Option B: Separate `api.` subdomain - cleaner separation, but requires CORS headers.
   - Recommendation: Option A (Netlify proxy) unless performance testing reveals unacceptable latency from the proxy hop.
5. If the domain registrar is Cloudflare, document the specific configuration (Cloudflare proxy vs DNS-only mode for Netlify compatibility).

### Files
- `infrastructure/DNS-SETUP.md` (create - step-by-step instructions for domain configuration)
- `frontend/netlify.toml` (modify - add custom domain configuration if needed)

### How to Test
- `dig centrifungal.co.uk` returns the expected Netlify IP/CNAME.
- `curl -I https://centrifungal.co.uk` returns HTTP 200 with valid TLS certificate.
- `curl -I https://centrifungal.co.uk/api/health` returns HTTP 200 from Railway backend.
- HTTPS redirect works: `curl -I http://centrifungal.co.uk` returns 301 to HTTPS.

### Unexpected Outcomes
- If the domain is not yet purchased, flag to orchestrator. Provide registrar recommendation (Cloudflare Registrar for at-cost pricing, or Namecheap).
- If the owner wants a `.com` instead of `.co.uk`, this does not affect the technical setup.
- If Cloudflare proxy mode causes issues with Netlify's SSL, switch to DNS-only mode.

### On Completion
Domain is live and pointing to both Netlify and Railway. Queue TASK-008 (security headers) and TASK-009 (smoke tests).
