import test from 'node:test';
import assert from 'node:assert/strict';
import { computeShippingPence } from '../src/utils/shipping.js';

test('weight bands and the free-shipping threshold', () => {
  assert.equal(computeShippingPence(900, 2499, { freeShippingThresholdPence: 5000 }), 549);
  assert.equal(computeShippingPence(2500, 2499, { freeShippingThresholdPence: 5000 }), 899);
  assert.equal(computeShippingPence(2500, 6000, { freeShippingThresholdPence: 5000 }), 0);
  assert.equal(computeShippingPence(20000, 100, {}), 1699);
});
