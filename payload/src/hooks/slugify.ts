/**
 * Auto-slug utilities for Products, ProductCategories, and Pages.
 *
 * Two-step algorithm chosen to match the seeder's PROD_EXPECTED_SLUG list:
 *   1. Strip apostrophes and curly quotes (so "Lucifer's Bowl" -> "lucifers bowl",
 *      not "lucifer-s-bowl").
 *   2. Lowercase and collapse any run of non-alphanumeric chars to a single hyphen,
 *      then trim leading/trailing hyphens.
 *
 * If you change this algorithm, update scripts/cms/upload-products.sh's
 * PROD_EXPECTED_SLUG array in lockstep, otherwise the seeder's idempotency
 * check will create duplicate products on every run.
 */

import type { FieldHook } from 'payload'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['‘’“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Field-level beforeChange hook that derives `slug` from a sibling source field
 * when the operator hasn't supplied a slug. Will not overwrite an existing or
 * operator-edited slug.
 *
 * @param sourceField - sibling field name to derive from (e.g. "name", "title")
 */
export function autoSlugFromField(sourceField: string): FieldHook {
  const hook: FieldHook = ({ value, data, originalDoc }) => {
    const incoming = (value ?? '').toString().trim()
    if (incoming.length > 0) {
      return incoming
    }
    const source = (data?.[sourceField] ?? originalDoc?.[sourceField] ?? '').toString()
    if (source.length === 0) {
      return value
    }
    return slugify(source)
  }
  return hook
}
