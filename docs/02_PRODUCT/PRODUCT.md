# Product

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

What this repository builds, stated from what is already true. Approved by Dev on
2026-09-20. It was written from the existing documents and the code, not from a
founder interview, so the items marked as assumptions are still assumptions.

The *products* the site describes, Trove and Vero, are not defined here. Their
records are `code/src/content/products.js`, and their own repositories hold their
specifications. This file is about the website.

## Identity

- **Product name:** the Vroe Labs website, at `vroelabs.com`.
- **One-line description:** the public site for Vroe Labs: what the studio is,
  what it is building, and an honest account of where each product stands.
- **Product promise:** nothing on it is claimed that is not true today.
- **Target user:** people curious about Vroe Labs and its products, including
  people who might want to hear when Trove is ready. *(Assumption: inferred from
  the copy and the early-access form; not from research on visitors.)*
- **Core problem:** a studio with no shipped product still needs a credible,
  truthful presence and a way to hear from interested people. *(Assumption.)*

## Product thesis

See [THESIS.md](THESIS.md).

## User outcome

A visitor can tell within seconds what Vroe Labs is, what Trove and Vero are, and
that neither is available yet. They can leave an email address to hear more, with
consent asked for explicitly. They can read the evidence behind the problem Trove
is being built for, with every figure sourced.

## Core jobs

1. Say what the studio is and what it is making (home, about, products, the two
   product pages, two notes).
2. State plainly where each product stands, before anything else on its page.
3. Collect an early-access email safely, with explicit consent and no more data
   than needed.
4. Show sourced evidence for the problem Trove addresses, India first.
5. Publish the privacy policy and terms, written against what the site actually
   does.

## Product principles

The rules are in [PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md). Nothing
product-specific is added here.

## Core capabilities

| Capability | User value | Evidence it works | Priority |
| --- | --- | --- | --- |
| Status callout under every product hero | A visitor never has to scroll past a pitch to learn a product is unavailable | `src/pages/product.jsx`; [CONTENT.md](../04_DESIGN/CONTENT.md) | Not ranked |
| Early-access form | Someone interested can be told when there is news | The pipeline in [SECURITY.md](../05_ENGINEERING/SECURITY/SECURITY.md); `tests/security.test.mjs` | Not ranked |
| Evidence layer on `/trove` | The problem is shown with sourced, dated figures instead of assertion | [RESEARCH.md](../03_RESEARCH/RESEARCH.md); `tests/evidence.test.mjs` | Not ranked |
| Static, prerendered pages | Fast, readable without JavaScript, indexable | [ARCHITECTURE.md](../05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md); [PERFORMANCE.md](../05_ENGINEERING/PERFORMANCE/PERFORMANCE.md) | Not ranked |
| Privacy policy and terms | Visitors can see what is stored and for how long | `src/content/legal.js`, kept in step with `worker/index.js` | Not ranked |

Priorities are not set. That is a decision for the maintainer, not something to
invent here.

## Change / feature decision

For every meaningful new capability or change, answer the checklist in
[AI-WORKFLOW.md](../05_ENGINEERING/AI/AI-WORKFLOW.md): why, impact, how, cost, and
whether the cost is justified. Record non-obvious answers in
[DECISIONS.md](../08_DECISIONS/DECISIONS.md).

## Non-goals

The site will not:

- be the products. There is no download, sign-in or waiting list beyond email
  updates.
- claim a product is available, or state pricing, user numbers, downloads, launch
  dates, ratings or reviews.
- take payments, host accounts or accept user-generated content.
- set cookies of its own or track visitors across sites. Web analytics, when
  enabled, is cookieless ([ADR-011](../08_DECISIONS/ENGINEERING/ADR-011-cloudflare-web-analytics-not-posthog.md)).
- ship a client-side framework ([ADR-001](../08_DECISIONS/ENGINEERING/ADR-001-prerender-with-react-rather-than-ship-a-spa.md)).

## Success

Two kinds of success, kept apart.

**The site does what it says, and stays that way.** These are set, enforced on every
change, and measured ([METRICS.md](../07_BUSINESS/METRICS.md) has today's values):

- Lighthouse on all ten routes: performance at least 0.95, First Contentful Paint,
  Largest Contentful Paint, Total Blocking Time and Cumulative Layout Shift inside
  Google's "good" thresholds, and no failing accessibility, best-practice or SEO audit
  ([PERFORMANCE.md](../05_ENGINEERING/PERFORMANCE/PERFORMANCE.md)).
- Page weight inside the byte budgets, and no client-side framework.
- Nothing false on the page: the build fails on an invented rating, offer, count or an
  unsourced figure ([CONTENT.md](../04_DESIGN/CONTENT.md)).
- The site is up ([OBSERVABILITY.md](../06_OPERATIONS/OBSERVABILITY.md)), and the
  early-access list is backed up and restorable ([BACKUPS.md](../06_OPERATIONS/BACKUPS.md)).
  One backup of production exists (2026-09-20); nothing yet keeps it up to date.

**The site achieves something for Vroe Labs.** No target has been set (for sign-ups,
visitors or anything else), and visitor analytics is off, so there is nothing to
measure one against. Setting a target, and turning on the measurement it needs, is the
maintainer's decision. Nothing is invented here in its place.

## Constraints

- **Technical:** static HTML with a strict CSP; no inline styles; one small script.
- **Financial:** Cloudflare's free tier only ([ADR-018](../08_DECISIONS/ENGINEERING/ADR-018-infrastructure-cost-review-cloudflare-free-tier-only.md)).
- **Legal:** the privacy policy must describe what the worker actually stores.
  Change `worker/index.js` and `src/content/legal.js` together.
- **Operational:** one maintainer. `main` accepts changes only through a pull
  request that passes CI.
- **Time:** none set.

## Assumptions

Kept apart from facts, as the framework asks:

- Visitors are mostly people who found the site through search, a social card or
  a direct link, and want to know what Vroe Labs is making. *(No visitor research
  exists.)*
- One list of email addresses is the right level of "early access" for now.
- Trove's India-first framing is the right emphasis for the evidence layer. It
  reflects the maintainer's direction, not a measured visitor need.

## Product lifecycle

| Date | Release | Why it exists |
| --- | --- | --- |
| 2026-09-01 | v1.0.0, live at `vroelabs.com` | Rebuilt from a client-rendered prototype so crawlers see real HTML and a strict CSP is possible ([ADR-001](../08_DECISIONS/ENGINEERING/ADR-001-prerender-with-react-rather-than-ship-a-spa.md)) |
| 2026-09-14 | Evidence layer on `/trove` | Show the problem with sourced, recent figures ([ADR-015](../08_DECISIONS/PRODUCT/ADR-015-an-evidence-layer-where-research-and-product-impact-never.md)) |
| 2026-09-19 | Production safeguards and budgets | Main had gone red unnoticed ([ADR-020](../08_DECISIONS/ENGINEERING/ADR-020-production-safeguards-a-required-check-a-health-check.md)) |
| 2026-09-20 | Accessible colours and heading order; a subscriber backup command; documentation kept in step with the code | No accessibility audit fails ([ADR-024](../08_DECISIONS/DESIGN/ADR-024-accessible-colours-and-heading-order.md)); the list can be restored from a backup ([ADR-022](../08_DECISIONS/ENGINEERING/ADR-022-subscriber-backup-to-the-maintainers-computer.md)); docs stop drifting ([ADR-023](../08_DECISIONS/ENGINEERING/ADR-023-documentation-follows-every-change-enforced-in-ci.md)) |

## Approval

Status: Approved
Approved by: Dev
Date: 2026-09-20
