# Phase 3 - CMS Task Breakdown

Date: 2026-03-31

---

## Task 300: Statamic 6 CMS Configuration
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** none

### Context
Everything else in the CMS layer depends on a working Statamic 6 installation with the control panel enabled, an admin user created, and sensible defaults configured. This is the foundation task.

### What Needs Doing
1. Install Statamic 6 into the existing Laravel 12 project (if not already scaffolded by backend agent)
2. Enable the control panel in `config/statamic/cp.php` - set route prefix to `/cp`
3. Create the owner admin user via `php please make:user` with super admin role
4. Configure `config/statamic/system.php` - set locale to `en_GB`, timezone to `Europe/London`
5. Set `config/statamic/editions.php` to `core` (free tier - 1 user, 1 form)
6. Confirm Blade is the configured template engine (not Antlers) per architect decision
7. Disable public user registration - confirm `config/statamic/users.php` has no public registration routes
8. Configure `.env` entries for `APP_URL` pointing to the Railway backend domain
9. Ensure the control panel is only accessible over HTTPS in production (enforce via middleware or Railway config)

### Files
- `config/statamic/cp.php`
- `config/statamic/system.php`
- `config/statamic/editions.php`
- `config/statamic/users.php`
- `resources/users/*.yaml` (admin user file)
- `.env` / `.env.example`

### How to Test
- Visit `/cp` and confirm the login screen loads
- Log in with the owner credentials and confirm super admin access
- Confirm no public registration link exists on the login page
- Confirm Blade templates are being used (create a test route rendering a Blade view with Statamic data)
- Confirm locale displays dates in UK format (dd/mm/yyyy)

### Unexpected Outcomes
- If Statamic 6 is not yet compatible with the installed Laravel 12 version, flag the version mismatch
- If the free tier restricts any required feature (forms, users), flag immediately

### On Completion
Queue TASK-301 (Bard block types) and TASK-305 (image upload handling) - both can run in parallel.

---

## Task 301: Bard Block Types Configuration
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-300

### Context
The Bard block editor is the owner's primary tool for building pages. Each block type must map 1:1 to a frontend component template. The frontend agent needs this list to build matching Blade partials. This task defines the content contract between CMS and frontend.

### What Needs Doing
1. Create a Bard fieldtype configuration with the following block sets (each set = one frontend component):
   - **hero** - fields: heading (text), subheading (text), background_image (assets), cta_text (text), cta_link (link)
   - **text_block** - fields: body (textarea/rich text, limited to bold/italic/links/lists only)
   - **image** - fields: image (assets), alt_text (text), caption (text, optional)
   - **image_text** - fields: image (assets), alt_text (text), body (textarea), image_position (button_group: left/right)
   - **cta_banner** - fields: heading (text), body (text), button_text (text), button_link (link), style (button_group: primary/secondary)
   - **product_highlight** - fields: products (entries relationship to products collection, max 4)
   - **faq_group** - fields: items (replicator with question (text) + answer (textarea) pairs)
   - **gallery** - fields: images (assets, max 12), columns (button_group: 2/3/4)
2. For each set, write a corresponding Blade partial at `resources/views/components/bard/{set_name}.blade.php` with placeholder markup and a comment noting the expected variables
3. Restrict Bard rich text to a safe subset - no tables, no raw HTML, no embeds, no code blocks
4. Configure display names and icons for each set so the owner sees friendly labels (e.g. "Hero Banner", "Text Block", "Call to Action")
5. Set sensible field validation - required fields marked, character limits where appropriate

### Files
- `resources/fieldsets/bard_page_content.yaml` (or inline in blueprints)
- `resources/views/components/bard/hero.blade.php`
- `resources/views/components/bard/text_block.blade.php`
- `resources/views/components/bard/image.blade.php`
- `resources/views/components/bard/image_text.blade.php`
- `resources/views/components/bard/cta_banner.blade.php`
- `resources/views/components/bard/product_highlight.blade.php`
- `resources/views/components/bard/faq_group.blade.php`
- `resources/views/components/bard/gallery.blade.php`

### How to Test
- In the control panel, open any page using the Bard field and confirm all 8 block types appear in the "Add Set" menu with friendly names
- Add one of each block type, fill in fields, save, and confirm the data persists correctly in the YAML flat file
- Confirm rich text fields do not offer table, HTML, embed, or code block buttons
- Confirm the product_highlight block allows selecting products from the products collection
- Confirm the faq_group replicator allows adding/removing/reordering Q&A pairs

### Unexpected Outcomes
- If Statamic 6 Bard API has changed set configuration syntax from v5, flag the migration path
- If any field type needed (e.g. link picker) is not available in Core free tier, flag immediately

### On Completion
Notify frontend agent that block type contracts are defined. Queue TASK-304 (page blueprints) which depends on these block types.

---

## Task 302: Product Collection Blueprint
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-300

### Context
Products are the core of the shop. The blueprint must capture all data the frontend and Stripe integration need while keeping the editing experience simple for the owner. Products are stored as Statamic flat-file entries but must expose data via API for the frontend to consume.

### What Needs Doing
1. Create a `products` collection in `content/collections/products.yaml`
   - Route: `/products/{slug}`
   - Sort order: manual (owner can drag to reorder)
   - Enable published/draft toggle (draft = not visible on frontend)
2. Create the product blueprint with these fields:
   - **name** (text, required, max 120 chars)
   - **description** (Bard, restricted to text_block set only - keeps product descriptions simple)
   - **price** (integer, required, stored in pence - display helper shows GBP) - add instructions text: "Enter price in pence, e.g. 1299 = GBP 12.99"
   - **sizes_variants** (replicator) - each row: variant_name (text, required), price_override (integer, optional), sku (text, required), in_stock (toggle, default true)
   - **images** (assets, max 8, required min 1) - linked to product-images asset container
   - **category** (select: grow-logs, colonised-dowels, diy-kits, tinctures)
   - **in_stock** (toggle, default true) - master stock toggle; if false, overrides all variant toggles
   - **weight_grams** (integer, required) - needed for Royal Mail shipping calculation
   - **stripe_price_id** (text, hidden from owner in UI but present in blueprint for backend use)
3. Add field instructions/help text to every field so the owner understands what each one does
4. Configure the collection listing columns to show: name, category, price (formatted), in_stock status
5. Enable search on the collection so the owner can find products quickly

### Files
- `content/collections/products.yaml`
- `resources/blueprints/collections/products/product.yaml`

### How to Test
- In the control panel, navigate to Products and confirm the "Create Product" button is visible
- Create a product with all fields filled, including multiple size variants and multiple images
- Save and confirm the YAML entry file is created in `content/collections/products/`
- Confirm the listing view shows name, category, formatted price, and stock status columns
- Confirm the search bar filters products by name
- Confirm draft products do not appear via the content API

### Unexpected Outcomes
- If Statamic 6 replicator has changed its data structure, flag for frontend agent
- If the integer-in-pence approach creates UX confusion during testing, flag - may need a custom fieldtype with GBP formatting

### On Completion
Queue TASK-303 (product management UX refinement). Notify backend agent that the product data structure is defined for API integration.

---

## Task 303: Product Management UX
**Phase:** 3 | **Agent:** cms
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-302

### Context
The owner must be able to create, edit, and archive products without any code or developer assistance. This task focuses on the end-to-end UX flow and ensures nothing is confusing or error-prone.

### What Needs Doing
1. Configure the product listing view to show clear status indicators:
   - Green dot for in-stock, red dot for out-of-stock
   - "Draft" badge for unpublished products
2. Ensure the "Archive" workflow uses Statamic's unpublish/draft mechanism - the owner sets a product to draft to hide it from the frontend rather than deleting it (prevents accidental data loss)
3. Add field conditions to the blueprint:
   - `sizes_variants` replicator should show a helper message when empty: "Add at least one size/variant for this product"
   - `price_override` in variants should only display if the variant name is not empty
4. Test the full owner workflow end-to-end:
   - Create a new product with 2 variants and 3 images
   - Edit the product - change price, add a variant, remove an image
   - Archive the product (set to draft) - confirm it disappears from the frontend API
   - Unarchive it (publish again) - confirm it reappears
5. Confirm image reordering works via drag-and-drop in the assets field
6. Confirm the owner cannot accidentally delete a product that has been referenced in past orders (flag if Statamic does not have referential integrity protection - this may need backend intervention)

### Files
- `resources/blueprints/collections/products/product.yaml` (field conditions and display tweaks)
- `content/collections/products.yaml` (listing config)

### How to Test
- Owner persona test: without reading any documentation, can a non-technical person create a product, edit it, and archive it using only the control panel UI?
- Confirm that draft products return no results via the Statamic REST/GraphQL API
- Confirm image drag-and-drop reordering persists after save
- Confirm all validation messages appear in plain English (no field handles or technical jargon)

### Unexpected Outcomes
- If Statamic does not support conditional field display in the way described, flag for alternative approach
- If product deletion is possible and cannot be prevented, flag for backend agent to implement soft-delete protection

### On Completion
Product CMS workflow is complete. No direct dependency - but feeds into TASK-309 (owner runbook).

---

## Task 304: Page Blueprints
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-301

### Context
Each page on the site needs a blueprint that gives the owner the right editing tools. Some pages are fully flexible (homepage), others have fixed structure with editable content (contact, FAQ). Blueprints must match the frontend templates 1:1.

### What Needs Doing
1. Create a `pages` collection (or use Statamic's default pages structure) with these entries and blueprints:

   **Homepage** (`homepage` blueprint):
   - page_content (Bard - all block types available: hero, text_block, image, image_text, cta_banner, product_highlight, gallery)
   - seo_title (text, max 60), seo_description (textarea, max 160)

   **About** (`about` blueprint):
   - page_content (Bard - block types: hero, text_block, image, image_text, gallery)
   - seo_title, seo_description

   **Care Instructions** (`care_instructions` blueprint):
   - page_content (Bard - block types: text_block, image, image_text, faq_group)
   - seo_title, seo_description

   **FAQ** (`faq` blueprint):
   - intro_text (textarea - short intro above the FAQ list)
   - faq_items (replicator: question (text) + answer (textarea) pairs)
   - seo_title, seo_description

   **Contact** (`contact` blueprint):
   - intro_text (textarea)
   - email_address (text, for display only)
   - form_enabled (toggle, default true) - allows owner to temporarily disable the form
   - seo_title, seo_description

2. For each blueprint, add field instructions explaining what each field does
3. Create the initial content entries with placeholder text so the owner has a starting point
4. Configure the pages structure as a tree (not flat) so pages can be nested if needed later
5. Set the homepage as the root entry

### Files
- `resources/blueprints/collections/pages/homepage.yaml`
- `resources/blueprints/collections/pages/about.yaml`
- `resources/blueprints/collections/pages/care_instructions.yaml`
- `resources/blueprints/collections/pages/faq.yaml`
- `resources/blueprints/collections/pages/contact.yaml`
- `content/collections/pages.yaml`
- `content/collections/pages/*.md` (initial content entries)

### How to Test
- In the control panel, confirm all 5 pages are listed and editable
- Edit the homepage - add one of each available block type, save, reload, confirm all data persists
- Edit the FAQ page - add 5 Q&A pairs, reorder them, save, confirm order persists
- Edit the Contact page - toggle form_enabled off, save, confirm the toggle persists
- Confirm each page only shows the block types allowed for that blueprint (e.g. Care Instructions should not offer product_highlight)
- Confirm SEO fields appear on every page

### Unexpected Outcomes
- If Statamic 6 does not support per-blueprint Bard set restrictions, flag - may need separate Bard fieldsets per blueprint
- If the pages tree structure conflicts with Statamic's routing, flag for backend agent

### On Completion
All page editing is configured. Notify frontend agent that page data contracts are finalised. Feeds into TASK-309 (owner runbook).

---

## Task 305: Image Upload Handling
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-300

### Context
The owner will upload product photos and page images regularly. Uploads must be validated server-side to prevent oversized files, wrong formats, or storage abuse. The asset container config also determines where images are stored and how they are served.

### What Needs Doing
1. Create asset containers:
   - **product-images** - for product photos, stored in `storage/app/public/products/`
   - **page-images** - for page content images (Bard blocks), stored in `storage/app/public/pages/`
2. Configure server-side upload validation in each container:
   - Allowed types: `jpg`, `jpeg`, `png`, `webp`
   - Max file size: 5MB per image
   - No SVG, GIF, or other formats (reduces attack surface)
3. Configure image manipulation (Statamic Glide integration):
   - Product images: generate thumbnails at 400x400 and detail view at 1200x1200
   - Page images: max width 1600px, auto-compress to 80% quality
   - Serve WebP where browser supports it
4. Set the public disk symlink (`php artisan storage:link`) - ensure this is included in the deployment script
5. Add validation error messages in plain English: "Image must be a JPG, PNG, or WebP file" and "Image must be smaller than 5MB"
6. Test that oversized and wrong-format uploads are rejected with the friendly error message

### Files
- `content/assets/product-images.yaml`
- `content/assets/page-images.yaml`
- `config/statamic/assets.php`
- `config/filesystems.php` (public disk config)
- Deployment script (add `storage:link` step)

### How to Test
- Upload a 3MB JPG to product-images - confirm it succeeds
- Upload a 6MB JPG - confirm it is rejected with "Image must be smaller than 5MB"
- Upload a `.svg` file - confirm it is rejected with "Image must be a JPG, PNG, or WebP file"
- Upload a `.php` file disguised as `.jpg` - confirm it is rejected (MIME type validation, not just extension)
- Confirm Glide-generated thumbnails are created and served correctly
- Confirm WebP conversion works when requested via Glide URL parameters

### Unexpected Outcomes
- If Railway's persistent volume path differs from local dev storage paths, flag for backend agent to reconcile
- If Glide is not included in Statamic 6 Core, flag - may need a separate image processing package
- If MIME type validation is not built into Statamic's asset upload, flag for custom validation middleware

### On Completion
Image handling is production-ready. No blocking dependencies - but TASK-302 (product blueprint) references the product-images container, so confirm it is correctly linked.

---

## Task 306: Navigation Management
**Phase:** 3 | **Agent:** cms
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-304

### Context
The owner needs to control which pages appear in the site navigation and in what order, without editing code. Statamic has a built-in navigation feature that supports this.

### What Needs Doing
1. Create a navigation structure called `main_nav` in Statamic
2. Populate it with the default pages: Home, Products (links to product listing), About, Care Instructions, FAQ, Contact
3. Configure the navigation to support:
   - Reordering via drag-and-drop
   - Adding new entries (link to internal pages or external URLs)
   - Removing entries
   - Maximum 1 level of nesting (no deep dropdowns - keeps mobile UX simple)
4. Create a Blade partial `resources/views/components/navigation.blade.php` that reads from the `main_nav` structure and renders a `<nav>` element
5. Add field instructions in the CP: "Drag items to reorder. The order here matches the order on your website."

### Files
- `content/navigation/main_nav.yaml`
- `resources/views/components/navigation.blade.php`

### How to Test
- In the control panel, navigate to Navigation > Main Nav
- Confirm all default pages are listed
- Drag to reorder - save - confirm the frontend nav renders in the new order
- Add a new external link (e.g. Instagram profile URL) - confirm it appears in the nav
- Remove an item - confirm it disappears from the frontend nav
- Attempt to nest deeper than 1 level - confirm it is prevented or clearly limited

### Unexpected Outcomes
- If Statamic 6 navigation structure syntax has changed from v5, flag the migration steps
- If max nesting depth cannot be enforced via config, note this in the owner runbook as a guideline

### On Completion
Navigation is owner-managed. Feeds into TASK-309 (owner runbook).

---

## Task 307: Order Visibility in CMS Admin
**Phase:** 3 | **Agent:** cms
**Priority:** Medium | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-300

### Context
The owner needs to see incoming orders without accessing the database directly. Orders are stored in SQLite (not flat files) because they are transactional data. This task creates a read-only order view inside the Statamic control panel.

### What Needs Doing
1. Create a custom Statamic CP section called "Orders" using a custom addon or CP nav extension
2. Build an Eloquent model `App\Models\Order` that reads from the SQLite `orders` table (table created by backend agent)
3. Create a listing view showing: order number, customer name, email, total (formatted GBP), status (paid/shipped/delivered), date created
4. Create a detail view showing: full order items (product name, variant, quantity, price), shipping address, tracking number (if available), status timeline
5. All views are read-only - the owner cannot edit or delete orders from the CMS
6. Add a search/filter bar: filter by status, search by order number or customer name
7. Register the Orders section in the CP navigation with an appropriate icon
8. Paginate the listing (20 orders per page)

### Files
- `app/Models/Order.php` (if not already created by backend agent)
- `app/Providers/CmsServiceProvider.php` or equivalent (CP nav registration)
- `app/Http/Controllers/CP/OrdersController.php`
- `resources/views/cp/orders/index.blade.php`
- `resources/views/cp/orders/show.blade.php`

### How to Test
- Log into the control panel and confirm "Orders" appears in the left sidebar
- With test order data in SQLite, confirm orders display with correct formatting
- Click an order to see the detail view - confirm all fields render correctly
- Confirm the owner cannot edit any order fields (no save button, no editable inputs)
- Confirm search filters work: filter by "shipped" status, search by order number
- Confirm pagination works with >20 orders

### Unexpected Outcomes
- If the backend agent has not yet created the orders table/model, flag as a dependency blocker
- If Statamic 6's CP extension API has changed significantly, flag for research
- If connecting to SQLite from within Statamic's flat-file context causes issues, flag for backend agent

### On Completion
Owner can see all orders. Feeds into TASK-309 (owner runbook). Notify backend agent that the orders CP view expects specific table columns.

---

## Task 308: Contact Form Submissions in CMS Admin
**Phase:** 3 | **Agent:** cms
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-300, TASK-304

### Context
The contact form is handled by Statamic's built-in form feature (included in Core free tier - 1 form). Submissions should be viewable in the control panel so the owner can read and respond to customer messages.

### What Needs Doing
1. Create a Statamic form called `contact` with fields:
   - name (text, required)
   - email (email, required)
   - message (textarea, required, max 2000 chars)
   - honeypot field for basic spam protection (Statamic has built-in honeypot support)
2. Configure the form in `resources/forms/contact.yaml`
3. Enable the submission listing in the control panel - confirm submissions are viewable under Forms > Contact
4. Configure email notification: when a form is submitted, send an email to the owner's configured email address via Resend (uses Laravel mail driver)
5. Add basic rate limiting to the form endpoint to prevent spam floods (e.g. max 5 submissions per IP per hour)
6. Ensure the form submission endpoint returns structured JSON (for the static frontend to consume via fetch/AJAX)
7. Create a Blade partial `resources/views/forms/contact.blade.php` as a reference for the frontend agent (though the actual form will be in static HTML calling the API)

### Files
- `resources/forms/contact.yaml`
- `resources/blueprints/forms/contact.yaml`
- `config/statamic/forms.php`
- `resources/views/forms/contact.blade.php` (reference template)

### How to Test
- Submit the contact form via the API endpoint with valid data - confirm a 200 response
- Check the control panel under Forms > Contact - confirm the submission appears with name, email, message, and timestamp
- Submit with missing required fields - confirm validation errors return as structured JSON
- Submit 6 times rapidly from the same IP - confirm the 6th is rate-limited
- Confirm the honeypot field rejects submissions where it is filled in
- Confirm the owner receives an email notification for each legitimate submission

### Unexpected Outcomes
- If Statamic 6 form API responses have changed format, flag for frontend agent
- If the free tier's 1-form limit prevents adding additional forms later, document this limitation
- If Resend integration requires additional config beyond Laravel's mail driver, flag for backend agent

### On Completion
Contact form is fully configured. Feeds into TASK-309 (owner runbook).

---

## Task 309: Owner Runbook
**Phase:** 3 | **Agent:** cms
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-301, TASK-302, TASK-303, TASK-304, TASK-306, TASK-307, TASK-308

### Context
The owner is a non-developer. Once the site is handed over, they need a plain-language guide covering every day-to-day task. This is critical for owner self-sufficiency - identified as a medium-likelihood, high-impact risk in the architecture plan.

### What Needs Doing
1. Write a runbook document covering these workflows with step-by-step instructions and screenshots (or screenshot placeholders for the frontend agent to fill):

   **Logging In**
   - How to access the control panel (URL, credentials)
   - What to do if you forget your password

   **Adding a New Product**
   - Step-by-step: navigate to Products > Create, fill in each field, upload images, add variants, set price, publish
   - How pricing works (pence to pounds)
   - How to set a product as out of stock

   **Editing a Product**
   - How to find and edit an existing product
   - How to add/remove variants
   - How to replace images
   - How to archive (unpublish) a product

   **Editing Pages**
   - How to navigate to a page
   - How to add, reorder, and remove content blocks
   - What each block type does (with a visual reference)
   - How to upload images within page content

   **Managing Navigation**
   - How to reorder menu items
   - How to add or remove a page from the menu

   **Viewing Orders**
   - How to find the orders list
   - How to read order details
   - What each status means (paid, shipped, delivered)
   - Note: orders are read-only in the CMS

   **Viewing Contact Form Submissions**
   - Where to find submissions
   - How to read and respond (respond via their own email client - CMS does not send replies)

   **Troubleshooting**
   - "I can't log in" - password reset procedure
   - "My changes aren't showing on the website" - check published status, clear cache
   - "Image upload failed" - check file size and format
   - "I need help" - how to contact the developer

2. Write in plain English, no jargon, short sentences
3. Use numbered steps for every procedure
4. Format as a standalone HTML page or PDF that the owner can bookmark

### Files
- `docs/owner-runbook.md` (source)
- `public/runbook/index.html` (generated, accessible to owner) - or delivered as PDF

### How to Test
- Hand the runbook to a non-technical person and ask them to complete these tasks using only the runbook:
  1. Add a new product with 2 variants and 3 images
  2. Edit the homepage to add a new text block
  3. Find the most recent order
  4. Read a contact form submission
- All 4 tasks should be completable without asking for help
- All terminology in the runbook matches the terminology in the CMS control panel exactly

### Unexpected Outcomes
- If the control panel labels differ from what is documented (Statamic update changed terminology), update the runbook to match
- If screenshot generation is blocked (no browser automation available), use annotated text descriptions as placeholders and flag for manual screenshots

### On Completion
Owner runbook is complete. CMS phase is fully delivered. Output: `OUTPUT READY - cms-output.md written`
