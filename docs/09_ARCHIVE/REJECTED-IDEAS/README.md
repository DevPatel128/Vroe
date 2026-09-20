# Rejected ideas

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

An index of ideas that were considered and rejected. The full reasoning lives in
the decision that rejected each one, so this page links rather than copies. An idea
is here so nobody re-opens it by accident; reopening one needs new evidence
([DECISIONS.md](../../08_DECISIONS/DECISIONS.md)).

| Idea | Why it was rejected | Decision |
| --- | --- | --- |
| Ship the client-rendered single-page app; hydrate React; use Astro | 71 KB of JavaScript, an empty page for crawlers; Astro meant a larger rewrite | [ADR-001](../../08_DECISIONS/ENGINEERING/ADR-001-prerender-with-react-rather-than-ship-a-spa.md) |
| Load fonts from Google | Forces `unsafe-inline` and two third-party origins into the CSP | [ADR-003](../../08_DECISIONS/DESIGN/ADR-003-self-host-the-fonts.md) |
| HSTS `preload` | Effectively irreversible, and a subdomain is planned but not live | [ADR-004](../../08_DECISIONS/ENGINEERING/ADR-004-hsts-without-preload.md) |
| `unsafe-inline` for styles | A bad trade for a decorative bar chart | [ADR-009](../../08_DECISIONS/DESIGN/ADR-009-no-inline-style-attributes.md) |
| Supabase for the subscriber list | One list of addresses does not need Postgres, and the free org is at its cap | [ADR-010](../../08_DECISIONS/ENGINEERING/ADR-010-cloudflare-kv-not-supabase.md) |
| PostHog on the marketing site | About 50 KB and a consent banner, for page views | [ADR-011](../../08_DECISIONS/ENGINEERING/ADR-011-cloudflare-web-analytics-not-posthog.md) |
| Sentry | A dependency and a third-party origin for almost no runtime | [ADR-012](../../08_DECISIONS/ENGINEERING/ADR-012-sentry-deferred.md) |
| Typing figures into copy; fetching data at runtime; `Dataset` structured data | Figures drift from sources; needs a `connect-src` origin; the page is not a dataset | [ADR-015](../../08_DECISIONS/PRODUCT/ADR-015-an-evidence-layer-where-research-and-product-impact-never.md) |
| A composite "Financial Management Burden Index" | No comparable data; it would present gaps as precision | [ADR-016](../../08_DECISIONS/PRODUCT/ADR-016-rank-only-by-a-recent-comparable-measure-no-composite-index.md) |
| Using data collected before 2024 | Stale; every older source was removed | [ADR-017](../../08_DECISIONS/PRODUCT/ADR-017-only-data-collected-and-published-in-2024-or-later.md) |
| Pinning Vite back to 6; forcing esbuild 0.25.12 | Undoes a supported upgrade, or accepts a known peer conflict | [ADR-019](../../08_DECISIONS/ENGINEERING/ADR-019-declare-esbuild-as-a-direct-devdependency.md) |
| `@lhci/cli`; Lighthouse in the app's dependencies; unpinned `npx lighthouse` | Stale and four times the tree; puts it in the deploy job; unlocked dependencies | [ADR-021](../../08_DECISIONS/ENGINEERING/ADR-021-performance-and-accessibility-budgets-bytes-in-the-tests.md) |
| Double opt-in; analytics or tracking; anti-inspection blocking | Not approved, or protects nothing and harms accessibility | [PRODUCTION-CHECKLIST.md](../../06_OPERATIONS/RUNBOOKS/PRODUCTION-CHECKLIST.md), "Deliberately not done" |
