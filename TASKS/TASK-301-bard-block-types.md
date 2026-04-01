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
