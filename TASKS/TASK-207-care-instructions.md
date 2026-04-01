## Task 207: Care Instructions Page Template
**Phase:** 3 | **Agent:** frontend
**Priority:** Medium | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-201

### Context
Care instructions are a key value-add for the brand - helping customers successfully grow their mushrooms drives repeat purchases and reduces support queries. Content is managed via the CMS Bard editor, so this template must render rich HTML content blocks.

### What Needs Doing
1. Build a care instructions page template:
   - **Page header:** title and intro text.
   - **Content area:** rendered from CMS Bard blocks - must support headings, paragraphs, images, lists, blockquotes, and embedded media.
   - **Optional sidebar or ToC:** if content is long, include a sticky table of contents generated from h2/h3 headings via JS.
   - **Related products:** optional section at bottom linking to relevant products.
2. Style the rich content area with sensible typography defaults for all Bard block types.
3. Use placeholder content that mimics real care instructions (e.g. "How to grow your oyster mushroom log").

### Files
- `src/care.html` (create)
- `src/css/content.css` (create - rich text content styling)
- `src/js/toc.js` (create - optional table of contents generator)

### How to Test
- Page renders placeholder care instructions with headings, paragraphs, images, and lists.
- If ToC is included: it generates links from headings and scrolls to sections on click.
- Content area handles all standard HTML elements with consistent styling.
- Page is readable on mobile (single column, no horizontal overflow).

### Unexpected Outcomes
- If CMS content structure differs from expected Bard HTML output, flag for CMS agent sync.

### On Completion
Queue TASK-208 (About Page Template).
