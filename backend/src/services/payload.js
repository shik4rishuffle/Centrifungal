import config from '../config.js';

const TIMEOUT_MS = 10_000;

/** Headers for authenticated Payload requests (API-key strategy on Users). */
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `users API-Key ${config.payloadApiKey}`,
  };
}

/** fetch with a timeout; throws a typed error on failure. */
async function payloadFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[Payload] ${options.method || 'GET'} ${url} - ${res.status}: ${body}`);
      const err = new Error(`Payload API error: ${res.status}`);
      err.type = 'payload';
      err.statusCode = res.status;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[Payload] Request timed out: ${url}`);
      const timeout = new Error('Payload API request timed out');
      timeout.type = 'payload';
      timeout.statusCode = 504;
      throw timeout;
    }
    if (err.type === 'payload') throw err;

    console.error(`[Payload] Request failed: ${url}`, err.message);
    const wrapped = new Error('Payload API request failed');
    wrapped.type = 'payload';
    wrapped.statusCode = 502;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }
}

/** GET a single product by its slug (the stable key the cart uses). */
export async function getProductBySlug(slug) {
  const params = new URLSearchParams();
  params.append('where[slug][equals]', slug);
  params.append('depth', '0');
  const result = await payloadFetch(
    `${config.payloadApiUrl}/products?${params.toString()}`,
    { headers: authHeaders() }
  );
  return result.docs && result.docs.length > 0 ? result.docs[0] : null;
}

/** GET a global by slug (site-settings, shop-settings). */
export async function getGlobal(slug) {
  return payloadFetch(`${config.payloadApiUrl}/globals/${slug}`, {
    headers: authHeaders(),
  });
}

/** POST a new order (authenticated). */
export async function createOrder(data) {
  return payloadFetch(`${config.payloadApiUrl}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

/** PATCH an order by id (authenticated) - used by the fulfilment crons. */
export async function updateOrder(id, data) {
  return payloadFetch(`${config.payloadApiUrl}/orders/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

/** Find an order by Stripe session id (idempotency guard on the webhook). */
export async function findOrderByStripeSession(sessionId) {
  const params = new URLSearchParams();
  params.append('where[stripeSessionId][equals]', sessionId);
  const result = await payloadFetch(
    `${config.payloadApiUrl}/orders?${params.toString()}`,
    { headers: authHeaders() }
  );
  return result.docs && result.docs.length > 0 ? result.docs[0] : null;
}

/** Query orders by a `where` clause object (used by the reconcile + tracking crons). */
export async function findOrders(where = {}, limit = 100) {
  const params = new URLSearchParams();
  for (const [field, conditions] of Object.entries(where)) {
    for (const [operator, value] of Object.entries(conditions)) {
      params.append(`where[${field}][${operator}]`, value);
    }
  }
  params.append('limit', String(limit));
  params.append('depth', '0');
  const result = await payloadFetch(
    `${config.payloadApiUrl}/orders?${params.toString()}`,
    { headers: authHeaders() }
  );
  return result.docs || [];
}
