import type { Block } from 'payload'

/**
 * Hero block - large banner with heading, optional sub-heading, background
 * image and a single CTA. Ports the old Statamic Bard `hero` block.
 */
export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Hero Blocks' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'text' },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
    { name: 'ctaText', type: 'text', admin: { description: 'Button label. Leave blank for no button.' } },
    { name: 'ctaLink', type: 'text', admin: { description: 'Button URL, e.g. /shop.' } },
  ],
}
