import type { Block } from 'payload'

/**
 * Side-by-side image and rich text, image on the left or right. Ports the old
 * Statamic Bard `image_text` block (whose old renderer had a field-name bug -
 * this uses clean field names the new frontend renderer matches).
 */
export const ImageTextBlock: Block = {
  slug: 'imageText',
  interfaceName: 'ImageTextBlock',
  labels: { singular: 'Image + Text', plural: 'Image + Text Blocks' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
}
