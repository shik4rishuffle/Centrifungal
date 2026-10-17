import './setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const { resetDb, setSoldOut, clearOverride, insertOrder, findOrderBySession, updateOrder, findOrdersByStatus } = await import('../src/services/db.js');
const { effectiveSoldOut, isSoldOut } = await import('../src/services/stock.js');

test.beforeEach(() => resetDb());

test('overrides add to and remove from the catalogue sold-out list', async () => {
  assert.equal(await isSoldOut('blue-oyster-grow-log', 'var_001a'), false);
  setSoldOut('blue-oyster-grow-log', 'var_001a', true, 'last one went to a market stall');
  assert.equal(await isSoldOut('blue-oyster-grow-log', 'var_001a'), true);
  // force an out-of-stock catalogue item back in stock before the next build
  setSoldOut('retired-kit', 'prod_099', false);
  const { soldOut, updatedAt } = await effectiveSoldOut();
  assert.deepEqual(soldOut.map((i) => i.sku).sort(), ['var_001a', 'var_001b']);
  assert.ok(updatedAt);
  clearOverride('blue-oyster-grow-log', 'var_001a');
  assert.equal(await isSoldOut('blue-oyster-grow-log', 'var_001a'), false);
});

test('orders are idempotent by session and move through fulfilment states', () => {
  const o = insertOrder({ stripeSessionId: 'cs_1', orderRef: 'CFG-20261017-ABCD', items: [{ slug: 'x', sku: 'y', quantity: 1, price: 100 }], subtotalPence: 100, shippingPence: 349, totalPence: 449, shippingAddress: { line1: '1 Lane' } });
  assert.equal(o.fulfilmentStatus, 'paid');
  assert.equal(findOrderBySession('cs_1').orderRef, 'CFG-20261017-ABCD');
  assert.throws(() => insertOrder({ stripeSessionId: 'cs_1', orderRef: 'CFG-20261017-EFGH', items: [], subtotalPence: 0, shippingPence: 0, totalPence: 0 }));
  updateOrder('cs_1', { fulfilmentStatus: 'fulfilled', royalMailOrderId: 'RM1', ignored: 'nope' });
  assert.equal(findOrdersByStatus('fulfilled')[0].royalMailOrderId, 'RM1');
  assert.equal(findOrdersByStatus('paid').length, 0);
});
