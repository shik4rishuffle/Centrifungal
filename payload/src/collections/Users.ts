import type { CollectionConfig } from 'payload'

/**
 * Admin users, with API keys enabled.
 *
 * The checkout backend authenticates to Payload with
 * `Authorization: users API-Key <key>` to create orders and read shop settings,
 * which requires `auth.useAPIKey: true`. `email` and `password` are added
 * automatically when auth is enabled, so only the optional `name` is listed.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
  },
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text' },
  ],
}
