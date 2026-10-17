import type { CollectionConfig } from 'payload'
import { autoSlugFromField } from '../hooks/slugify'

/**
 * Products.
 *
 * Model preserves the original Statamic shape: a base price + weight, a master
 * in-stock toggle, and an array of buyable size/variants each with their own
 * SKU, optional price override and in-stock toggle. Stock is simple in/out (no
 * counts) per the original project scope.
 *
 * Prices are integer PENCE throughout - never pounds/floats.
 *
 * SKUs are the stable key the cart and checkout backend use to identify a
 * variant (replacing the old SQLite numeric variant IDs), so they must be
 * unique across the whole shop. Payload cannot enforce uniqueness on array
 * sub-fields, so this is a convention the seeder/editor must uphold.
 *
 * The `images` array's inner field is named `image` (singular) to match the
 * Skeleton Crew seeder convention - do not rename it.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'category', 'price', 'inStock', 'featured'],
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
    },
    { name: 'category', type: 'relationship', relationTo: 'product-categories' },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Plain-text description. Blank lines split paragraphs on the product page.' },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: 'Base price in PENCE (integer). e.g. 2999 = £29.99.' },
    },
    {
      name: 'weightGrams',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: 'Shipping weight in grams. Drives the Royal Mail postage band.' },
    },
    {
      name: 'inStock',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Master in-stock toggle. Untick to disable buying every size.' },
    },
    {
      name: 'variants',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Size / Variant', plural: 'Sizes / Variants' },
      admin: { description: 'Each buyable size. SKUs must be unique across the whole shop.' },
      fields: [
        { name: 'variantName', type: 'text', required: true },
        {
          name: 'sku',
          type: 'text',
          required: true,
          admin: { description: 'Unique stock code. Used by cart & checkout - never reuse across products.' },
        },
        {
          name: 'priceOverride',
          type: 'number',
          min: 1,
          admin: { description: 'Optional price in pence for this size. Blank = use the base price.' },
        },
        { name: 'inStock', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show in the homepage "Fresh Picks" section.' },
    },
    { name: 'sortOrder', type: 'number', admin: { description: 'Lower numbers show first within a category.' } },
    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', admin: { description: 'Overrides the page title in search results.' } },
        { name: 'metaDescription', type: 'textarea', admin: { description: 'Search-result snippet.' } },
      ],
    },
  ],
}
