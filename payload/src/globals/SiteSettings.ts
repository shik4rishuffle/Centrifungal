import type { GlobalConfig } from 'payload'

/**
 * SiteSettings - all the site chrome and page-level copy that used to be
 * hardcoded in the frontend, now editable. Organised into admin tabs so the
 * owner can find each surface without scrolling a flat field list.
 *
 * Covers: nav, footer (incl. social + link columns), the contact-page sidebar
 * and email, the whole homepage, and site-wide SEO/branding + JSON-LD org info.
 *
 * Body fields are plain textarea - blank lines split paragraphs in the
 * frontend. Public read so the frontend hydrates without auth.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Settings' },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Navigation',
          description: 'Header + mobile menu links, in order.',
          fields: [
            {
              name: 'navLinks',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            { name: 'footerTagline', type: 'textarea' },
            { name: 'footerCopyright', type: 'text' },
            {
              name: 'socialLinks',
              type: 'array',
              admin: { description: 'Platform sets which icon renders.' },
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Twitter / X', value: 'twitter' },
                    { label: 'TikTok', value: 'tiktok' },
                    { label: 'YouTube', value: 'youtube' },
                  ],
                },
                { name: 'url', type: 'text', required: true },
                { name: 'label', type: 'text', admin: { description: 'Accessible label, e.g. "Instagram".' } },
              ],
            },
            {
              name: 'footerColumns',
              type: 'array',
              admin: { description: 'Footer link columns (Shop, Help, Company, ...).' },
              fields: [
                { name: 'title', type: 'text', required: true },
                {
                  name: 'links',
                  type: 'array',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'url', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            { name: 'contactEmail', type: 'email', admin: { description: 'Shown on the contact page + where the contact form and order alerts are sent.' } },
            { name: 'contactSidebarHeading', type: 'text', defaultValue: 'Get in Touch' },
            { name: 'responseTimeLabel', type: 'text', defaultValue: 'Response Time' },
            { name: 'responseTimeText', type: 'textarea' },
            { name: 'socialLabel', type: 'text', defaultValue: 'Social Media' },
            { name: 'socialText', type: 'textarea' },
            { name: 'quickHelpLabel', type: 'text', defaultValue: 'Quick Help' },
            { name: 'quickHelpText', type: 'textarea' },
            { name: 'contactFormHeading', type: 'text', defaultValue: 'Send Us a Message' },
          ],
        },
        {
          label: 'Homepage',
          fields: [
            { name: 'heroEyebrow', type: 'text' },
            { name: 'heroTitle', type: 'text' },
            { name: 'heroText', type: 'textarea' },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            { name: 'heroCtaPrimaryText', type: 'text' },
            { name: 'heroCtaPrimaryLink', type: 'text' },
            { name: 'heroCtaSecondaryText', type: 'text' },
            { name: 'heroCtaSecondaryLink', type: 'text' },
            { name: 'featuredHeading', type: 'text' },
            { name: 'featuredSubtitle', type: 'textarea' },
            { name: 'storyHeading', type: 'text' },
            { name: 'storyText', type: 'textarea', admin: { description: 'Blank lines split paragraphs.' } },
            { name: 'storyImage', type: 'upload', relationTo: 'media' },
            { name: 'storyCtaText', type: 'text' },
            { name: 'storyCtaLink', type: 'text' },
            { name: 'uspHeading', type: 'text' },
            { name: 'uspSubtitle', type: 'textarea' },
            {
              name: 'uspCards',
              type: 'array',
              admin: { description: 'Why-choose-us cards.' },
              fields: [
                { name: 'icon', type: 'text', admin: { description: 'Emoji, e.g. 🌱.' } },
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea', required: true },
              ],
            },
            { name: 'ctaHeading', type: 'text' },
            { name: 'ctaText', type: 'textarea' },
            { name: 'ctaButtonText', type: 'text' },
            { name: 'ctaButtonLink', type: 'text' },
          ],
        },
        {
          label: 'SEO & Branding',
          fields: [
            { name: 'siteName', type: 'text', defaultValue: 'Centrifungal' },
            { name: 'siteLogo', type: 'upload', relationTo: 'media' },
            { name: 'defaultMetaTitle', type: 'text' },
            { name: 'defaultMetaDescription', type: 'textarea' },
            { name: 'defaultOgImage', type: 'upload', relationTo: 'media', admin: { description: 'Default social-share image.' } },
            { name: 'organizationDescription', type: 'textarea', admin: { description: 'Used in the site-wide JSON-LD Organization schema.' } },
          ],
        },
      ],
    },
  ],
}
