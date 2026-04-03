Design a bold, playful e-commerce frontend for Centrifungal - a small British
business selling artisan mushroom grow logs. The site needs to feel like
nothing else in the space. Think Oatly meets a woodland forager's zine -
quirky, confident, a bit irreverent, but still trustworthy enough to buy from.

## Brand personality
- Playful, witty, slightly weird (mushrooms ARE weird - lean into it)
- Handmade craft meets modern design confidence
- Not precious or pretentious - approachable, warm, fun
- British woodland energy - damp earth, mycelium networks, spore prints

## Design direction
- Break the hero > grid > CTA template pattern. Use unexpected layouts -
  asymmetric grids, overlapping elements, sections that flow into each other
- Typography should have real character. Mix a bold display face with
  something unexpected. Size contrast matters - go big where it counts
- Texture and illustration over stock photography. Think hand-drawn mushroom
  spots, spore print patterns, paper/kraft textures, organic blob shapes.
  The site needs to work beautifully WITHOUT product photos (none exist yet) -
  use illustration, pattern, and typography to carry the visual weight
- Color palette: move beyond safe greens. Think forest floor - rich darks,
  unexpected accent colors (spore pink? chanterelle orange? bioluminescent
  blue-green?), earthy neutrals with personality
- Micro-interactions and hover states that delight - mushrooms growing,
  spores floating, mycelium spreading

## Pages needed (all must use reusable components for a CMS-driven site)
1. **Homepage** - hero, featured products, brand story, USPs, newsletter CTA
2. **Shop** - filterable product grid with category tabs
3. **Product detail** - image gallery, variants/sizes, add to cart,
   description, related products
4. **Content pages** - About, FAQ (accordion), Care Instructions, Contact
5. **Cart** - line items, quantity controls, order summary, checkout CTA
6. **404 page** - make this one fun

## Component system (critical - this is CMS-driven)
The frontend is static HTML/CSS/JS that loads content from a headless CMS API.
Design these as reusable blocks that can be mixed and matched on any page:
- Hero banner (multiple variants: full-bleed, split, minimal)
- Text block (rich text with headings, lists, links)
- Image + text (side by side, reversible)
- Product card (used in grids and carousels)
- FAQ accordion
- CTA banner (multiple styles)
- Image gallery / grid
- Testimonial / quote block
- USP / feature cards

## Technical constraints
- Static HTML, CSS, vanilla JS only (no React/Vue/frameworks)
- Must be responsive (mobile-first)
- CSS custom properties for theming (design tokens)
- Accessible (semantic HTML, ARIA where needed, keyboard nav)
- Components should work as standalone HTML snippets that JS can inject
  into the page from CMS API responses

## What to deliver
- Full visual designs for all pages listed above
- A component library showing each reusable block in isolation
- Design tokens: colors, typography scale, spacing, border radii, shadows
- Hover/active/focus states for all interactive elements
- Mobile and desktop breakpoints minimum

## Reference mood
Oatly packaging, Fly By Jing website, Graza olive oil branding, indie zine
aesthetics, botanical illustration field guides, vintage mushroom
encyclopedias, Japanese food packaging design.

Make it the kind of site where people screenshot it and share it in design
Slack channels. Make it weird in the right way.
