import { readFile } from 'node:fs/promises';
import config from '../config.js';

/**
 * The product catalogue. Source of truth is the static build's /catalogue.json, which is
 * generated from the same git content the site renders. Cached in memory and refreshed on a
 * TTL, on demand (admin endpoint) and whenever a lookup misses.
 */
let cache = { loadedAt: 0, data: null, etag: null };
let inflight = null;

async function fetchCatalogue() {
  if (config.catalogueFile) {
    const raw = await readFile(config.catalogueFile, 'utf8');
    return JSON.parse(raw);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const headers = cache.etag ? { 'If-None-Match': cache.etag } : {};
    const res = await fetch(config.catalogueUrl, { signal: controller.signal, headers });
    if (res.status === 304 && cache.data) return cache.data;
    if (!res.ok) throw new Error(`catalogue fetch ${res.status}`);
    cache.etag = res.headers.get('etag');
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadCatalogue({ force = false } = {}) {
  const fresh = cache.data && Date.now() - cache.loadedAt < config.catalogueTtlSeconds * 1000;
  if (fresh && !force) return cache.data;
  if (!inflight) {
    inflight = fetchCatalogue()
      .then((data) => {
        if (!data || !Array.isArray(data.products)) throw new Error('catalogue has no products array');
        cache = { ...cache, loadedAt: Date.now(), data };
        return data;
      })
      .catch((err) => {
        console.error('[Catalogue] load failed:', err.message);
        if (cache.data) return cache.data; // serve stale rather than fail checkout
        const wrapped = new Error('Catalogue unavailable');
        wrapped.type = 'catalogue';
        wrapped.statusCode = 503;
        throw wrapped;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function catalogueLoadedAt() {
  return cache.loadedAt ? new Date(cache.loadedAt).toISOString() : null;
}

/**
 * Find a sellable line for slug + sku. Products without variants sell under their own sku
 * (or slug when no sku is set). Returns null when not found.
 */
export async function resolveLine(slug, sku) {
  let catalogue = await loadCatalogue();
  let product = catalogue.products.find((p) => p.slug === slug);
  if (!product) {
    catalogue = await loadCatalogue({ force: true });
    product = catalogue.products.find((p) => p.slug === slug);
    if (!product) return null;
  }
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) {
    const single = product.sku || product.slug;
    if (sku !== single) return null;
    return { slug, sku: single, name: product.name, unitAmount: product.pricePence, weightGrams: product.weightGrams || 0, inStock: product.inStock !== false };
  }
  const variant = variants.find((v) => v.sku === sku);
  if (!variant) return null;
  return {
    slug,
    sku,
    name: variant.name ? `${product.name} - ${variant.name}` : product.name,
    unitAmount: variant.pricePence ?? product.pricePence,
    weightGrams: product.weightGrams || 0,
    inStock: product.inStock !== false && variant.inStock !== false,
  };
}

/** Every sellable line that the catalogue itself marks out of stock. */
export async function catalogueSoldOut() {
  const catalogue = await loadCatalogue();
  const out = [];
  for (const p of catalogue.products) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    if (variants.length === 0) {
      if (p.inStock === false) out.push({ slug: p.slug, sku: p.sku || p.slug });
    } else {
      for (const v of variants) if (p.inStock === false || v.inStock === false) out.push({ slug: p.slug, sku: v.sku });
    }
  }
  return out;
}
