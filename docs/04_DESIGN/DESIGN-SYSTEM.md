# Design system

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

The CSS implementation of [BRAND-GUIDE.md](BRAND-GUIDE.md). The brand guide is
the contract; this file records how each token is expressed and where it is used.
**Do not introduce a colour, radius or width the brand guide does not define** —
add it there first.

## Tokens → CSS

All in `src/styles/tokens.css` on `:root`.

| Brand token | Custom property | Value | Used for |
| --- | --- | --- | --- |
| Ink | `--ink` | `#081b4a` | Body text, dark surfaces, primary button, Vero note card |
| Ink Soft | `--ink-soft` | `#29406c` | Supporting copy, eyebrows, footer, captions |
| Sky | `--blue` | `#a9cbed` | Hero, Vero card, early-access and contact panels |
| Paper | `--paper` | `#f7f6f2` | Page background |
| White | `--white` | `#fffdf9` | Cards, inputs, capability tiles, mobile menu |
| Coral | `--coral` | `#ff674f` | CTAs, accent dots, focus ring, list bullets, status callout rule |
| Lime | `--lime` | `#d4e779` | "Taking shape" pill, Vero mark, Trove note card |
| Line | `--line` | `rgba(8,27,74,0.17)` | Dividers, quiet borders, footer rule |

## Type

| | Property | Stack |
| --- | --- | --- |
| Display | `--serif` | `"Instrument Serif", Georgia, serif` |
| Interface | `--sans` | `"DM Sans", sans-serif` |

Self-hosted from `/fonts/`, latin subset, weights 400/500/600/700 for DM Sans and
400 for Instrument Serif — the only weights the design uses. See ADR-003.

| Role | Size | Notes |
| --- | --- | --- |
| Hero `h1` | `clamp(68px, 7.2vw, 110px)` | line-height 0.86, tracking −0.045em |
| Section `h2` | `clamp(52px, 6vw, 86px)` | line-height 0.89 |
| Product `h3` | `clamp(44px, 4.4vw, 66px)` | line-height 0.86 |
| Body | 14–15px desktop, 13px mobile | line-height 1.55–1.6 |
| Article body | 17px | line-height 1.7 — long-form gets more room |
| Eyebrow | 10px | 700, `0.16em` tracking, uppercase |

Display headings are stored as arrays of lines (`["Your whole", "money picture"]`)
so breaks land where the design intends rather than wherever the box ends.

## Layout and shape

| | Property | Value |
| --- | --- | --- |
| Hero + header width | `--width-wide` | 1360px |
| Section width | `--width-content` | 1200px |
| Desktop gutter | `--gutter` | 80px |
| Mobile gutter | `--gutter-mobile` | 20px |
| Card radius | `--radius-card` | 20px (hero uses 24px) |
| Control radius | `--radius-control` | 12px |
| Pill radius | `--radius-pill` | 999px |

Breakpoints, and how the layout adapts at each, are in [RESPONSIVE.md](RESPONSIVE.md).

## Stylesheet order

`src/styles/index.css` imports in this order, and it matters:

```
tokens → fonts → base → layout → hero → products → sections → responsive
```

`responsive.css` comes last so its overrides win without `!important`.

## Component conventions

**Status pills.** `.status-pill.building` is lime (Trove, further along);
`.status-pill.upcoming` is an outline (Vero, still an idea). Both read as "not
yet available" — see [CONTENT.md](CONTENT.md).

**The coral full stop.** `<span className="accent-dot">.</span>` after a display
headline. A brand signature, not punctuation — it is decorative and sits outside
the sentence.

**Focus, the skip link and reduced motion** are accessibility requirements and are
owned by [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Non-negotiables

1. **No inline `style` attributes.** The CSP blocks them; a test enforces it.
   Add a class. See ADR-009.
2. **No new colour outside the token set.** The one exception is the greens and
   greys inside the two product previews, which are decorative illustrations of a
   different product's UI, marked `aria-hidden`. They are defined once, as
   `--preview-green` and `--preview-muted` on `.trove-preview, .vero-preview`, and meet
   WCAG AA on every surface they sit on ([ADR-024](../08_DECISIONS/DESIGN/ADR-024-accessible-colours-and-heading-order.md)).
   **Coral is an accent, never a text colour** (2.66:1 on Paper): status text is Ink
   Soft with a coral dot. `tests/accessibility.test.mjs` enforces both.
3. **Every image needs `width`, `height` and `alt`.** Enforced by a test; the rule
   and its reason are in [ACCESSIBILITY.md](ACCESSIBILITY.md).
