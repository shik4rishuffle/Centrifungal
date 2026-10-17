import type { Block } from 'payload'

/**
 * Highlights up to a few hand-picked products inside a page. Ports the old
 * Statamic Bard `product_highlight` block. The frontend renders the first 4.
 */
export const ProductHighlightBlock: Block = {
  slug: 'productHighlight',
  interfaceName: 'ProductHighlightBlock',
  labels: { singular: 'Product Highlight', plural: 'Product Highlights' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      required: true,
      admin: { description: 'Pick up to 4 products. The frontend shows the first 4.' },
    },
  ],
}
