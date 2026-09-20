# Accessibility

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

The canonical home for accessibility: the requirements, how they are enforced,
what was verified, and what is known to fall short. Accessibility is part of
quality here, not a later pass ([PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md)).
The target is WCAG 2.2 AA.

## Requirements

**Structure**

- One `<h1>` per page, and headings in order, with landmarks. A heading never skips
  a level: a component that renders one takes its level from the page (the product
  cards take a `headingLevel`; on `/products` they are `h2`, on the home page `h3`).
- A skip link is the first focusable element on every page, revealed on focus.
- Every image has `alt`, `width` and `height`. The dimensions are also what keeps
  Cumulative Layout Shift at zero.

**Keyboard and focus**

- Everything is reachable and operable by keyboard, with focus visible on every
  brand surface. `:focus-visible` gets a 3px coral outline with a 3px offset,
  because the browser default is invisible against Ink and Sky.
- The mobile menu closes on Escape and on link click, returns focus to its button,
  and a closed menu leaves the tab order.

**Forms**

- Inputs have real labels. The status region is `role="status"` and
  `aria-live="polite"`. An invalid address sets `aria-invalid="true"`.
- The honeypot is off-screen, `tabindex="-1"` and `autocomplete="off"`.

**Perception**

- Text meets WCAG AA contrast, 4.5:1. Body copy is Ink Soft `#29406c` on Paper
  `#f7f6f2`, which is 9.5:1.
- **Coral is an accent, never a text colour**: on Paper it is 2.66:1. Status text is
  Ink Soft with a small coral dot, so the brand accent survives without being read.
- The illustration's own greens and greys are `--preview-green` (`#4e6e3f`) and
  `--preview-muted` (`#6a7381`), each at least 4.7:1 on every surface it is drawn on.
- All real content is at least 11px. The consent checkbox is 24×24 and other small
  targets pass the WCAG 2.5.8 spacing exception.
- Decorative imagery is hidden from assistive technology. The Trove preview is
  `aria-hidden` because it contains invented figures that must not be read out as
  though they were someone's real balance.
- External links announce that they open in a new tab.

**Motion**

- `prefers-reduced-motion: reduce` disables smooth scrolling and collapses every
  transition.

## How it is enforced

- `tests/functionality.test.mjs` and `tests/seo.test.mjs`: one `h1`, alt text and
  dimensions on every image, the skip link, labels, descriptive link text.
- `tests/accessibility.test.mjs`: no page skips a heading level; the illustration
  palette meets 4.5:1 on every surface it is drawn on; the brand's text tokens meet AA;
  and coral is not used as a text colour. Fast and browser-free, so a regression fails
  `npm test` immediately.
- `perf/run.mjs`, the CI `performance` job: Lighthouse's accessibility audits on all ten
  indexable routes. It fails on any failing audit that is not listed in `KNOWN_ISSUES`,
  which is empty ([PERFORMANCE.md](../05_ENGINEERING/PERFORMANCE/PERFORMANCE.md)).

## Known issues

**None.** `KNOWN_ISSUES` in `perf/run.mjs` is empty and every audit passes on all ten
routes.

**History.** The Lighthouse budget found two failures on 2026-09-19 and they were fixed
the next day ([ADR-024](../08_DECISIONS/DESIGN/ADR-024-accessible-colours-and-heading-order.md)).
They were larger than first recorded: eight failing colour pairs across 35 nodes, one of
them in visible content (the "waiting for product data" label on `/trove`, coral text on
Paper at 2.65:1), plus the `/products` heading order.

**One accepted deviation.** The coral full stop after each display headline is
decorative punctuation that carries no information and follows a high-contrast heading.
It is not flagged by the audit and is left as designed.

## Verified at v1.0.0 (1 September 2026)

Everything below was checked and passed, by hand and in a browser, at launch.
Re-check only if the relevant area changes.

- Mobile menu opens and closes; `aria-expanded` flips, `aria-label` changes between
  "Open menu" and "Close menu", and the hamburger and close icons swap.
- The form rejects an invalid address and sets `aria-invalid="true"`, and refuses
  to submit without the consent checkbox.
- The browser console is clean: zero errors, zero CSP violations.
- Keyboard reachable throughout; focus visible on every brand surface.

## Not yet done

Screen-reader passes (VoiceOver, NVDA) and real-device testing. They are listed as
pending in both audit documents ([SECURITY-AUDIT.md](../05_ENGINEERING/SECURITY/SECURITY-AUDIT.md),
[SEO-AUDIT.md](../05_ENGINEERING/ARCHITECTURE/SEO-AUDIT.md)).
