---
name: design
description: Build or change UI to a written design system, avoid the generic AI look, and prove it in a real browser at phone, tablet and desktop widths. Use for any page, component, layout, style, copy-on-screen or "make it look better" request.
---
# Design

Rule 0: blunt. A page that "looks fine" in your head is unverified. Never claim a UI is done before you have seen it.
Read `AGENTS.md`, then `DESIGN.md` (dials, palette, type, components, responsive rules). If `DESIGN.md` is still a template, fill it from the real design first, or ask: the checks below cannot pass against placeholders.

## 1. Plan
- Name the user goal and the one primary action of the screen. State the three dials from `DESIGN.md` (variance, motion, density) and build to those numbers, not to your taste.
- Reuse existing components. A new component needs a row in `DESIGN.md` Components in the same PR.
- Decide what changes on a phone before you code the desktop view.

## 2. Build
- Use only the palette, type families, space scale, radius and motion in `DESIGN.md`. A new token goes into `DESIGN.md` first, with a reason.
- Real copy, never lorem ipsum or "Your Company". Every important flow has loading, empty, error, success and denied states.
- Accessibility is part of the design: semantic HTML, labels, visible focus, `alt`, contrast per the palette rules, `prefers-reduced-motion`.

## 3. The generic AI look: remove it
Each item is a finding when it was not a deliberate choice recorded in `DESIGN.md`:
- Purple or indigo gradients, gradient text, glow blobs behind the hero.
- One default font for everything, usually Inter or system-ui, chosen by nobody.
- Everything centered; a hero, then three identical icon cards, then a testimonial strip, then a CTA band.
- Cards inside cards, a shadow on every box, glassmorphism with no reason, pill badges on every heading.
- Emoji or random stock icons as feature icons; mixed icon styles and stroke weights.
- Vague copy: "seamless", "supercharge", "all-in-one", "unlock". Say the specific thing.
- Same spacing everywhere (no rhythm), or values off the scale.
Fix by making one choice and applying it everywhere, not by adding decoration.

## 4. Check, mechanically
1. `bash scripts/design-check.sh <build-dir>` (fails on a font or pattern not in `DESIGN.md`, placeholder copy, a missing viewport meta, animation without a reduced-motion rule; warns on colours outside the palette).
2. Real browser: run `design.spec.ts` (kit `design/`, copy it into the Playwright folder once) with `DESIGN_PAGES` set to the pages you touched. It fails on horizontal scroll, touch targets under 44 px, form fields under 16 px, and console errors at 375, 768 and 1280 px, and saves screenshots.
3. Look at the screenshots yourself. Then check the dark theme, the empty and error states, and the keyboard path.
No Playwright in the project? Use the built-in browser or a Chrome tool at the same three widths and say so.

## 5. Report
`Designed to:` the three dials and the one-line direction · `Seen at:` 375 / 768 / 1280 with the screenshot paths (screenshots go in the PR comment, never into git, and never of real user data) · `Checks:` design-check and design.spec results · `Changed in DESIGN.md:` tokens or components · add a row to the Review log · `Not checked:` and what could look wrong.

Optional outside help (third-party skills, for example Impeccable, taste-skill, or the awesome-design-md collection): read the source first. A skill runs with the agent's permissions, so a skill you did not read is a supply-chain risk; licences may be unclear. Copy ideas into `DESIGN.md`; never paste another site's design wholesale.
