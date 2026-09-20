# QA

**Status:** Superseded · **Last updated:** 2026-09-04 · **Owner:** Vroe Labs · **Version:** 1.0

> **Superseded.** A verification record for v1.0.0 (1 September 2026). The living requirements are in [ACCESSIBILITY.md](../../04_DESIGN/ACCESSIBILITY.md) and [RESPONSIVE.md](../../04_DESIGN/RESPONSIVE.md); the automated checks are the test suite itself, so the test count below is out of date.

## Records

- **[design-qa-prototype.md](PROTOTYPE-DESIGN-QA.md)** — the Codex prototype's
  design QA against the original mobile reference. Carried over as history; it
  describes the prototype, not this build.
- **implementation-mobile.png** — the prototype's mobile capture, kept as the
  visual reference this rebuild was checked against.

## Verification performed for v1.0.0 (1 September 2026)

### Automated — 44 assertions, all passing

`npm test` covers worker behaviour, security and SEO. Full breakdown in
[SECURITY_AUDIT.md](../../05_ENGINEERING/SECURITY/SECURITY-AUDIT.md) and [SEO_AUDIT.md](../../05_ENGINEERING/ARCHITECTURE/SEO-AUDIT.md).

### Responsive

| Viewport | Checked |
| --- | --- |
| 1440×900 desktop | Hero, product grid, notes, beliefs, early access, footer all match the approved arrangement |
| 1440×3900 full page | Whole page in one frame; section rhythm and spacing correct |
| 390×844 mobile | Matches the original mobile reference; **no horizontal overflow** (`scrollWidth === innerWidth`) |
| 390×2400 / full | Stacked layout, Trove preview positioned below the copy, all sections legible |

Breakpoints exercised: 980px (product grid collapses to one column) and 700px
(gutter drops to 20px, nav becomes a menu).

### Interaction

- Mobile menu opens and closes; `aria-expanded` flips, `aria-label` changes
  between "Open menu" and "Close menu", and the hamburger/close icons swap
- Menu closes on link click and on Escape, returning focus to the button
- Form rejects an invalid address and sets `aria-invalid="true"`
- Form refuses to submit without the consent checkbox
- Honeypot present in the DOM, off-screen, `tabindex="-1"`, `autocomplete="off"`
- Full submission stores a correctly hashed key with exactly four fields
- Browser console clean — **zero errors, zero CSP violations**

### Accessibility

- One `<h1>` per page, headings in order
- Skip link is the first focusable element on every page
- `:focus-visible` gives a 3px coral outline — the browser default is invisible
  against Ink and Sky
- Every image has `alt`, `width` and `height`
- The Trove preview is `aria-hidden` — it contains invented figures that must not
  be read out as though they were someone's real balance
- Form inputs have real labels; the status region is `role="status"` `aria-live="polite"`
- External links announce that they open in a new tab
- `prefers-reduced-motion` disables smooth scrolling and all transitions
- Body copy is Ink Soft `#29406c` on Paper `#f7f6f2` — 8.6:1, comfortably past
  WCAG AA

### Not yet done

Real-device testing, screen-reader passes (VoiceOver/NVDA), and the external
tool checks listed as pending in both audit documents.
