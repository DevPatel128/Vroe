# Decisions

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

The index of every non-obvious choice made for this website, and what it cost.
Read the relevant entry before reversing any of them. **This file is the
canonical index; each decision lives in its own file** under the folder for its
category:

| Folder | Holds |
| --- | --- |
| [PRODUCT/](PRODUCT/) | What the site says and shows: status honesty, the evidence layer, what is ranked |
| [DESIGN/](DESIGN/) | How it looks and how assets are made: fonts, inline styles, social cards |
| [ENGINEERING/](ENGINEERING/) | How it is built, secured, deployed and watched |
| [BUSINESS/](BUSINESS/) | Commercial decisions. None are recorded in this repository; see its README |

## Rules

- Record meaningful decisions, not trivial implementation details. "Meaningful"
  means the next person would reasonably do it differently.
- Never silently reverse an approved decision. Reopening one needs new evidence
  or a material change in context, and the new decision supersedes the old one
  rather than editing it.
- Prefer the lowest-cost option that meets the security, reliability,
  performance, compliance and user-value requirements, and say what the cost was.
- Numbers are permanent and run across all categories. Code comments cite them
  (`ADR-014`), so never renumber. The next free number is ADR-025 (ADR-022 is reserved for the subscriber-list backup, which is written in the same pull request as ADR-023 and ADR-024).

## Template for new entries

Copy this into the folder for its category, as `ADR-NNN-short-title.md`, and add
a row to the index below. Every field is required. "None" and "not applicable"
are valid answers; an empty field is not.

```
# ADR-NNN — [Title]

**Status:** Draft / Review / Approved / Superseded · **Last updated:** YYYY-MM-DD · **Owner:** … · **Version:** 1.0

**Decision.** What was decided?

**Context.** What problem or opportunity requires this?

**Reason.** Why this option, and not the status quo?

**Evidence.** What research or measurement supports it, and how current is it?

**Cost.** Money, complexity, maintenance. Cheaper alternatives considered, and
why they were not chosen.

**Alternatives.** What else was considered, and why not.

**Consequences.** What changes as a result? Risks and trade-offs.

**Revisit condition.** What evidence would justify reopening this.

**Approved by.** Name and date. Approval is a human's.
```

Entries ADR-001 to ADR-017 were written before this template, so they lack the
evidence, cost and approver fields. Those are not back-filled, because doing so
would mean inventing history.

## Index

| Decision | Title | Category | Status | Recorded |
| --- | --- | --- | --- | --- |
| [ADR-001](ENGINEERING/ADR-001-prerender-with-react-rather-than-ship-a-spa.md) | Prerender with React rather than ship a SPA | Engineering | Approved | 2026-09-01 |
| [ADR-002](ENGINEERING/ADR-002-content-in-src-content-never-in-components.md) | Content in `src/content/`, never in components | Engineering | Approved | 2026-09-01 |
| [ADR-003](DESIGN/ADR-003-self-host-the-fonts.md) | Self-host the fonts | Design | Approved | 2026-09-01 |
| [ADR-004](ENGINEERING/ADR-004-hsts-without-preload.md) | HSTS without `preload` | Engineering | Approved | 2026-09-01 |
| [ADR-005](DESIGN/ADR-005-render-og-card-text-as-vector-outlines.md) | Render OG card text as vector outlines | Design | Approved | 2026-09-01 |
| [ADR-006](PRODUCT/ADR-006-trove-is-not-presented-as-live.md) | Trove is not presented as live | Product | Approved | 2026-09-01 |
| [ADR-007](ENGINEERING/ADR-007-security-headers-in-their-own-module.md) | Security headers in their own module | Engineering | Approved | 2026-09-01 |
| [ADR-008](ENGINEERING/ADR-008-run-worker-first-true.md) | `run_worker_first: true` | Engineering | Approved | 2026-09-01 |
| [ADR-009](DESIGN/ADR-009-no-inline-style-attributes.md) | No inline `style` attributes | Design | Approved | 2026-09-01 |
| [ADR-010](ENGINEERING/ADR-010-cloudflare-kv-not-supabase.md) | Cloudflare KV, not Supabase | Engineering | Approved | 2026-09-01 |
| [ADR-011](ENGINEERING/ADR-011-cloudflare-web-analytics-not-posthog.md) | Cloudflare Web Analytics, not PostHog | Engineering | Approved | 2026-09-01 |
| [ADR-012](ENGINEERING/ADR-012-sentry-deferred.md) | Sentry deferred | Engineering | Approved | 2026-09-01 |
| [ADR-013](PRODUCT/ADR-013-privacy-and-terms-in-the-sitemap.md) | `/privacy` and `/terms` in the sitemap | Product | Approved | 2026-09-01 |
| [ADR-014](ENGINEERING/ADR-014-the-https-upgrade-is-gated-on-cf-ray.md) | The HTTPS upgrade is gated on `CF-Ray` | Engineering | Approved | 2026-09-02 |
| [ADR-015](PRODUCT/ADR-015-an-evidence-layer-where-research-and-product-impact-never.md) | An evidence layer where research and product impact never mix | Product | Approved | 2026-09-14 |
| [ADR-016](PRODUCT/ADR-016-rank-only-by-a-recent-comparable-measure-no-composite-index.md) | Rank only by a recent comparable measure; no composite index | Product | Approved | 2026-09-14 |
| [ADR-017](PRODUCT/ADR-017-only-data-collected-and-published-in-2024-or-later.md) | Only data collected and published in 2024 or later | Product | Approved | 2026-09-14 |
| [ADR-018](ENGINEERING/ADR-018-infrastructure-cost-review-cloudflare-free-tier-only.md) | Infrastructure cost review: Cloudflare free tier only | Engineering | Approved | 2026-09-19 |
| [ADR-019](ENGINEERING/ADR-019-declare-esbuild-as-a-direct-devdependency.md) | Declare `esbuild` as a direct devDependency | Engineering | Review | 2026-09-19 |
| [ADR-020](ENGINEERING/ADR-020-production-safeguards-a-required-check-a-health-check.md) | Production safeguards: a required check, a health check, automatic rollback | Engineering | Approved | 2026-09-19 |
| [ADR-021](ENGINEERING/ADR-021-performance-and-accessibility-budgets-bytes-in-the-tests.md) | Performance and accessibility budgets: bytes in the tests, Lighthouse in CI | Engineering | Approved | 2026-09-19 |
| [ADR-023](ENGINEERING/ADR-023-documentation-follows-every-change-enforced-in-ci.md) | Documentation follows every change, enforced in CI | Engineering | Approved | 2026-09-20 |
| [ADR-024](DESIGN/ADR-024-accessible-colours-and-heading-order.md) | Accessible colours and heading order | Design | Approved | 2026-09-20 |

Status uses the vocabulary in [the documentation system](../00_START_HERE/README.md):
Draft, Review, Approved, Superseded, Archived. A superseded decision moves to
[../09_ARCHIVE/OLD-DECISIONS/](../09_ARCHIVE/OLD-DECISIONS/) and keeps its number.
