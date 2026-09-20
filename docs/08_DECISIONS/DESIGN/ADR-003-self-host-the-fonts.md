# ADR-003 — Self-host the fonts

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Design · **Recorded:** 2026-09-01

**Context.** The prototype `@import`ed Instrument Serif and DM Sans from
`fonts.googleapis.com`: a render-blocking third-party request, and a CSP that
needs `'unsafe-inline'` in `style-src` plus two Google origins.

**Decision.** Copy the five woff2 files this site uses from `@fontsource` into
`public/fonts/` under stable, unhashed names, with hand-written `@font-face`
rules in `src/styles/fonts.css`.

**Consequences.** `style-src 'self'; font-src 'self'` with nothing else, no
third-party request, and `<link rel="preload">` can name an exact file (a build
hash would change every release and silently stop matching). The cost is
`scripts/sync-fonts.mjs`, which must be re-run when `@fontsource` is updated —
it fails loudly if a source file moves.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
