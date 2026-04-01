# Requirements Summary - Centrifungal v1

## Scope - In
- Homepage, product listing, product detail pages, care instructions, about, contact, FAQ
- ~10-20 SKUs: grow logs (3 types x multiple sizes), colonised dowels, DIY kits, mushroom tinctures
- Stripe Checkout with cart (multi-product checkout)
- Royal Mail Click & Drop integration - orders push automatically, tracking feeds back, marks shipped, emails customer
- Block-based CMS for owner to manage all page content and products
- Contact form
- Transactional emails via Resend (order confirmation, shipping notification with tracking)

## Scope - Out (v1)
- Customer accounts / login
- Reviews / ratings
- Blog / journal
- Discount codes / promotions
- Stock management beyond simple in/out-of-stock
- Multiple admin users

## Owner CMS Workflow (day-to-day)
- Log into Statamic control panel
- Edit page content using Bard block editor (drag/drop blocks, images, text)
- Add/edit products (name, description, price, sizes, images)
- View incoming orders, print labels via Click & Drop, tracking auto-updates

## Constraints
- Budget: ~GBP 5/month (Railway + Netlify free)
- Owner is a non-developer - CMS must be self-service
- PHP 8.5 backend, static frontend on Netlify
- SQLite with Litestream backups

## Brand
- Logo: gold/orange coin with dark green mushroom motif
- Palette: greens + warm golds/yellows drawn from logo
- Fonts: TBD (will select during design phase)

## Success Criteria
- Owner can add a new product and update any page without developer help
- Customer can browse, add multiple products to cart, and checkout via Stripe
- Orders land in Click & Drop automatically
- Shipping updates reach the customer without manual intervention
- Site loads fast (static frontend via CDN)
