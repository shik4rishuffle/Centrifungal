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
