import type { CollectionConfig } from 'payload'
import { autoSlugFromField } from '../hooks/slugify'
import { HeroBlock } from '../blocks/HeroBlock'
import { TextBlock } from '../blocks/TextBlock'
import { ImageBlock } from '../blocks/ImageBlock'
import { ImageTextBlock } from '../blocks/ImageTextBlock'
import { CtaBannerBlock } from '../blocks/CtaBannerBlock'
import { ProductHighlightBlock } from '../blocks/ProductHighlightBlock'
import { FaqGroupBlock } from '../blocks/FaqGroupBlock'
import { GalleryBlock } from '../blocks/GalleryBlock'

/**
 * Pages - the block-builder content pages (About, Contact, FAQ, Care
 * Instructions, and any new page the owner adds). Preserves the old Statamic
 * page-builder capability with the eight blocks ported one-to-one.
 *
 * The homepage is NOT here - its content lives in the SiteSettings "Homepage"
 * tab (flat fields), matching both the original homepage blueprint and the
 * Skeleton Crew convention. Public read so the frontend hydrates without auth.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeChange: [autoSlugFromField('title')] },
    },
    { name: 'subtitle', type: 'text' },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        HeroBlock,
        TextBlock,
        ImageBlock,
        ImageTextBlock,
        CtaBannerBlock,
        ProductHighlightBlock,
        FaqGroupBlock,
        GalleryBlock,
      ],
    },
    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
