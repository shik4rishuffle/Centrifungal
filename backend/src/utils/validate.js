/** Basic email format check (catches obvious issues, not exhaustive). */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Trim + strip control characters (keeps newlines/tabs). */
export function sanitiseString(str) {
  if (typeof str !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return str.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

/**
 * Validate a checkout request body.
 * Cart items are keyed by product slug + variant SKU (the stable keys).
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCheckoutBody(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body is required'] };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    body.items.forEach((item, i) => {
      if (!item.slug || typeof item.slug !== 'string') {
        errors.push(`items[${i}].slug is required and must be a string`);
      }
      if (!item.sku || typeof item.sku !== 'string') {
        errors.push(`items[${i}].sku is required and must be a string`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        errors.push(`items[${i}].quantity must be an integer between 1 and 99`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a contact-form request body. */
export function validateContactBody(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body is required'] };
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required');
  } else if (body.name.length > 200) {
    errors.push('name must be 200 characters or fewer');
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.push('email is required');
  } else if (!isValidEmail(body.email)) {
    errors.push('email must be a valid email address');
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
    errors.push('message is required');
  } else if (body.message.length > 5000) {
    errors.push('message must be 5000 characters or fewer');
  }

  return { valid: errors.length === 0, errors };
}
