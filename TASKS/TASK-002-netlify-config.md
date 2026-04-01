## Task 002: Netlify Configuration
**Phase:** 1 | **Agent:** architect
**Priority:** High | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-001

### Context
The static frontend is served from Netlify's free tier CDN. Configuration must be in place before any frontend deployment, and must include proper redirects so API calls reach Railway.

### What Needs Doing
1. Create `frontend/netlify.toml` with:
   - `[build]` section: `publish = "dist"`, `command = "npm run build"` (placeholder - frontend agent will refine).
   - `[[redirects]]` rule proxying `/api/*` to the Railway backend URL (use environment variable `RAILWAY_BACKEND_URL`). Set `status = 200` (rewrite, not redirect) and `force = true`.
   - `[[headers]]` section delegated to TASK-008 (add placeholder comment).
2. Create `frontend/_redirects` as a fallback for any redirect rules Netlify needs outside `netlify.toml`.
3. Document the required Netlify environment variables:
   - `RAILWAY_BACKEND_URL` - the Railway service URL (e.g., `https://centrifungal-api.up.railway.app`).

### Files
- `frontend/netlify.toml` (create)
- `frontend/_redirects` (create)

### How to Test
- `netlify.toml` parses without errors (run `npx netlify-toml-parser frontend/netlify.toml` or validate manually).
- `/api/*` redirect rule points to `RAILWAY_BACKEND_URL` with status 200.
- Build command and publish directory are set.

### Unexpected Outcomes
- If the frontend build tool is not yet decided, use placeholder values and note them for the frontend agent to update.
- If Netlify's proxy rewrite has CORS implications with Railway, flag for TASK-008.

### On Completion
Frontend agent can begin deploying static assets. Queue TASK-007 (DNS) and TASK-008 (headers) when ready.
