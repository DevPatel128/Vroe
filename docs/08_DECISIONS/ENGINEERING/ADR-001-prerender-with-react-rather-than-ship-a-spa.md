# ADR-001 — Prerender with React rather than ship a SPA

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Context.** The prototype was a client-rendered React SPA: 71 KB gzipped of
JavaScript to render a page that is static apart from a menu toggle and one form.
Crawlers saw an empty `<div id="root">`.

**Decision.** Keep React as the authoring model, but render every route to HTML
at build time with `renderToStaticMarkup` and ship no React at all. Interactivity
moves to a ~1.4 KB vanilla script.

**Consequences.** 50× less JavaScript; real HTML for crawlers on every route;
a strict CSP becomes possible. In exchange, components must be pure — no hooks,
no state — and interactivity is hand-written DOM code. Every dependency becomes
a `devDependency`.

**Alternatives.** Astro would have given the same result but meant a larger
rewrite and a new framework to learn. Hydrating React would have kept the 71 KB.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
