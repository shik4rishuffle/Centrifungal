## Task 214: Responsive Design - Mobile-First, Tested Across Breakpoints
**Phase:** 5 | **Agent:** frontend
**Priority:** High | **Status:** TODO
**Est. Effort:** M | **Dependencies:** TASK-202, TASK-203, TASK-204, TASK-205, TASK-207, TASK-208, TASK-209, TASK-210, TASK-211

### Context
The site must work flawlessly on mobile, tablet, and desktop. While each page template task includes basic responsiveness, this is a dedicated pass to catch edge cases, test across real breakpoints, and ensure a consistent mobile-first experience.

### What Needs Doing
1. Define and document breakpoints in design tokens:
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px
   - Large desktop: > 1440px
2. Audit every page at each breakpoint:
   - Verify no horizontal overflow or content clipping.
   - Verify touch targets meet 44x44px minimum.
   - Verify text is readable without zooming (minimum 16px body text on mobile).
   - Verify images scale correctly and do not stretch.
   - Verify navigation is usable (hamburger menu on mobile, full nav on desktop).
3. Test specific interactions on mobile:
   - Cart add/remove/update works via touch.
   - Product variant selector is easy to tap.
   - Form inputs are properly sized and do not trigger unwanted zoom on iOS (min 16px font-size on inputs).
   - Checkout button is prominent and easy to reach.
4. Fix all issues found during audit.
5. Test on real devices or accurate emulators: iPhone SE (375px), iPhone 14 (390px), iPad (768px), standard laptop (1366px), desktop (1920px).

### Files
- Modify `src/css/design-tokens.css` (add breakpoint tokens)
- Modify `src/css/components.css` (responsive fixes)
- Modify all `src/*.html` and `src/css/*.css` files as needed

### How to Test
- Every page passes visual inspection at 375px, 640px, 768px, 1024px, 1440px, and 1920px widths.
- No horizontal scrollbar appears on any page at any width.
- All interactive elements are usable via touch on mobile.
- iOS Safari: no input zoom bug (inputs have >= 16px font-size).
- Chrome DevTools device emulation shows no layout issues across standard device presets.
- Lighthouse Accessibility score 90+ on mobile.

### Unexpected Outcomes
- If a component from TASK-201 fundamentally breaks at a certain breakpoint and needs a structural redesign, flag for component revision rather than patching with overrides.
- If mobile performance degrades significantly (e.g. product grid with many images), flag for discussion on pagination or "load more" pattern.

### On Completion
Notify orchestrator that all frontend tasks are complete. Frontend is ready for integration testing with backend API.
