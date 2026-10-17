import type { CollectionConfig } from 'payload'
import { autoSlugFromField } from '../hooks/slugify'

/**
 * Product categories - now editable content (name, blurb, icon) rather than the
 * old hardcoded frontend constants (CATEGORY_DISPLAY_NAMES / DESCRIPTIONS /
 * ICONS). Seeded with the original four: Grow Logs, Colonised Dowels, DIY Kits,
 * Tinctures.
 */
export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'sortOrder'],
    group: 'Shop',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeChange: [autoSlugFromField('name')] },
      admin: { description: 'URL segment. Auto-filled from the name; changing it changes shop links.' },
    },
    { name: 'description', type: 'textarea', admin: { description: 'Short blurb shown on the shop category header.' } },
    { name: 'icon', type: 'text', admin: { description: 'Emoji shown next to the category, e.g. 🍄.' } },
    { name: 'sortOrder', type: 'number', admin: { description: 'Lower numbers show first.' } },
  ],
}
