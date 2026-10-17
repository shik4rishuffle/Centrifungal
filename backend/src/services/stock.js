import { catalogueSoldOut } from './catalogue.js';
import { getOverrides } from './db.js';

/**
 * Effective sold-out list: what the catalogue says, adjusted by SQLite overrides.
 * An override with soldOut=1 adds an item; soldOut=0 removes it (back in stock before a rebuild).
 */
export async function effectiveSoldOut() {
  const base = new Map();
  for (const item of await catalogueSoldOut()) base.set(`${item.slug}__${item.sku}`, item);
  let updatedAt = null;
  for (const o of getOverrides()) {
    const k = `${o.slug}__${o.sku}`;
    if (o.soldOut) base.set(k, { slug: o.slug, sku: o.sku });
    else base.delete(k);
    if (!updatedAt || o.updatedAt > updatedAt) updatedAt = o.updatedAt;
  }
  return { soldOut: [...base.values()], updatedAt };
}

export async function isSoldOut(slug, sku) {
  const { soldOut } = await effectiveSoldOut();
  return soldOut.some((i) => i.slug === slug && i.sku === sku);
}
