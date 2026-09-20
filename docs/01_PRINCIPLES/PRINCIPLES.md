# Principles

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

The constitution for this website. Durable rules only: nothing here is a plan, a
specification, an implementation detail, a metric or a research finding, and
these change rarely. How each rule is enforced is in the documents it links to.

## The five rules

Break one of these and something real goes wrong: a false claim, a silently broken
page, a fabricated fact. They are the canonical statement; the root `CLAUDE.md`
and `CONTRIBUTING.md` summarise them for people and agents arriving cold.

1. **Never claim a product is available.** Neither Trove nor Vero has shipped. No
   external product links, no `offers` in structured data, no present-tense
   "Trove is a…". The evidence on `/trove` describes the problem only, never that
   Trove saves time or money. → [CONTENT.md](../04_DESIGN/CONTENT.md),
   [RESEARCH.md](../03_RESEARCH/RESEARCH.md)
2. **Never weaken the CSP.** No `unsafe-inline`, no `unsafe-eval`, no wildcards.
   In particular there are **no inline `style` attributes**: the browser drops the
   styling silently. Use a class. → [SECURITY.md](../05_ENGINEERING/SECURITY/SECURITY.md)
3. **All copy lives in `code/src/content/`,** never hard-coded in a component. →
   [CONTENT.md](../04_DESIGN/CONTENT.md)
4. **No React in the browser.** React renders at build time only, and the browser
   receives HTML, CSS and one small script. →
   [ARCHITECTURE.md](../05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md)
5. **No invented structured data.** No ratings, reviews, offers or counts.
   → [SEO.md](../05_ENGINEERING/ARCHITECTURE/SEO.md)

## The company principles this site holds to

The company product framework states 23 principles. These are the ones with
teeth in a static marketing site, and where each is enforced. Rows marked
*practised* were already how the site was built, and are stated here for the first
time.

| Principle | Here |
| --- | --- |
| **Never fabricate.** Unknown is a valid answer | [CONTENT.md](../04_DESIGN/CONTENT.md), "No invented facts anywhere"; `npm run test:seo` fails on any `offers`, `aggregateRating` or `review` |
| **Evidence before confidence** | [RESEARCH.md](../03_RESEARCH/RESEARCH.md): every figure traces to a source and is confidence-gated; nothing `low` is displayed |
| **Distinguish facts from estimates and assumptions** | RESEARCH.md does it for numbers; [AI-WORKFLOW.md](../05_ENGINEERING/AI/AI-WORKFLOW.md) states it as a rule for anyone proposing a change (*practised*) |
| **One source of truth** | `src/content/` holds every user-visible string; `products.js` drives the pill, buttons, structured data and sitemap from two fields; every concept has one canonical document ([START_HERE](../00_START_HERE/README.md)) |
| **Accessibility is part of quality** | [ACCESSIBILITY.md](../04_DESIGN/ACCESSIBILITY.md) |
| **Secure by default** | `run_worker_first: true` makes the headers structural, not a discipline someone can forget ([ADR-008](../08_DECISIONS/ENGINEERING/ADR-008-run-worker-first-true.md)) |
| **Public-safe by design** | A test asserts no secret appears in any published byte; this repository is heading public ([SECURITY.md](../05_ENGINEERING/SECURITY/SECURITY.md)) |
| **Lowest justified cost** | Every infrastructure decision picks the cheapest option that meets the requirement and says so ([COST.md](../05_ENGINEERING/COST/COST.md)) (*practised*) |
| **Build the smallest honest version first** | A prerendered page instead of a single-page app ([ADR-001](../08_DECISIONS/ENGINEERING/ADR-001-prerender-with-react-rather-than-ship-a-spa.md)) (*practised*) |
| **Human authority** | AI investigates and proposes; a human approves anything consequential. `main` accepts changes only through a pull request that passes CI ([ADR-020](../08_DECISIONS/ENGINEERING/ADR-020-production-safeguards-a-required-check-a-health-check.md)) |

Not applicable to a static marketing site: **progressive disclosure** and
**notifications must earn attention**, because there is no application UI and no
notification surface. The remaining principles (user value first, trust before
growth, no dark patterns, privacy by design, and others) are consistent with how
the site is built but have no dedicated statement; that is reasonable with no
accounts, no recommendations and no notifications. Restate them explicitly when
Trove or Vero has a real product surface to hold to them.

## The final test

Does this make the user's life clearer, safer, easier or more capable? If not,
reconsider it.

## What does not belong here

Temporary plans, feature specifications, implementation detail, current metrics
and research findings. Those live in [02_PRODUCT](../02_PRODUCT/README.md),
[03_RESEARCH](../03_RESEARCH/README.md) and [05_ENGINEERING](../05_ENGINEERING/README.md).
A rule that changes often was not a principle.
