import type { Block } from 'payload'

/**
 * Rich-text block - ports the old Statamic Bard `text_block`. Uses the config's
 * Lexical editor (headings, bold/italic, lists, links).
 */
export const TextBlock: Block = {
  slug: 'textBlock',
  interfaceName: 'TextBlock',
  labels: { singular: 'Text', plural: 'Text Blocks' },
  fields: [
    { name: 'body', type: 'richText', required: true },
  ],
}
