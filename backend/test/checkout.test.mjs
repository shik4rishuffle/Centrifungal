import './setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
const { resetDb, setSoldOut } = await import('../src/services/db.js');
const checkoutRouter = (await import('../src/routes/checkout.js')).default;
const errorHandler = (await import('../src/middleware/errorHandler.js')).default;

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api', checkoutRouter);
  a.use(errorHandler);
  return a;
}
async function post(server, body) {
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/api/checkout`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json() };
}

test('checkout refuses unknown, catalogue-out-of-stock and ledger-sold-out lines with 409', async () => {
  resetDb();
  setSoldOut('reishi-tincture', 'prod_010', true);
  const server = app().listen(0);
  try {
    const { status, json } = await post(server, { items: [
      { slug: 'nope', sku: 'x', quantity: 1 },
      { slug: 'blue-oyster-grow-log', sku: 'var_001b', quantity: 1 },
      { slug: 'reishi-tincture', sku: 'prod_010', quantity: 1 },
    ] });
    assert.equal(status, 409);
    assert.deepEqual(json.items.map((i) => i.reason), ['not_found', 'out_of_stock', 'out_of_stock']);
  } finally {
    server.close();
  }
});

test('checkout validates the body shape', async () => {
  const server = app().listen(0);
  try {
    const { status } = await post(server, { items: [{ slug: 'blue-oyster-grow-log', quantity: 0 }] });
    assert.equal(status, 400);
  } finally {
    server.close();
  }
});
