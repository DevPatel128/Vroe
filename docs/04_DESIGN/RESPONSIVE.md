# Responsive behaviour

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

The canonical home for how the layout adapts, and what was checked. The tokens the
layout is built from are in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## Breakpoints

| Width | What changes |
| --- | --- |
| **980px** (tablet) | The product grid collapses to one column |
| **700px** (mobile) | The gutter token drops from 80px to 20px, and the navigation becomes a menu |

`src/styles/responsive.css` is imported last so its overrides win without
`!important`.

## Requirements

- No horizontal overflow at any width: `scrollWidth === innerWidth`.
- At mobile width the Trove preview sits below the copy, and every section stays
  legible in a stacked layout.

## Verified at v1.0.0 (1 September 2026)

| Viewport | Checked |
| --- | --- |
| 1440×900 desktop | Hero, product grid, notes, beliefs, early access and footer all match the approved arrangement |
| 1440×3900 full page | The whole page in one frame; section rhythm and spacing correct |
| 390×844 mobile | Matches the original mobile reference; **no horizontal overflow** |
| 390×2400 / full | Stacked layout, Trove preview below the copy, all sections legible |

Also checked for overflow at 1920, 1440, 1280, 768, 812×375 and 375×812, on the home,
product, note, legal, contact and 404 pages. Both breakpoints were exercised.

## Not yet done

Real-device testing.
