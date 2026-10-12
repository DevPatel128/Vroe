# DESIGN.md

The design system for this product. UI work follows it, `scripts/design-check.sh` enforces the tables marked "checked", and the `design` skill reads it first. `repo-check.sh` fails while any placeholder remains. Change a token here in the same PR that changes the code.

Source of truth: the tokens are in `code/src/styles/tokens.css`, which expresses the client's brand guide (not stored in this repo; `PRODUCT.md` "Design tokens" summarises it). Where this file and the CSS disagree, the CSS is what ships; fix this file.

## Direction
- **Feeling (3 words):** warm, editorial, restrained
- **Not:** a generic SaaS page (purple gradient, stock dashboard hero, hype copy), a fintech or crypto neon look, or anything that implies a product is live when it is not (`PRODUCT.md` honesty rules).
- **Inspired by (max 3 real products, with what we borrow, never copy):** none recorded. The look comes from the client's brand guide (Instrument Serif display type, ink-blue and paper palette); no outside product was named, so none is claimed here.

## Dials (checked: three whole numbers from 1 to 10)
Dials: variance=4 motion=2 density=3

| Dial | 1–3 | 4–7 | 8–10 |
|---|---|---|---|
| variance (layout boldness) | centered, predictable grid | some asymmetry and overlap | asymmetric, editorial |
| motion | hover and focus only | smooth transitions | choreographed, physics |
| density | airy, one idea per screen | balanced app | dense dashboard |

- variance 4: sections sit on a centred 1200 px column, but the product mocks are tilted (2 degrees) and overlap their cards, and headings are large serif display lines.
- motion 2: the only motion is a 2 px button lift, link opacity and colour fades (180 ms) and smooth anchor scrolling; nothing animates on scroll or on load.
- density 3: very large section padding (138 to 150 px on the products section), one idea per section, 13 to 15 px body copy with generous line height.

## Palette (checked: every hex colour the build uses is listed here)
Light only: no dark theme exists (`PRODUCT.md`). The Dark column therefore says "none". Contrast ratios are WCAG 2.x, computed from the hex values.

| Role | Light | Dark | Contrast rule |
|---|---|---|---|
| background (paper) | #f7f6f2 | none | page background; ink on it 15.34:1 |
| surface (white, cards) | #fffdf9 | none | ink on it 16.33:1 |
| text (ink) | #081b4a | none | 15.34:1 on paper, 9.84:1 on sky, 12.25:1 on lime, 5.77:1 on coral: all ≥ 4.5:1 |
| muted text (ink soft) | #29406c | none | 9.50:1 on paper, 6.09:1 on sky, 7.59:1 on lime: all ≥ 4.5:1 |
| ink hover (primary button hover) | #112d67 | none | white on it 12.96:1 |
| sky (hero, Vero, contact and form surface) | #a9cbed | none | surface, never text |
| accent (coral, calls to action) | #ff674f | none | 2.66:1 on paper, 2.83:1 on white, 1.70:1 on sky: below 4.5:1, so coral is never text; ink on coral is 5.77:1 |
| coral hover | #f2543b | none | ink on it 4.82:1 |
| lime (status, Trove notes) | #d4e779 | none | surface; ink on it 12.25:1 |
| danger (form error text) | #932b19 | none | 7.47:1 on paper, 4.79:1 on sky (the form panel) |
| success icon (form tick) | #68844d | none | graphic only, 4.14:1 on white (≥ 3:1) |
| preview green (decorative app mock) | #4e6e3f | none | 5.09:1 on #f2f0eb, 4.72:1 on #eae8e1, 5.70:1 on white |
| preview muted (decorative app mock) | #6a7381 | none | 4.72:1 on white, 4.21:1 on #f2f0eb |
| preview surfaces and fills (aria-hidden mock only) | #f2f0eb #eae8e1 #d9ded0 #e1e3d6 #e5ead9 | none | backgrounds inside the Trove mock |
| preview greens (aria-hidden mock only) | #76a653 #859875 #9cae69 #a3b86f #637452 | none | chart bars, goal track, status dot, icon tint |
| line | rgba(8,27,74,0.17) | none | dividers and quiet borders |

Focus ring: 3 px coral outline plus a 6 px ink halo. Coral alone fails 3:1 on every light surface; the ink halo carries it (`base.css`, ADR-024).

## Type (checked: every font family the build uses is listed here)
| Role | Family | Scale and weights |
|---|---|---|
| display and headings | Instrument Serif | weight 400 only, letter-spacing -0.045em; hero h1 clamp(68px, 7.2vw, 110px); section h2 clamp(52px, 6vw, 86px); product h3 clamp(44px, 4.4vw, 66px); wordmark 29px (25px on phones); fallback Georgia |
| body and interface | DM Sans | weights 400 body, 600 nav and muted, 700 eyebrows, buttons and pills; body 14 to 15 px desktop, 13 px phone, line-height 1.55 to 1.6; article body 17 px (16 px phone) at 1.7; eyebrow, pill and small print 11 px; buttons and links 13 px |
| mono (if used) | none | not used |

Why these fonts: the client's brand guide chose a high-contrast serif for display and a neutral geometric sans for interface text. Both are self-hosted from `/fonts/` (Latin subset, `font-display: swap`, no 500 weight) so the CSP stays `font-src 'self'` (`code/src/styles/fonts.css`, ADR-003).

## Space, shape, motion
- **Space scale:** the brand does not use the kit's 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 scale; spacing is hand-set in each stylesheet (typical steps 8, 10, 12, 16, 20, 25, 34, 40, 54). Page widths: content 1200 px, hero and header 1360 px; gutters 80 px desktop, 20 px phone. A kit-scale move is a redesign, not part of this file.
- **Radius and elevation:** card 20 px (hero 24 px), control 12 px, pill 999 px. One shadow recipe: `0 20px 50px rgba(8, 27, 74, 0.1)` on the app mocks and cards, `0.12` on the Vero card, and `0 14px 30px rgba(8, 27, 74, 0.12)` on the phone menu.
- **Motion:** 180 ms ease (`--ease`) for colour, opacity and the 2 px button lift; smooth anchor scroll. Every animation has a `prefers-reduced-motion` fallback in `tokens.css`: transitions and animations drop to 0.01 ms and scrolling becomes instant (checked).
- **Icons:** Phosphor (`@phosphor-icons/react`), `fill` weight for marks and status, `regular` for navigation. No emoji as icons.

## Components (one source each; reuse before adding)
| Component | Variants | States covered | Where |
|---|---|---|---|
| button | primary (ink), coral | default, hover (lift and darker fill), focus-visible, disabled and loading on the subscribe button (script-driven) | `code/src/styles/base.css`, `code/src/client/enhance.js` |
| text link | light, dark | default, hover (opacity), focus-visible | `code/src/styles/base.css` |
| header and nav | inline (wide), menu (phone) | default, current page, hover, open menu | `code/src/components/Header.jsx`, `code/src/styles/layout.css` |
| footer | one | default, hover | `code/src/components/Footer.jsx`, `code/src/styles/layout.css` |
| status pill | building (lime), upcoming (outline) | static | `code/src/styles/base.css` |
| product card | Trove, Vero | default | `code/src/components/ProductCard.jsx`, `code/src/styles/products.css` |
| note card | Trove (lime), Vero (ink) | default, hover on its link | `code/src/components/NoteCard.jsx`, `code/src/styles/sections.css` |
| email form | subscribe | default, focus, invalid, sending, success, error | `code/src/components/SubscribeForm.jsx`, `code/src/styles/sections.css` |
| evidence blocks | stat, ranking, country panel, method, sources | default, hover on ranking links | `code/src/components/evidence/`, `code/src/styles/evidence.css` |
| app mocks | Trove, Vero (aria-hidden) | static | `code/src/components/TrovePreview.jsx`, `VeroPreview.jsx` |
| skip link | one | hidden until focus | `code/src/styles/base.css` |

## Responsive and touch (checked in a real browser by `design.spec.ts`)
- Breakpoints tested: 375, 768, 1280 px. No horizontal scroll at any of them (verified on all ten indexable pages and the 404 page).
- Touch targets at least 44×44 px; form inputs at least 16 px font size (iOS zooms below that). Up to 980 px wide, links and buttons carry padding and negative margin so the visible layout is unchanged while the hit area is 44 px (`responsive.css`, "Touch targets"). Two inputs are exceptions, see Findings.
- Mobile is designed, not squeezed: below 700 px the gutter drops from 80 to 20 px, the header navigation becomes a menu button with a dropdown panel, the product grid is one column (breakpoint 980 px), and the Trove mock is scaled down and tilted.

## Voice
Warm, plain, honest. Do: "Recurring payments gathered in one list" (intent, spaced em dashes, British spelling, sentence case). Don't: "Trove saves you money!" (hype, exclamation marks, invented metrics, or anything that says a product is live). Real copy only: no lorem ipsum or "Your Company".

## Findings
- **Fixed (this PR):** link and button hit areas under 44 px on phone and tablet (header, menu button, footer, breadcrumbs, text links, email links, skip link); form error text `#9c2f1c` was 4.39:1 on the sky form panel, now `#932b19` at 4.79:1.
- **Not fixed:** the consent checkbox is 24×24 px on purpose (`sections.css`): it meets WCAG 2.2 AA target size (24 px) and its label is also clickable, but it is under the kit's 44 px rule. Making it 44 px means a custom checkbox, which is a design change.
- **Wrong check:** the spam honeypot input (`.hp-field`) is moved off-screen, `aria-hidden` and `tabindex="-1"`, so no person can reach it; `design.spec.ts` still measures it (176×27).
- **Known contrast gaps, decorative only:** preview muted `#6a7381` is 4.21:1 on `#f2f0eb` inside the `aria-hidden` Trove mock (the 8 to 11 px text there is not read by anyone and is not content). Coral `#ff674f` is below 3:1 against paper but is never used as text or as the only focus cue.
- **Doc drift fixed:** `PRODUCT.md` said eyebrows are 10 px and DM Sans has a 500 weight; the CSS ships 11 px and weights 400, 600, 700.

## Review log (newest first)
| Date | Page or flow | Seen at 375 / 768 / 1280 | Finding and fix |
|---|---|---|---|
| 2026-10-12 | all 10 indexable pages and the 404 page | yes / yes / yes | Before the fix, every page failed the touch-target check at 375 and 768. After it, 29 of 33 page-width checks pass. Fixed hit areas and the error colour; the consent checkbox and the honeypot are the two remaining flags (see Findings). |
