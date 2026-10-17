/**
 * Global error handler. Logs full details server-side; never leaks internals.
 */
export default function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err);

  if (err.type === 'validation') {
    return res.status(400).json({ error: 'Validation error', details: err.details || [] });
  }
  if (err.type === 'out_of_stock') {
    return res.status(409).json({ error: 'out_of_stock', items: err.items || [] });
  }
  if (err.type === 'rate_limit') {
    return res.status(429).json({ error: 'Too many requests' });
  }

  return res.status(err.statusCode || 500).json({ error: 'Something went wrong' });
}
