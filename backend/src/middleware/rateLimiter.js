/**
 * In-memory rate limiter factory, keyed by client IP.
 *
 * @param {number} [maxRequests=3]
 * @param {number} [windowMs=900000] - default 15 minutes
 * @returns {Function} Express middleware
 */
export function createRateLimiter(maxRequests = 3, windowMs = 15 * 60 * 1000) {
  const hits = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) hits.delete(ip);
      else hits.set(ip, valid);
    }
  }, windowMs);
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    next();
  };
}
