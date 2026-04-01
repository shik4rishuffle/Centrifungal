## Task 201: Component Library - Base Components
**Phase:** 1 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** L | **Dependencies:** TASK-200

### Context
Reusable components (buttons, cards, inputs, header, footer) are used across every page template. Building these before page templates avoids duplication and ensures visual consistency. Use the `frontend-design` skill for production-grade component generation.

### What Needs Doing
1. Use the `frontend-design` skill to generate polished, distinctive components - avoid generic/flat AI aesthetics.
2. Build each component as a standalone HTML/CSS block that consumes design tokens from TASK-200:
   - **Buttons:** primary, secondary, outline, disabled states. Sizes: small, default, large.
   - **Cards:** product card (image, title, price, CTA), content card (icon/image, title, text).
   - **Form inputs:** text input, textarea, select dropdown, checkbox. Include focus, error, and disabled states.
   - **Header:** logo, nav links (Home, Shop, About, Care Instructions, FAQ, Contact), mobile hamburger menu. Sticky on scroll.
   - **Footer:** logo, nav links, copyright, social links placeholders.
   - **Badge/tag:** for product labels (e.g. "New", "Popular").
   - **Quantity selector:** +/- stepper for cart.
   - **Alert/toast:** success and error messages for cart actions.
3. Write all styles in a `components.css` file, consuming only CSS custom properties.
4. Create a `components.html` reference page showing all components in all states.

### Files
- `src/css/components.css` (create)
- `src/components.html` (create - reference/demo page)

### How to Test
- Open `components.html` - all components render in all states (default, hover, focus, active, disabled, error).
- Components use only design tokens - no hardcoded colours, font sizes, or spacing values.
- Header hamburger menu toggles on mobile viewport (< 768px).
- All interactive elements are keyboard-accessible (tab order, focus indicators).
- Buttons and inputs meet WCAG AA touch target sizes (minimum 44x44px).

### Unexpected Outcomes
- If the design tokens from TASK-200 produce poor contrast in component context, flag for token adjustment rather than overriding locally.
- If the header nav has too many items for mobile, flag for UX discussion.

### On Completion
Queue TASK-202 through TASK-211 (all page templates) - they all depend on this component library.
