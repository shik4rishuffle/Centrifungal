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
