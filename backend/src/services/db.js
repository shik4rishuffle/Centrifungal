import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import config from '../config.js';

/**
 * SQLite ledger. Two jobs only:
 *  - stock_overrides: sold-out state that must change faster than a rebuild (one-off pieces,
 *    a batch that ran out). The catalogue's own inStock flags still apply; an override of 0
 *    forces an item back in stock without a rebuild.
 *  - orders: the processing ledger the webhook and crons need (idempotency by Stripe session,
 *    Royal Mail dispatch state, tracking). Stripe remains the record for payment and customer;
 *    the address is kept here only because Click & Drop dispatch needs it.
 */
let db;

export function getDb() {
  if (db) return db;
  if (config.dbPath !== ':memory:') mkdirSync(dirname(config.dbPath), { recursive: true });
  db = new DatabaseSync(config.dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS stock_overrides (
      item_key TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      sku TEXT NOT NULL,
      sold_out INTEGER NOT NULL,
      note TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      session_id TEXT PRIMARY KEY,
      order_ref TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      items_json TEXT NOT NULL,
      subtotal_pence INTEGER NOT NULL,
      shipping_pence INTEGER NOT NULL,
      total_pence INTEGER NOT NULL,
      weight_grams INTEGER NOT NULL DEFAULT 0,
      address_json TEXT,
      payment_intent_id TEXT,
      payment_status TEXT,
      fulfilment_status TEXT NOT NULL,
      royal_mail_order_id TEXT,
      tracking_number TEXT,
      tracking_url TEXT,
      shipped_at TEXT,
      delivered_at TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS orders_status ON orders (fulfilment_status);
  `);
  return db;
}

/** For tests: drop the cached handle so a fresh in-memory database is created. */
export function resetDb() {
  if (db) db.close();
  db = undefined;
}

const key = (slug, sku) => `${slug}__${sku}`;

export function getOverrides() {
  return getDb().prepare('SELECT slug, sku, sold_out AS soldOut, note, updated_at AS updatedAt FROM stock_overrides').all();
}

export function setSoldOut(slug, sku, soldOut, note = '') {
  getDb()
    .prepare(
      `INSERT INTO stock_overrides (item_key, slug, sku, sold_out, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(item_key) DO UPDATE SET sold_out = excluded.sold_out, note = excluded.note, updated_at = excluded.updated_at`
    )
    .run(key(slug, sku), slug, sku, soldOut ? 1 : 0, note, new Date().toISOString());
}

export function clearOverride(slug, sku) {
  getDb().prepare('DELETE FROM stock_overrides WHERE item_key = ?').run(key(slug, sku));
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    stripeSessionId: row.session_id,
    orderRef: row.order_ref,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    items: JSON.parse(row.items_json),
    subtotalPence: row.subtotal_pence,
    shippingPence: row.shipping_pence,
    totalPence: row.total_pence,
    weightGrams: row.weight_grams,
    shippingAddress: row.address_json ? JSON.parse(row.address_json) : {},
    stripePaymentIntentId: row.payment_intent_id,
    stripePaymentStatus: row.payment_status,
    fulfilmentStatus: row.fulfilment_status,
    royalMailOrderId: row.royal_mail_order_id,
    trackingNumber: row.tracking_number,
    trackingUrl: row.tracking_url,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    notes: row.notes,
  };
}

export function findOrderBySession(sessionId) {
  return rowToOrder(getDb().prepare('SELECT * FROM orders WHERE session_id = ?').get(sessionId));
}

export function insertOrder(o) {
  getDb()
    .prepare(
      `INSERT INTO orders (session_id, order_ref, created_at, customer_name, customer_email, items_json, subtotal_pence, shipping_pence, total_pence,
         weight_grams, address_json, payment_intent_id, payment_status, fulfilment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      o.stripeSessionId, o.orderRef, new Date().toISOString(), o.customerName || '', o.customerEmail || '', JSON.stringify(o.items || []),
      o.subtotalPence, o.shippingPence, o.totalPence, o.weightGrams || 0, JSON.stringify(o.shippingAddress || {}),
      o.stripePaymentIntentId || '', o.stripePaymentStatus || 'paid', o.fulfilmentStatus || 'paid'
    );
  return findOrderBySession(o.stripeSessionId);
}

const COLUMNS = {
  fulfilmentStatus: 'fulfilment_status', royalMailOrderId: 'royal_mail_order_id', trackingNumber: 'tracking_number',
  trackingUrl: 'tracking_url', shippedAt: 'shipped_at', deliveredAt: 'delivered_at', notes: 'notes',
};

export function updateOrder(sessionId, fields) {
  const sets = [];
  const values = [];
  for (const [k, v] of Object.entries(fields)) {
    if (!COLUMNS[k]) continue;
    sets.push(`${COLUMNS[k]} = ?`);
    values.push(v ?? null);
  }
  if (sets.length === 0) return findOrderBySession(sessionId);
  values.push(sessionId);
  getDb().prepare(`UPDATE orders SET ${sets.join(', ')} WHERE session_id = ?`).run(...values);
  return findOrderBySession(sessionId);
}

export function findOrdersByStatus(status, limit = 100) {
  return getDb().prepare('SELECT * FROM orders WHERE fulfilment_status = ? ORDER BY created_at ASC LIMIT ?').all(status, limit).map(rowToOrder);
}

export function listOrders(limit = 50) {
  return getDb().prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').all(limit).map(rowToOrder);
}
