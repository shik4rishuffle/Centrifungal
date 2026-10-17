const required = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'PAYLOAD_API_URL',
  'PAYLOAD_API_KEY',
  'SITE_URL',
  'FROM_EMAIL',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const config = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
  payloadApiUrl: process.env.PAYLOAD_API_URL,
  payloadApiKey: process.env.PAYLOAD_API_KEY,
  siteUrl: process.env.SITE_URL,
  // Optional: explicit recipient override. Empty => fall back to CMS SiteSettings.contactEmail.
  contactRecipient: process.env.CONTACT_RECIPIENT || '',
  // Optional: Royal Mail Click & Drop. Both empty => dispatch/tracking cron no-ops.
  royalMailApiKey: process.env.ROYAL_MAIL_API_KEY || '',
  royalMailApiUrl: process.env.ROYAL_MAIL_API_URL || '',
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;
