import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config.js';
import errorHandler from './middleware/errorHandler.js';
import checkoutRouter from './routes/checkout.js';
import webhookRouter from './routes/webhook.js';
import contactRouter from './routes/contact.js';
import shippingRouter from './routes/shipping.js';
import { startSchedulers } from './scheduler.js';

const app = express();

// Behind Traefik in production: trust the proxy so req.ip is the real client IP
// (otherwise the rate limiter buckets every visitor under the proxy address).
app.set('trust proxy', 1);

// Security headers
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS - storefront origin + local dev
app.use(
  cors({
    origin: [config.siteUrl, 'http://localhost:8080'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// Parse JSON for everything except the Stripe webhook (needs the raw body).
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    return next();
  }
  express.json()(req, res, next);
});
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes (all under /api)
app.use('/api', checkoutRouter);
app.use('/api', webhookRouter);
app.use('/api', contactRouter);
app.use('/api', shippingRouter);

// Global error handler - after all routes
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Centrifungal backend listening on port ${config.port}`);
  // Background jobs: Royal Mail tracking poll + Stripe reconcile.
  startSchedulers();
});
