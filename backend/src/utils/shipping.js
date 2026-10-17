/**
 * Weight-based UK shipping (Royal Mail bands).
 *
 * Grow logs are heavy, so postage is priced by total parcel weight, matching
 * the original site's weight_grams model. A free-shipping threshold from
 * ShopSettings overrides the band when the order subtotal is high enough.
 *
 * TODO: confirm these band prices against current Royal Mail Tracked rates (and
 * the original Laravel RoyalMailService) before go-live - they are sensible
 * placeholders, not billed rates.
 */

// [maxGrams, pricePence] - first band whose maxGrams >= weight wins.
const BANDS = [
  [100, 349],
  [250, 399],
  [500, 449],
  [750, 499],
  [1000, 549],
  [2000, 699],
  [5000, 899],
  [10000, 1299],
];
const OVERWEIGHT_PENCE = 1699; // heavier than the top band

/**
 * @param {number} totalWeightGrams - summed parcel weight
 * @param {number} subtotalPence - order subtotal (for free-shipping check)
 * @param {Object} [shopSettings] - { freeShippingThresholdPence }
 * @returns {number} shipping cost in pence
 */
export function computeShippingPence(totalWeightGrams, subtotalPence, shopSettings = {}) {
  const threshold = Number(shopSettings.freeShippingThresholdPence) || 0;
  if (threshold > 0 && subtotalPence >= threshold) {
    return 0;
  }

  const weight = Math.max(0, Math.ceil(Number(totalWeightGrams) || 0));
  for (const [maxGrams, pricePence] of BANDS) {
    if (weight <= maxGrams) return pricePence;
  }
  return OVERWEIGHT_PENCE;
}
