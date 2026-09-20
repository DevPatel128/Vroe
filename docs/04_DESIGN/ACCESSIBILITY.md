# Accessibility

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

The canonical home for accessibility: the requirements, how they are enforced,
what was verified, and what is known to fall short. Accessibility is part of
quality here, not a later pass ([PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md)).
The target is WCAG 2.2 AA.

## Requirements

**Structure**

- One `<h1>` per page, and headings in order, with landmarks.
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

- Text meets WCAG AA contrast. Body copy is Ink Soft `#29406c` on Paper
  `#f7f6f2`, which is 8.6:1.
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
- `perf/run.mjs`, the CI `performance` job: Lighthouse's accessibility audits on six
  pages. It fails on any failing audit that is not listed in `KNOWN_ISSUES`
  ([PERFORMANCE.md](../05_ENGINEERING/PERFORMANCE/PERFORMANCE.md)).

## Known issues

Found by the Lighthouse budget on 2026-09-19. Both pre-date it, neither is fixed,
and both are listed in `KNOWN_ISSUES` so they cannot spread.

| Issue | Where | Detail |
| --- | --- | --- |
| **Colour contrast** below 4.5:1 | `/`, `/products`, `/trove`, `/vero` | Text in the product preview illustrations (`.positive`, `.muted`, `.trove-status`), measured at 3.57 to 4.1:1. [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) exempts the illustration's colours as decorative and `aria-hidden`, but the automated audit still flags them. |
| **Heading order** | `/products` | The heading levels skip a level. |

**A decision is needed on the contrast.** Either darken those text colours to reach
4.5:1, which changes the illustration, or record the exemption as an accepted,
documented deviation and teach the audit about it. The other accepted deviation is
the coral full stop after each display headline: decorative punctuation carrying no
information, following a high-contrast heading.

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
