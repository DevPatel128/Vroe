# Investor narrative

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

This is not a pitch. It is the set of facts about Vroe Labs that this repository can
stand behind on the date above, and a plain list of what it cannot. A pitch would
state traction, a market and a business model for products that have not shipped;
that would break the site's first rule (never claim a product is available) and its
ban on user counts, revenue, funding and testimonials
([CONTENT.md](../04_DESIGN/CONTENT.md)). The company-level narrative lives with the
company, not in this repository.

## What is real today (2026-09-20)

- **Products.** Vroe Labs is building two: Trove, a personal-finance product, and Vero,
  a proof-of-work-history product. **Neither has shipped.** There is no pricing, no user
  count, no revenue and no launch date, because none exists ([PRODUCT.md](../02_PRODUCT/PRODUCT.md)).
- **The website.** Live at `vroelabs.com` since 2026-09-01, prerendered static HTML on
  Cloudflare. It says where each product stands, first, on its page.
- **Evidence for the problem, not for the product.** `/trove` shows sourced figures on
  the cost of managing personal finances for two countries (India and the United
  States), all collected and published in 2024 or later, each recomputed from its
  source data by a test. It describes the problem and never claims an effect Trove has
  had ([RESEARCH.md](../03_RESEARCH/RESEARCH.md)).
- **Engineering discipline.** Nothing reaches production except through a pull request
  that passes the build, every test and the documentation check; a bad deploy rolls
  itself back; Lighthouse and byte budgets hold the site to a measured standard; no
  Lighthouse audit fails; the early-access list has a backup command, run once
  against production and not yet scheduled ([CI-CD.md](../05_ENGINEERING/CI-CD/CI-CD.md), [METRICS.md](METRICS.md)).
- **Cost.** Infrastructure runs on Cloudflare's free tier; the recurring cost is the
  domain registration ([ADR-018](../08_DECISIONS/ENGINEERING/ADR-018-infrastructure-cost-review-cloudflare-free-tier-only.md),
  [BUSINESS-MODEL.md](BUSINESS-MODEL.md)).

## Risks and unknowns, stated plainly

- No product has shipped, so there is no evidence that either solves the problem it
  addresses. The evidence layer is about the problem only.
- There is no traction data of any kind, and visitor analytics is off.
- One maintainer. A solo repository cannot require a second reviewer
  ([FRAMEWORK-MAP.md](../00_START_HERE/FRAMEWORK-MAP.md)).
- The early-access list lives in one Cloudflare account and its backup on one computer.
  Losing both loses the list, and nothing runs the backup on a schedule yet
  ([BACKUPS.md](../06_OPERATIONS/BACKUPS.md)).
- Recovery of the list has been rehearsed by restoring a production backup into a scratch
  local store, not into production, and a rebuild from nothing is untested
  ([DISASTER-RECOVERY.md](../06_OPERATIONS/DISASTER-RECOVERY.md)).

## What is deliberately not stated

Traction, market size, revenue, projections, customers, testimonials and funding. The
framework's quality gate for an investor document rejects fabricated metrics,
unsupported market claims, fake customer quotes, guaranteed outcomes, unexplained
projections and claims the research contradicts. This repository already enforces that
more strictly than a document could: `tests/seo.test.mjs` and `tests/evidence.test.mjs`
fail the build on invented ratings, offers, counts and unsourced figures.

**What would have to be true first:** a product with real usage, and metrics with a
measurement period and a definition ([METRICS.md](METRICS.md)).
