# Centrifungal - Owner Runbook

This guide covers everything you need to manage the Centrifungal website through the CMS admin panel. It is written for a non-developer site owner and assumes no technical background beyond basic computer literacy.

---

## Table of Contents

1. [Logging Into the CMS](#logging-into-the-cms)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Products](#managing-products)
4. [Editing Pages](#editing-pages)
5. [Managing Navigation](#managing-navigation)
6. [Uploading Images](#uploading-images)
7. [Viewing Orders](#viewing-orders)
8. [Viewing Contact Form Submissions](#viewing-contact-form-submissions)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)
11. [Glossary](#glossary)

---

## Logging Into the CMS

1. Open your web browser and go to `https://centrifungal.co.uk/cp` (replace with your actual domain if different).
2. Enter your email address and password.
3. Click "Log In".
4. You will land on the Dashboard, which shows recent orders and quick links to products and pages.

If you have forgotten your password, click the "Forgot Password" link on the login page and follow the email instructions.

---

## Dashboard Overview

The Dashboard is your home screen after logging in. It shows:

- **Recent Orders** - the latest orders placed on the site.
- **Products** - a quick-access list of recently updated products.
- **Pages** - a quick-access list of recently updated pages.

Use the left-hand sidebar to navigate to other sections of the CMS.

---

## Managing Products

### Viewing all products

1. In the sidebar, click **Collections** then **Products**.
2. You will see a list of all products with their names and slugs.

### Adding a new product

1. Go to **Collections > Products**.
2. Click the **Create Entry** button in the top right.
3. Fill in the tabs:
   - **Basic Info** - product name, category, and description.
   - **Pricing & Stock** - price (in pence - see note below), weight, and stock toggle.
   - **Sizes & Variants** - add size options if the product has multiple sizes. Leave empty for single-size products.
   - **Images** - upload product photos. The first image becomes the main photo on the site. You can drag images to reorder.
   - **SEO** - optional meta title and description for search engines.
   - **Sidebar** - the slug (URL) is auto-generated from the name.
4. Click **Save & Publish** when finished.

**Price note:** Prices are entered in pence (not pounds). For example, to set a price of 12.99 GBP, enter `1299`.

<!-- [Screenshot placeholder: Product editing screen showing the Basic Info tab] -->

### Editing an existing product

1. Go to **Collections > Products**.
2. Click the product name to open it.
3. Make your changes across any of the tabs.
4. Click **Save** to update.

---

## Editing Pages

The site has several content pages: About, FAQ, Care Instructions, and Contact. Each page uses the Bard editor, which lets you build pages from content blocks.

### Opening a page for editing

1. In the sidebar, click **Collections** then **Pages**.
2. Click the page you want to edit (e.g. "About").

### Using the Bard editor

The Bard editor is the main content area for each page. It works like a simplified word processor with drag-and-drop content blocks.

**Basic text formatting:**

- Highlight text and use the toolbar buttons for **bold**, *italic*, links, and lists.
- Press Enter to create a new paragraph.

**Adding content blocks:**

1. Click the **+** button in the Bard editor area.
2. Choose a block type from the list:
   - **Hero Banner** - a full-width section with heading, background image, and call-to-action button.
   - **Text Block** - a rich text section for paragraphs, lists, and links.
   - **Image** - a single image with alt text and optional caption.
   - **Image + Text** - an image alongside text, with a choice of image on the left or right.
   - **Call to Action** - a prominent banner with heading, text, and a button.
   - **Product Highlight** - showcase up to 4 products from the shop.
   - **FAQ Group** - a set of question-and-answer pairs.
   - **Gallery** - a grid of images (2, 3, or 4 columns).
3. Fill in the fields for the block.
4. You can drag blocks to reorder them.

**Removing a block:**

- Hover over the block and click the trash icon that appears.

**SEO tab:**

- Optionally set a custom Meta Title (under 60 characters) and Meta Description (under 160 characters) for search engine listings. If left empty, the page title is used.

<!-- [Screenshot placeholder: Bard editor with content blocks visible] -->

---

## Managing Navigation

The main site navigation (header menu) is managed through the Navigation section.

### Editing the main navigation

1. In the sidebar, click **Navigation**.
2. Click **Main Nav**.
3. You will see the current menu items arranged as a tree.

### Reordering menu items

- Drag and drop items to change their order.
- Drag an item slightly to the right under another item to make it a child (sub-menu) item.

### Adding a new menu item

1. Click the **Add Link** button.
2. Choose the type:
   - **Entry Link** - links to an existing page or product in the CMS.
   - **URL** - links to any URL (useful for external links or custom paths).
3. Set the link title (the text that appears in the menu).
4. Click **Save** when done.

### Removing a menu item

1. Click the item to select it.
2. Click the delete/remove option.
3. Click **Save**.

---

## Uploading Images

Images can be uploaded in two places:

### From a product or page editor

1. While editing a product or page, click an image field or the image block's upload area.
2. You can either drag and drop an image file or click to browse your computer.
3. The image will be uploaded to the asset library automatically.

### From the asset library

1. In the sidebar, click **Assets**.
2. Click the **Images** container.
3. Click **Upload** and select files from your computer.
4. Uploaded images are available for use on any product or page.

**Image tips:**

- Use JPG, PNG, or WebP formats.
- For hero banners, use images at least 1920x800 pixels.
- For product photos, use square or consistent aspect ratios for a clean look.
- Always fill in the "Alt Text" field - this helps with accessibility and SEO.

---

## Viewing Orders

Orders are read-only in the CMS. You can view them but not edit or delete them.

### Viewing all orders

1. In the sidebar, click **Tools** then **Orders**.
2. You will see a paginated table showing order number, customer name, email, total, status, and date.
3. Use the page navigation at the bottom to browse through orders.

### Viewing a single order

1. From the orders list, click **View** next to the order you want to see.
2. The detail page shows:
   - Customer name, email, and shipping address.
   - Order number, date, subtotal, shipping cost, and total.
   - Tracking and shipping information (if available).
   - A list of items in the order with product names, variants, quantities, and prices.

**Order statuses:**

- **Pending** - order has been placed but payment is not yet confirmed.
- **Paid** - payment received successfully.
- **Fulfilled** - order has been packed and is ready to ship.
- **Shipped** - order is on its way to the customer.
- **Delivered** - order has been delivered.

---

## Viewing Contact Form Submissions

When customers submit the contact form on the website, their messages appear in the CMS.

### Viewing all submissions

1. In the sidebar, click **Tools** then **Contact Submissions**.
2. You will see a paginated table showing the sender's name, email, a preview of their message, and the submission date.

### Viewing a single submission

1. Click **View** next to the submission.
2. The detail page shows:
   - Name and email address (with a clickable mailto link).
   - IP address of the sender.
   - The date and time the message was submitted.
   - The full message text.

Contact submissions are read-only - you cannot edit or delete them from the CMS.

---

## Common Tasks

### Changing a product price

1. Go to **Collections > Products** and click the product.
2. Click the **Pricing & Stock** tab.
3. Update the **Price (pence)** field. Remember: enter pence, not pounds (e.g. `1499` for 14.99 GBP).
4. If the product has variants with price overrides, click the **Sizes & Variants** tab and update each variant's **Price Override** field as needed.
5. Click **Save**.

### Marking a product as out of stock

1. Go to **Collections > Products** and click the product.
2. Click the **Pricing & Stock** tab.
3. Toggle **In Stock** to off.
4. Click **Save**.

The product will show as "Out of Stock" on the website. To mark individual variants as out of stock instead, use the toggles in the **Sizes & Variants** tab.

### Adding a new product

1. Go to **Collections > Products**.
2. Click **Create Entry**.
3. Fill in all required fields across the tabs (Name, Category, Description, Price, Weight, at least one image).
4. Set the stock toggle and add any size variants.
5. Click **Save & Publish**.

### Updating the About page

1. Go to **Collections > Pages** and click **About**.
2. Edit the text blocks, add new content blocks, or rearrange existing blocks using the Bard editor.
3. Click **Save**.

### Adding a new FAQ entry

1. Go to **Collections > Pages** and click **FAQ**.
2. In the Bard editor, find the **FAQ Group** block.
3. Click "Add FAQ Item" within the block.
4. Enter the question and answer.
5. Click **Save**.

### Adding a new page to the site navigation

1. First, create the page under **Collections > Pages** if it does not exist yet.
2. Go to **Navigation > Main Nav**.
3. Click **Add Link** and choose **Entry Link**.
4. Search for and select the page.
5. Drag it into the desired position in the menu tree.
6. Click **Save**.

---

## Troubleshooting

### I cannot log in

- Double-check your email and password. Passwords are case-sensitive.
- Use the "Forgot Password" link to reset your password.
- If you still cannot log in, contact your developer (see below).

### The site is down or showing an error

1. Do not panic - most issues resolve themselves or are quick fixes.
2. Try loading the site in a different browser or incognito/private window to rule out browser caching.
3. If the site is genuinely down, contact your developer immediately with:
   - The URL you were trying to access.
   - What you see (blank page, error message, etc.).
   - What you were doing before it happened.

### Changes I made are not showing on the website

- Make sure you clicked **Save** (or **Save & Publish**) after making changes.
- Try clearing your browser cache or loading the page in an incognito/private window.
- Some changes (especially image uploads) may take a moment to propagate.

### An image is not displaying

- Check that the image was uploaded successfully in **Assets > Images**.
- Ensure the image field is filled in on the product or page.
- Verify the image format is JPG, PNG, or WebP.

### Who to contact for technical help

If you encounter an issue you cannot resolve using this guide, contact your developer:

- **Name:** [Developer name]
- **Email:** [Developer email]
- **Phone:** [Developer phone]

When reporting a problem, include as much detail as possible: what you were trying to do, what happened instead, and any error messages you see.

---

## Glossary

**Asset** - A file (usually an image) stored in the CMS that can be used on pages and products.

**Bard** - The rich content editor used on pages. It allows you to add formatted text and content blocks like images, CTAs, and FAQ groups.

**Blueprint** - The structure that defines what fields appear when editing a product, page, or other content type. You do not need to edit blueprints - they are set up by your developer.

**Collection** - A group of related content entries. Centrifungal has two main collections: Products and Pages.

**Control Panel (CP)** - The admin area of the website where you manage content, accessible at `/cp`.

**Entry** - A single item within a collection. For example, one product or one page.

**Navigation** - The menu structure that controls which links appear in the site header. Managed under the Navigation section of the CP.

**Replicator** - A field type that lets you add repeating groups of fields - for example, product variants or FAQ items.

**Slug** - The URL-friendly version of a title. For example, the page "Care Instructions" has the slug `care-instructions`, making its URL `/care-instructions`. Slugs are usually auto-generated.

**Toggle** - An on/off switch field, like the "In Stock" toggle on products.
