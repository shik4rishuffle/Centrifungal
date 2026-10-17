import config from '../config.js';

/**
 * Royal Mail Click & Drop client. Ported from the original Laravel
 * RoyalMailService (push order for dispatch + poll tracking status).
 *
 * No-ops safely when unconfigured. NOTE: the exact Click & Drop request/response
 * shape and endpoints should be re-verified against a live Royal Mail account
 * before go-live - this mirrors the original app's assumptions.
 */

const RETRY_DELAYS = [1000, 2000, 4000];
const TIMEOUT_MS = 15_000;

export function isConfigured() {
  return Boolean(config.royalMailApiKey && config.royalMailApiUrl);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rmFetch(path, { method = 'GET', body } = {}) {
  const url = `${config.royalMailApiUrl}${path}`;
  const attempts = RETRY_DELAYS.length + 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.royalMailApiKey}`,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      // Retry on 5xx; return everything else to the caller.
      if (res.status >= 500 && attempt < attempts - 1) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, body: json };
    } catch (err) {
      // Network/timeout - retry, then give up.
      if (attempt < attempts - 1) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      console.error(`[RoyalMail] ${method} ${path} failed:`, err.message);
      return { ok: false, status: 0, body: {} };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 0, body: {} };
}

/** Build the Click & Drop order payload from a Payload order. */
function buildOrderPayload(order) {
  const addr = order.shippingAddress || {};
  const items = (order.items || []).map((item) => ({
    description: item.name || 'Mushroom product',
    quantity: item.quantity || 1,
    value: (item.price || 0) / 100,
  }));

  return {
    items: [
      {
        recipient: {
          name: order.customerName || '',
          addressLine1: addr.line1 || '',
          addressLine2: addr.line2 || '',
          city: addr.city || '',
          county: addr.county || '',
          postcode: addr.postcode || '',
          countryCode: 'GB',
        },
        orderReference: order.orderRef,
        subtotal: (order.subtotalPence || 0) / 100,
        shippingCostPaid: (order.shippingPence || 0) / 100,
        total: (order.totalPence || 0) / 100,
        weight: order.weightGrams || 0,
        items,
      },
    ],
  };
}

/**
 * Push an order to Click & Drop for dispatch.
 * @returns {Promise<{ ok: boolean, orderReference?: string, error?: string }>}
 */
export async function pushOrder(order) {
  if (!isConfigured()) return { ok: false, error: 'Royal Mail not configured' };

  const res = await rmFetch('/api/0/orders', { method: 'POST', body: buildOrderPayload(order) });
  const ref = res.body?.orderIdentifiers?.[0]?.orderReference;
  if (res.ok && ref) return { ok: true, orderReference: String(ref) };

  return { ok: false, error: res.body?.message || res.body?.error || `HTTP ${res.status}` };
}

/**
 * Get the tracking status for a Royal Mail order.
 * @returns {Promise<{ status: string, trackingNumber: string|null, trackingUrl: string|null }>}
 */
export async function getTrackingStatus(royalMailOrderId) {
  if (!isConfigured()) return { status: 'error', trackingNumber: null, trackingUrl: null };

  const res = await rmFetch(`/api/0/orders/${royalMailOrderId}`);
  if (!res.ok) return { status: 'error', trackingNumber: null, trackingUrl: null };

  const trackingNumber = res.body?.trackingNumber || null;
  return {
    status: res.body?.status || 'unknown',
    trackingNumber,
    trackingUrl: trackingNumber
      ? `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`
      : null,
  };
}
