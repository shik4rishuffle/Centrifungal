import type { GlobalConfig } from 'payload'

/**
 * ShopSettings - commerce config the checkout backend reads. Auth-only (no
 * public read): the frontend never reads it directly; the backend proxies the
 * publishable key and shipping rules to the storefront.
 *
 * Base postage is Royal Mail weight-based and computed by the backend from each
 * product's weightGrams; the free-shipping threshold below is an optional
 * override applied at checkout.
 */
export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  admin: { group: 'Settings' },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'stripePublishableKey', type: 'text', admin: { description: 'Stripe publishable (pk_) key. Served to the frontend by the checkout backend.' } },
    { name: 'shopAnnouncementText', type: 'text', admin: { description: 'Optional banner shown across the top of the shop. Blank = hidden.' } },
    { name: 'freeShippingThresholdPence', type: 'number', admin: { description: 'Order total (pence) above which shipping is free. Blank/0 = never free.' } },
  ],
}
