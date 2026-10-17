import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { ProductCategories } from './collections/ProductCategories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'

import { SiteSettings } from './globals/SiteSettings'
import { ShopSettings } from './globals/ShopSettings'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Per-client Payload CMS for Centrifungal, built to the Skeleton Crew platform
 * contract. Reads DATABASE_URI / PAYLOAD_SECRET / PAYLOAD_PUBLIC_SERVER_URL /
 * PAYLOAD_PUBLIC_FRONTEND_URL from the environment (injected by `skeleton new`
 * on the VPS - never commit real values).
 *
 * CORS/CSRF allow the frontend origin plus local-dev ports. `push: true` keeps
 * dev schema in sync; before the first prod deploy generate committed
 * migrations (`npx payload migrate:create`) since db-postgres disables push
 * under NODE_ENV=production.
 */
const devOrigins = ['http://localhost:8080', 'http://localhost:3000']
const allowedOrigins = process.env.PAYLOAD_PUBLIC_FRONTEND_URL
  ? [process.env.PAYLOAD_PUBLIC_FRONTEND_URL, ...devOrigins]
  : devOrigins

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  editor: lexicalEditor(),
  // Required in Payload v3 for Media imageSizes (thumbnail/card/hero) to generate.
  sharp,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    push: true,
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  collections: [Users, Media, ProductCategories, Products, Orders, Pages],
  globals: [SiteSettings, ShopSettings],
  cors: allowedOrigins,
  csrf: allowedOrigins,
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
