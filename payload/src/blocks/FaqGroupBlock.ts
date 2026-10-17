import type { Block } from 'payload'

/**
 * A group of question/answer pairs. Ports the old Statamic Bard `faq_group`
 * block. Used by the FAQ page.
 */
export const FaqGroupBlock: Block = {
  slug: 'faqGroup',
  interfaceName: 'FaqGroupBlock',
  labels: { singular: 'FAQ Group', plural: 'FAQ Groups' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}
