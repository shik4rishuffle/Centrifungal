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
