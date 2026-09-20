# Investor narrative

**Status:** Draft · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

**Deliberately not written.**

An investor narrative for Trove or Vero would state traction, a market and a
business model for products that have not shipped. Doing that here would break the
site's first rule (never claim a product is available) and its ban on user counts,
revenue, funding and testimonials ([CONTENT.md](../04_DESIGN/CONTENT.md)).

The framework asks that an investor document reject fabricated metrics, unsupported
market claims, fake customer quotes, guaranteed outcomes, unexplained projections
and claims contradicted by the research. This repository already enforces that
more strictly than a document could: `tests/seo.test.mjs` and
`tests/evidence.test.mjs` fail the build on invented ratings, offers, counts and
unsourced figures.

**What would have to be true first:** a product with real usage, and metrics with a
measurement period and a definition ([METRICS.md](METRICS.md)). Until then the
honest answer to "what do we tell investors?" is that this repository has nothing
to state, and the company-level narrative lives with the company.
