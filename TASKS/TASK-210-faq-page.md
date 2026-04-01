## Task 210: FAQ Page Template
**Phase:** 3 | **Agent:** frontend
**Priority:** Low | **Status:** TODO
**Est. Effort:** S | **Dependencies:** TASK-201

### Context
A FAQ page reduces support queries. Content is CMS-managed. The UI pattern is an accordion/collapsible sections.

### What Needs Doing
1. Build a FAQ page with:
   - **Page header:** title and intro text.
   - **FAQ accordion:** collapsible question/answer sections. Click to expand, click again to collapse. Only one open at a time (or allow multiple - choose the better UX).
   - **Category grouping (optional):** if FAQs span categories (Ordering, Shipping, Growing, Returns), group under headings.
2. Build the accordion as a reusable vanilla JS component.
3. Use semantic HTML (`<details>`/`<summary>` as progressive enhancement base, enhanced with JS for animation and single-open behaviour).
4. Populate with placeholder FAQ content relevant to a mushroom-growing e-commerce business.

### Files
- `src/faq.html` (create)
- `src/js/faq.js` (create - accordion behaviour)

### How to Test
- FAQ items render with questions visible and answers collapsed by default.
- Clicking a question expands its answer with smooth animation.
- Accordion is keyboard-accessible (Enter/Space to toggle, Tab to navigate).
- Works without JS (native `<details>`/`<summary>` fallback).
- Content is readable on mobile.

### Unexpected Outcomes
- None expected - straightforward component.

### On Completion
Queue TASK-211 (Order Confirmation Page) if not already queued.
