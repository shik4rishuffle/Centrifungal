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
