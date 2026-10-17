/**
 * Centrifungal CMS seeder (idempotent, skip-on-exists).
 *
 * Seeds the 4 product categories, the SiteSettings global (all copy that used to
 * be hardcoded), and the About/Contact/FAQ/Care-Instructions pages. No products
 * (clean-slate decision - Tom adds those in the admin). Images are NOT seeded
 * (no media in the repo); upload the logo/hero/story images in the admin.
 *
 * Content is taken verbatim from CONTENT_INVENTORY.md.
 *
 * Usage (Phase 6, against a running Payload):
 *   PAYLOAD_API_URL=https://cms-centrifungal.dev.skeleton-crew.co.uk/api \
 *   PAYLOAD_API_KEY=<key> node scripts/cms/seed.mjs
 *
 * The API key comes from a Payload admin user (Users -> API Keys). Order:
 * provision -> create first admin in the browser -> generate API key -> run this.
 */

const API_URL = process.env.PAYLOAD_API_URL;
const API_KEY = process.env.PAYLOAD_API_KEY;

if (!API_URL || !API_KEY) {
  console.error('Set PAYLOAD_API_URL and PAYLOAD_API_KEY.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `users API-Key ${API_KEY}`,
};

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiSend(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, { method, headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ---------- Lexical richtext builders (Payload default editorState) ---------- */
function text(t) {
  return { type: 'text', text: t, format: 0, style: '', mode: 'normal', detail: 0, version: 1 };
}
function paragraph(t) {
  return { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: [text(t)] };
}
function heading(tag, t) {
  return { type: 'heading', tag, format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] };
}
function orderedList(items) {
  return {
    type: 'list',
    listType: 'number',
    start: 1,
    tag: 'ol',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: items.map((t, i) => ({
      type: 'listitem',
      value: i + 1,
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [text(t)],
    })),
  };
}
function richText(children) {
  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } };
}

/* ---------- Content ---------- */
const CATEGORIES = [
  { name: 'Grow Logs', slug: 'grow-logs', description: 'Ready-to-fruit logs - just mist and harvest.', icon: '🍄', sortOrder: 1 },
  { name: 'Colonised Dowels', slug: 'colonised-dowels', description: 'Inoculate your own logs for years of harvests.', icon: '🪵', sortOrder: 2 },
  { name: 'DIY Kits', slug: 'diy-kits', description: 'Everything you need to grow mushrooms at home.', icon: '📦', sortOrder: 3 },
  { name: 'Tinctures', slug: 'tinctures', description: 'Double-extracted mushroom supplements for daily wellness.', icon: '🧪', sortOrder: 4 },
];

const SITE_SETTINGS = {
  navLinks: [
    { label: 'Home', url: '/' },
    { label: 'Shop', url: '/shop' },
    { label: 'About', url: '/about' },
    { label: 'Care', url: '/care-instructions' },
    { label: 'FAQ', url: '/faq' },
    { label: 'Contact', url: '/contact' },
  ],
  footerTagline: 'Artisan mushroom grow logs, cultivated with care. Bringing the forest floor to your front door.',
  footerCopyright: '© 2026 Centrifungal. All rights reserved.',
  socialLinks: [
    { platform: 'instagram', url: '#', label: 'Instagram' },
    { platform: 'facebook', url: '#', label: 'Facebook' },
  ],
  footerColumns: [
    { title: 'Shop', links: [
      { label: 'All Products', url: '/shop' },
      { label: 'Grow Logs', url: '/shop#category-grow-logs' },
      { label: 'Colonised Dowels', url: '/shop#category-colonised-dowels' },
    ] },
    { title: 'Help', links: [
      { label: 'Care Instructions', url: '/care-instructions' },
      { label: 'FAQ', url: '/faq' },
      { label: 'Contact', url: '/contact' },
    ] },
    { title: 'Company', links: [
      { label: 'About Us', url: '/about' },
    ] },
  ],
  contactEmail: 'hello@centrifungal.co.uk',
  contactSidebarHeading: 'Get in Touch',
  responseTimeLabel: 'Response Time',
  responseTimeText: 'We aim to reply within 24 hours on weekdays. If you message us over the weekend, we will get back to you on Monday.',
  socialLabel: 'Social Media',
  socialText: 'Follow us on Instagram for growing tips, harvest photos, and behind-the-scenes updates.',
  quickHelpLabel: 'Quick Help',
  quickHelpText: 'Check our FAQ and Care Instructions for answers to common questions.',
  contactFormHeading: 'Send Us a Message',
  heroEyebrow: 'Premium Mushroom Grow Logs',
  heroTitle: 'Grow Gourmet Mushrooms at Home',
  heroText: 'Hand-inoculated hardwood logs that fruit again and again. No experience needed - just mist, wait, and harvest fresh mushrooms from your kitchen counter.',
  heroCtaPrimaryText: 'Shop Grow Logs',
  heroCtaPrimaryLink: '/shop',
  heroCtaSecondaryText: 'Care Guides',
  heroCtaSecondaryLink: '/care-instructions',
  featuredHeading: 'Our Grow Logs',
  featuredSubtitle: 'Each log is hand-inoculated with premium spawn and grown on sustainably sourced British hardwood.',
  storyHeading: 'Rooted in the Forest, Made for Your Home',
  storyText:
    'Centrifungal started with a simple idea - that anyone should be able to grow fresh, gourmet mushrooms without a garden or any special equipment. Our logs are inoculated by hand in small batches using spawn we cultivate ourselves, then slowly colonised in controlled conditions before reaching you.\n\nThe result? Mushrooms that taste like they were foraged minutes ago.',
  storyCtaText: 'Our Story',
  storyCtaLink: '/about',
  uspHeading: 'Why Centrifungal?',
  uspSubtitle: "From our woodland to your doorstep - here's what makes us different.",
  uspCards: [
    { icon: '🌱', title: 'Grown Locally', text: 'Every log is produced in our woodland workshop using sustainably sourced British hardwood and spawn we cultivate in-house.' },
    { icon: '📦', title: 'Shipped Fast', text: 'Orders are dispatched within 48 hours in plastic-free, compostable packaging designed to keep your log happy in transit.' },
    { icon: '📚', title: 'Expert Care Guides', text: 'Every order includes access to our detailed care guides, video tutorials, and direct support from our growing team.' },
  ],
  ctaHeading: 'New to Mushroom Growing?',
  ctaText: 'Our free care guides cover everything from first misting to your fifth harvest. Written by growers, for growers.',
  ctaButtonText: 'Explore Care Guides',
  ctaButtonLink: '/care-instructions',
  siteName: 'Centrifungal',
  defaultMetaTitle: 'Centrifungal - Premium Mushroom Grow Logs',
  defaultMetaDescription:
    "Grow gourmet mushrooms at home with Centrifungal's hand-inoculated hardwood grow logs. Sustainably sourced British wood, shipped to your door. No experience needed.",
  organizationDescription:
    'Premium mushroom grow logs, hand-inoculated and shipped from our woodland workshop in the heart of Britain.',
};

const PAGES = [
  {
    title: 'About',
    slug: 'about',
    subtitle: 'Our Story',
    metaTitle: 'About Centrifungal - UK Mushroom Grow Logs',
    metaDescription: 'Learn about Centrifungal, a small UK-based mushroom grow log business dedicated to making home mushroom growing simple and accessible.',
    layout: [
      { blockType: 'textBlock', body: richText([
        paragraph('Welcome to Centrifungal. We are a small UK-based business passionate about making mushroom growing accessible to everyone. Whether you are a complete beginner or an experienced grower, our products are designed to make the process simple and rewarding.'),
      ]) },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    subtitle: 'Get in Touch',
    metaTitle: 'Contact Centrifungal',
    metaDescription: 'Have a question about our mushroom grow logs or your order? Get in touch with the Centrifungal team.',
    layout: [
      { blockType: 'textBlock', body: richText([
        paragraph('Have a question about our products, need help with your order, or just want to say hello? Fill in the form below and we will get back to you as soon as we can.'),
      ]) },
    ],
  },
  {
    title: 'FAQ',
    slug: 'faq',
    subtitle: 'Frequently Asked Questions',
    metaTitle: 'FAQ - Centrifungal Mushroom Grow Logs',
    metaDescription: 'Answers to common questions about Centrifungal mushroom grow logs, shipping, care, and more.',
    layout: [
      { blockType: 'faqGroup', items: [
        { question: 'How long does a grow log last?', answer: 'Most grow logs will produce multiple flushes of mushrooms over 2-4 years depending on the species and how well the log is cared for.' },
        { question: 'Do I need any special equipment?', answer: 'No special equipment is needed. A spray bottle for misting and a shaded spot are all you need to get started.' },
        { question: 'How long does shipping take?', answer: 'We ship via Royal Mail. Standard delivery is 2-3 working days within the UK.' },
        { question: 'Can I grow mushrooms indoors?', answer: 'Yes! Most of our grow logs work well indoors. Just find a cool, shaded spot away from direct sunlight and radiators.' },
        { question: 'What species do you offer?', answer: 'We currently offer Shiitake, Oyster, and Lions Mane grow logs. Check our shop for the latest availability.' },
        { question: 'My grow log has not produced any mushrooms yet. What should I do?', answer: 'Make sure the log is being kept moist and is in a cool, shaded location. Some logs take a few weeks to start producing. If it has been more than 4 weeks, try soaking the log in cold water overnight to trigger a flush.' },
      ] },
    ],
  },
  {
    title: 'Care Instructions',
    slug: 'care-instructions',
    subtitle: 'How to Get the Best From Your Grow Log',
    metaTitle: 'Mushroom Grow Log Care Instructions - Centrifungal',
    metaDescription: 'Step-by-step care instructions for your Centrifungal mushroom grow log. Learn how to water, position, and harvest your mushrooms.',
    layout: [
      { blockType: 'textBlock', body: richText([
        paragraph('Congratulations on your new grow log! Follow these simple steps to enjoy fresh, home-grown mushrooms.'),
        heading('h2', 'Getting Started'),
        orderedList([
          'Remove the grow log from its packaging and soak it in cold water for 24 hours.',
          'Place the log in a cool, shaded spot - indoors or outdoors. Avoid direct sunlight.',
          'Mist the log daily with water to keep it moist. A spray bottle works perfectly.',
          'Expect to see mushrooms appear within 1-3 weeks depending on the species and conditions.',
        ]),
      ]) },
    ],
  },
];

/* ---------- Seed steps (skip-on-exists) ---------- */
async function seedCategories() {
  for (const cat of CATEGORIES) {
    const existing = await apiGet(`/product-categories?where[slug][equals]=${encodeURIComponent(cat.slug)}&limit=1`);
    if (existing.totalDocs > 0) {
      console.log(`  = category ${cat.slug} exists, skip`);
      continue;
    }
    await apiSend('POST', '/product-categories', cat);
    console.log(`  + category ${cat.slug}`);
  }
}

async function seedSiteSettings() {
  const current = await apiGet('/globals/site-settings').catch(() => ({}));
  if (current && Array.isArray(current.navLinks) && current.navLinks.length > 0) {
    console.log('  = site-settings already populated, skip');
    return;
  }
  await apiSend('POST', '/globals/site-settings', SITE_SETTINGS);
  console.log('  + site-settings populated');
}

async function seedPages() {
  for (const page of PAGES) {
    const existing = await apiGet(`/pages?where[slug][equals]=${encodeURIComponent(page.slug)}&limit=1`);
    if (existing.totalDocs > 0) {
      console.log(`  = page ${page.slug} exists, skip`);
      continue;
    }
    await apiSend('POST', '/pages', page);
    console.log(`  + page ${page.slug}`);
  }
}

async function main() {
  console.log(`Seeding Centrifungal CMS at ${API_URL}`);
  console.log('Categories:');
  await seedCategories();
  console.log('Site settings:');
  await seedSiteSettings();
  console.log('Pages:');
  await seedPages();
  console.log('Done. (No products seeded - add them in the admin. Upload logo/hero images in the admin.)');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
