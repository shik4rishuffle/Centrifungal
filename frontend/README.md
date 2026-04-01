# Frontend - Centrifungal

Static HTML/CSS/JS site served via Netlify. No build step - files are served directly from the `src/` directory.

## Prerequisites

- Node.js (for running tests via Vitest)

## Setup

```bash
cd frontend
npm install
```

## Development

There is no build step. Open any HTML file in `src/` directly in your browser, or use a local development server:

```bash
npx serve src
```

For API calls to work locally, you need the backend running (see [backend README](../backend/README.md)). Update `API_BASE_URL` in your JavaScript to point to `http://localhost:8000` or wherever the backend is running.

In production, Netlify proxies `/api/*` requests to the Railway backend, so the frontend JS can use relative URLs like `/api/products`.

## Testing

Run tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Tests use Vitest and live in `src/js/__tests__/`.

## Deployment

The frontend auto-deploys to Netlify when changes are pushed to the `main` branch on GitHub. Netlify configuration is in `netlify.toml`.

Required Netlify environment variable (set in the Netlify UI under Site settings > Environment):

- `RAILWAY_BACKEND_URL` - the Railway backend URL (e.g. `https://centrifungal-api.up.railway.app`). Used by the `/api/*` proxy redirect.

## Directory Structure

```
frontend/
  src/
    css/
      reset.css           CSS reset
      design-tokens.css   Design system tokens (colors, spacing, fonts)
      components.css      Reusable component styles
      homepage.css        Homepage-specific styles
    js/
      cart.js             Cart state management
      cart-ui.js          Cart UI rendering
      shop.js             Product listing logic
      homepage.js         Homepage interactions
      __tests__/          Vitest test files
    data/                 Static data files
    index.html            Homepage
    shop.html             Product listing page
    cart.html             Shopping cart page
    components.html       Design system component reference
    design-system.html    Design system documentation
  netlify.toml            Netlify configuration and redirect rules
  vitest.config.js        Vitest configuration
  package.json            Dependencies and scripts
```

## How it Connects to the Backend

In production, the Netlify `_redirects` and `netlify.toml` proxy all `/api/*` requests to the Railway backend. The browser never makes cross-origin requests - everything goes through the Netlify domain.

Locally, you either point your JS at the backend's local URL directly or run everything through the Docker setup (see [infrastructure README](../infrastructure/README.md)).
