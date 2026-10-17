import type { Block } from 'payload'

/**
 * Single image with optional caption. Alt text comes from the Media item
 * (alt is required on upload), so it is not duplicated here. Ports the old
 * Statamic Bard `image` block.
 */
export const ImageBlock: Block = {
  slug: 'image',
  interfaceName: 'ImageBlock',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}
