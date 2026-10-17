import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Media collection - image uploads for products, pages and site branding.
 *
 * Raster-only (jpeg/png/webp), matching the original Statamic asset container.
 * `alt` is required so every CMS-rendered <img> has non-empty alt text.
 * Uploads land in /app/media (a named volume on the VPS); size presets are
 * generated for future use by the frontend.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: path.resolve(__dirname, '../../media'),
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 800, height: 800, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
    ],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  admin: {
    group: 'Content',
    useAsTitle: 'alt',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
  ],
}
