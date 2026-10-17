// Shared env for tests: config.js validates at import time, so set everything before importing.
process.env.STRIPE_SECRET_KEY ||= 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET ||= 'whsec_dummy';
process.env.RESEND_API_KEY ||= 're_dummy';
process.env.SITE_URL ||= 'http://localhost:3300';
process.env.FROM_EMAIL ||= 'test@example.com';
process.env.CONTACT_RECIPIENT ||= 'owner@example.com';
process.env.CATALOGUE_FILE ||= new URL('./fixtures/catalogue.json', import.meta.url).pathname;
process.env.DB_PATH ||= ':memory:';
process.env.NODE_ENV = 'test';
