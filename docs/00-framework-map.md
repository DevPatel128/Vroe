# Relationship to the 5-step company framework

The Vroe Labs framework (`Projects /Framework/`) is a set of **meta-prompt
templates** for building a whole venture — Steps 1–5 cover ideation, engineering,
marketing, optimisation, and launch/scale. They are unfilled templates: they
contain no Vroe Labs facts, and they describe a full product build (recommendation
engines, vector databases, AI memory, multi-region scaling, payments, auth).

This repository is a **marketing website**. Applying the framework literally here
would produce exactly the "enterprise overengineering" its own output rules
forbid. This file records what was taken and what was deliberately left.

## The tech stack diagram — followed

| Layer | In this repo |
| --- | --- |
| GitHub | Source of truth, private repo `Vroe` |
| GitHub Actions | CI (build, test, audit) and deploy on push to `main` |
| Cloudflare Workers | `worker/index.js` — headers, canonical redirect, `/api/*` |
| Cloudflare static assets | `dist/client`, served via the `ASSETS` binding |
| Cloudflare DNS | `vroelabs.com` + `www`, custom domains on the worker |
| Cloudflare WAF / Bot | Bot Fight Mode, Always Use HTTPS, min TLS 1.2 |
| Cloudflare Turnstile | Bot check on the subscribe form |

## Deliberately not used

| Stack item | Why not, and when to revisit |
| --- | --- |
| **Supabase** | Excluded on instruction. One list of email addresses does not need Postgres, and the free org is at its two-project cap. Workers KV instead. Revisit if the list needs querying or joins. ADR-010 |
| **PostHog** | Cookieless Cloudflare Web Analytics instead: ~5 KB and no consent banner, versus ~50 KB and one. PostHog stays the product-analytics layer for Trove and Vero. ADR-011 |
| **Sentry** | A static site plus a 500-line worker has almost no runtime to instrument. Workers Logs covers it. Revisit when `/api` grows. ADR-012 |
| **Stripe** | Nothing is sold here. |
| **Queues, R2** | No background work, no user uploads. |
| **Auth, Realtime** | No accounts, nothing live. |

## Framework sections and this repo

### Step 1 — Ideation & Documentation

Partially applicable. Its documentation system (`context.md`, `vision.md`,
`brand_positioning.md`…) is company-level and lives with the company, not the
website repo. What this repo holds is the website-scoped equivalent:

| Framework artefact | Here |
| --- | --- |
| `brand_positioning.md` | [01-brand/brand-guide.md](01-brand/brand-guide.md) — the client's document, verbatim |
| `product_portfolio.md` | `src/content/products.js` |
| `mvp_scope.md` | [02-architecture.md](02-architecture.md), route table |
| Landing page validation | The subscribe form — the site's one measurable signal |

### Step 2 — Engineering the Product

Applicable in the narrow sense. Of its output files, four have real analogues:

| Framework file | Here |
| --- | --- |
| `frontend_architecture.md` | [02-architecture.md](02-architecture.md) |
| `design_system.md` | [01-brand/design-system.md](01-brand/design-system.md) |
| `security_architecture.md`, `threat_model.md` | [04-security.md](04-security.md) |
| `deployment_pipeline.md` | [06-deployment.md](06-deployment.md) |

Not applicable: AI systems, recommendation engines, vector databases, RAG, LLM
ops, eval harnesses, multi-region strategy, queue and event systems, database
schema, auth systems. There is no application here to apply them to.

### Step 3 — Marketing

Partially. [05-seo.md](05-seo.md) covers the technical SEO and conversion
surface. Audience building, paid acquisition, partnerships and content strategy
are company activities, not repository concerns.

### Steps 4 and 5 — Optimisation, Launch & Scale

Deferred. The site has no traffic yet, so there is nothing to optimise against.
The measurement that would inform it is in place: Cloudflare Web Analytics, the
Lighthouse budgets in CI, and Search Console once verified.

## The rule

When the framework and this repository disagree, the framework is a template and
this repository is the running system. Follow the framework's *intent* —
modular, scalable, secure, honest — not its file list.
