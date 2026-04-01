## Task 200: Design System - Colour Palette, Typography Scale, Spacing Tokens
**Phase:** 1 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** none

### Context
Every component and page depends on a shared design system. This must land first so all downstream tasks pull from a single source of truth for colours, type, and spacing. The brand palette derives from the Centrifungal logo - gold/orange coin with dark green mushroom motif - translating to greens and warm golds/yellows.

### What Needs Doing
1. Use the `ui-ux-pro-max` skill to select a colour palette (greens + warm golds) and font pairing suited to an artisan/natural-products e-commerce brand.
2. Define CSS custom properties in a `design-tokens.css` file:
   - Primary palette: 3-4 greens (dark to light), 2-3 warm golds/yellows, 1-2 neutrals (off-white, charcoal).
   - Semantic tokens: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-error`, `--color-success`.
   - Typography scale: base size (16px), scale ratio (~1.25), levels from `--text-xs` through `--text-4xl`. Define `--font-heading` and `--font-body` families.
   - Spacing tokens: `--space-xs` through `--space-4xl` on a consistent scale (4px base).
   - Border radius, shadow, and transition tokens.
3. Create a `design-system.html` reference page that renders all tokens visually (colour swatches, type samples, spacing blocks).
4. Include a CSS reset/normalize at the top of the token file or as a companion file.

### Files
- `src/css/design-tokens.css` (create)
- `src/css/reset.css` (create)
- `src/design-system.html` (create - reference/demo page)

### How to Test
- Open `design-system.html` in a browser - all swatches, type samples, and spacing blocks render correctly.
- Greens and golds are visually harmonious and match the brand description (gold/orange coin, dark green mushroom).
- All tokens are referenced via CSS custom properties - no hardcoded hex values outside the token file.
- Passes WCAG AA contrast for text tokens against surface tokens.

### Unexpected Outcomes
- If the logo file is not yet available, flag to orchestrator - palette can still be defined from the brand description but final tuning may need a revision pass.
- If chosen Google Fonts have licensing issues or large payload, flag alternatives.

### On Completion
Queue TASK-201 (Component Library) - it depends directly on these tokens.
