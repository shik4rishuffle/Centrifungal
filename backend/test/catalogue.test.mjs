import './setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const { resolveLine, catalogueSoldOut } = await import('../src/services/catalogue.js');

test('prices a variant from the catalogue, never from the client', async () => {
  const line = await resolveLine('blue-oyster-grow-log', 'var_001a');
  assert.equal(line.unitAmount, 2499);
  assert.equal(line.weightGrams, 1000);
  assert.equal(line.name, 'Blue Oyster Grow Log - Small (1kg)');
  assert.equal(line.inStock, true);
});

test('a product without variants sells under its own sku', async () => {
  const line = await resolveLine('reishi-tincture', 'prod_010');
  assert.equal(line.unitAmount, 1800);
  assert.equal(await resolveLine('reishi-tincture', 'wrong-sku'), null);
});

test('unknown slugs resolve to null', async () => {
  assert.equal(await resolveLine('nope', 'x'), null);
});

test('catalogue sold-out list includes out-of-stock variants and products', async () => {
  const out = await catalogueSoldOut();
  assert.deepEqual(out, [
    { slug: 'blue-oyster-grow-log', sku: 'var_001b' },
    { slug: 'retired-kit', sku: 'prod_099' },
  ]);
});
