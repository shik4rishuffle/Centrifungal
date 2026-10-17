const required = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY', 'SITE_URL', 'FROM_EMAIL', 'CONTACT_RECIPIENT'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const siteUrl = process.env.SITE_URL.replace(/\/$/, '');

const config = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
  siteUrl,
  // Where order alerts and contact-form messages go. Required: there is no CMS to fall back to.
  contactRecipient: process.env.CONTACT_RECIPIENT,
  // The catalogue the static build publishes. In production this is reached over the Docker
  // network (http://static-centrifungal/catalogue.json); a local file path wins for dev and tests.
  catalogueUrl: process.env.CATALOGUE_URL || `${siteUrl}/catalogue.json`,
  catalogueFile: process.env.CATALOGUE_FILE || '',
  catalogueTtlSeconds: parseInt(process.env.CATALOGUE_TTL_SECONDS || '3600', 10),
  // SQLite ledger: sold-out overrides and order fulfilment state. ":memory:" for tests.
  dbPath: process.env.DB_PATH || './data/centrifungal.sqlite',
  // Enables POST /api/admin/* when set. Leave empty to disable the admin endpoints.
  adminToken: process.env.ADMIN_TOKEN || '',
  freeShippingThresholdPence: parseInt(process.env.FREE_SHIPPING_THRESHOLD_PENCE || '5000', 10),
  royalMailApiKey: process.env.ROYAL_MAIL_API_KEY || '',
  royalMailApiUrl: process.env.ROYAL_MAIL_API_URL || '',
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;
