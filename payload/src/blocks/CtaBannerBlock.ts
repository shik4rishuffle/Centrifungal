import type { Block } from 'payload'

/**
 * Call-to-action banner with a heading, body and a single button. Ports the old
 * Statamic Bard `cta_banner` block with corrected field names (old renderer read
 * `text`/`button_url`; this uses `body`/`buttonLink`).
 */
export const CtaBannerBlock: Block = {
  slug: 'ctaBanner',
  interfaceName: 'CtaBannerBlock',
  labels: { singular: 'CTA Banner', plural: 'CTA Banners' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'text' },
    { name: 'buttonText', type: 'text', required: true },
    { name: 'buttonLink', type: 'text', required: true },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
      ],
    },
  ],
}
