# Vroe Labs website — documentation

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

The complete context for this repository, organised so that anyone, human or AI,
knows exactly where a thing lives. If you are an agent picking this project up
cold, read this page, then go only to the documents your task needs.

> **I know what I need → I know exactly where it lives.** Every concept has one
> canonical home. Other documents link to it; they do not copy it.

## The ten areas

Everything under `docs/` sits in one of these. There are no others.

| Area | It answers | Front door |
| --- | --- | --- |
| `00_START_HERE` | What is this, and where do I go? | This page |
| `01_PRINCIPLES` | What rules does everything follow? | [PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md) |
| `02_PRODUCT` | What is it, why does it exist, how should it feel? | [README](../02_PRODUCT/README.md) |
| `03_RESEARCH` | What is the evidence, and where did it come from? | [RESEARCH.md](../03_RESEARCH/RESEARCH.md) |
| `04_DESIGN` | How does it look, read and behave for everyone? | [README](../04_DESIGN/README.md) |
| `05_ENGINEERING` | How is it built, secured, shipped and kept fast and cheap? | [README](../05_ENGINEERING/README.md) |
| `06_OPERATIONS` | Something broke, or I need to run it. What do I do? | [README](../06_OPERATIONS/README.md) |
| `07_BUSINESS` | What do we tell investors, and what is measured? | [README](../07_BUSINESS/README.md) |
| `08_DECISIONS` | Why did we choose this? | [DECISIONS.md](../08_DECISIONS/DECISIONS.md) |
| `09_ARCHIVE` | What did we set aside, and why? | [README](../09_ARCHIVE/README.md) |

## Where do I start?

| I need to understand | Go here |
| --- | --- |
| What this site is | [PRODUCT.md](../02_PRODUCT/PRODUCT.md) |
| Why it exists | [THESIS.md](../02_PRODUCT/THESIS.md) |
| How it should feel | [EXPERIENCE.md](../02_PRODUCT/EXPERIENCE.md) |
| The rules I must not break | [PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md) |
| Where a figure on `/trove` comes from | [RESEARCH.md](../03_RESEARCH/RESEARCH.md), then [SOURCES.md](../03_RESEARCH/SOURCES.md) |
| What I may claim about a product | [CONTENT.md](../04_DESIGN/CONTENT.md) |
| The brand, colours, type | [BRAND-GUIDE.md](../04_DESIGN/BRAND-GUIDE.md), [DESIGN-SYSTEM.md](../04_DESIGN/DESIGN-SYSTEM.md) |
| How it is built, and why React never reaches the browser | [ARCHITECTURE.md](../05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md) |
| How it is secured | [SECURITY.md](../05_ENGINEERING/SECURITY/SECURITY.md) |
| How to make a change | [DEVELOPMENT.md](../05_ENGINEERING/DEVELOPMENT/DEVELOPMENT.md) |
| How it deploys, and what gates a deploy | [CI-CD.md](../05_ENGINEERING/CI-CD/CI-CD.md) |
| Something broke | [06_OPERATIONS](../06_OPERATIONS/README.md) |
| Why we made a decision | [DECISIONS.md](../08_DECISIONS/DECISIONS.md) |
| Investor information | [INVESTOR.md](../07_BUSINESS/INVESTOR.md) |
| A rejected idea | [REJECTED-IDEAS](../09_ARCHIVE/REJECTED-IDEAS/README.md) |
| How this repo relates to the company framework | [FRAMEWORK-MAP.md](FRAMEWORK-MAP.md) |

## Load order

Four documents are enough to make almost any change safely. Read them in order.

1. **[ARCHITECTURE.md](../05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md)** — how the
   site is built, and why React never reaches the browser. Everything else assumes
   you know this.
2. **[BRAND-GUIDE.md](../04_DESIGN/BRAND-GUIDE.md)** — the brand contract. Treat it
   as read-only; it is the client's document, not ours.
3. **[CONTENT.md](../04_DESIGN/CONTENT.md)** — where every user-visible string
   lives, and the honesty rules that govern product claims.
4. **[SECURITY.md](../05_ENGINEERING/SECURITY/SECURITY.md)** — the CSP, the headers
   and the form pipeline. Read before touching `worker/` or adding a dependency.

## Where do I change…?

All paths below are inside `code/` (so "`src/content/`" means `code/src/content/`)
— the buildable app lives there, not at the repo root.

| I want to change | Edit | Then |
| --- | --- | --- |
| Any wording on any page | `src/content/` — never a component | `npm run build` |
| A product's status or description | `src/content/products.js` | Check the status callout in `src/pages/product.jsx` still reads true |
| A page title or meta description | `src/content/routes.js` | `npm run test:seo` |
| Add a page | `src/content/routes.js`, then `src/pages/`, then a case in `scripts/prerender.entry.jsx` | It joins the sitemap and nav automatically |
| A note/article | `src/content/notes.js` | Set a real `updated` date |
| An evidence figure on `/trove` | `src/content/evidence/countries.js` (value), `metrics.js`, `sources.js` | Archive the source in `docs/03_RESEARCH/impact-research/`; `npm run build && npm run test:evidence`. See [RESEARCH.md](../03_RESEARCH/RESEARCH.md) |
| Evidence copy on `/trove` | `src/content/evidence/trove.js` — no numbers in it | `npm run test:evidence` |
| Colours, spacing, type | `src/styles/tokens.css` | Must match the brand guide |
| The icon in Safari Favourites or on a home screen | `scripts/generate-icons.mjs` | `npm run build:icons`, then commit `public/apple-touch-icon.png` |
| Anything visual | `src/styles/*.css` — **never** an inline `style` attribute | The CSP blocks inline styles; `npm run test:security` enforces it |
| Security headers or the CSP | `worker/headers.js` | `npm run test:security` |
| The signup pipeline | `worker/index.js` | Update `src/content/legal.js` if what you store changes |
| The production domain | `SITE_URL` in `src/content/site.js` | One value drives canonicals, OG, sitemap and robots |
| Deploy config | `wrangler.jsonc` | See [CI-CD.md](../05_ENGINEERING/CI-CD/CI-CD.md) and [INFRASTRUCTURE.md](../05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md) |
| A performance budget | `tests/performance.test.mjs` (bytes), `perf/run.mjs` (Lighthouse) | Record the reason as an ADR. See [PERFORMANCE.md](../05_ENGINEERING/PERFORMANCE/PERFORMANCE.md) |
| The health check or the automatic rollback | `.github/workflows/health.yml`, `.github/workflows/deploy.yml` | These are the safeguards, so change them deliberately (ADR-020). See [OBSERVABILITY.md](../06_OPERATIONS/OBSERVABILITY.md) |
| A document | The canonical document for that concept, from the table below | Never create a second home for a concept |

## Which document is authoritative?

| Concept | Canonical home |
| --- | --- |
| The rules everything follows | [PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md) |
| What the product is | [PRODUCT.md](../02_PRODUCT/PRODUCT.md) |
| Why it exists | [THESIS.md](../02_PRODUCT/THESIS.md) |
| The user experience | [EXPERIENCE.md](../02_PRODUCT/EXPERIENCE.md) |
| Research evidence and figures | [RESEARCH.md](../03_RESEARCH/RESEARCH.md) |
| Where each source came from | [SOURCES.md](../03_RESEARCH/SOURCES.md) |
| What may be claimed, and the voice | [CONTENT.md](../04_DESIGN/CONTENT.md) |
| Visual rules | [DESIGN-SYSTEM.md](../04_DESIGN/DESIGN-SYSTEM.md) |
| Accessibility | [ACCESSIBILITY.md](../04_DESIGN/ACCESSIBILITY.md) |
| Architecture | [ARCHITECTURE.md](../05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md) |
| Security | [SECURITY.md](../05_ENGINEERING/SECURITY/SECURITY.md) |
| The stored data | [DATA.md](../05_ENGINEERING/DATA/DATA.md) |
| Deployment pipeline | [CI-CD.md](../05_ENGINEERING/CI-CD/CI-CD.md) |
| Rolling back | [ROLLBACKS.md](../06_OPERATIONS/ROLLBACKS.md) |
| Decision history | [DECISIONS.md](../08_DECISIONS/DECISIONS.md) |
| Investor narrative | [INVESTOR.md](../07_BUSINESS/INVESTOR.md) |

## Conventions

- **Status header.** Every document opens with one line: `Status` (Draft, Review,
  Approved, Superseded or Archived), `Last updated`, `Owner`, `Version`. Never
  treat an Archived or Superseded document as current truth. `npm run test:docs`
  checks the header.
- **One canonical home.** Before writing a new file, ask whether a canonical
  document already owns the concept. If it does, update that one. If not, find
  which area owns it. Add a file only when the concept is genuinely distinct, will
  be referenced repeatedly, and would make another document harder to read if kept
  there. The aim is fewer meaningful places, not more files.
- **Archive, don't delete.** Superseded material goes to
  [09_ARCHIVE](../09_ARCHIVE/README.md), which never competes with current
  documentation.
- **Agents.** How to navigate, propose changes and report what you consulted is in
  [AI-WORKFLOW.md](../05_ENGINEERING/AI/AI-WORKFLOW.md).
- **Root files.** `README.md`, `SECURITY.md`, `CONTRIBUTING.md` and `CLAUDE.md`
  stay at the repository root (GitHub convention, and the agent entry point).
  They summarise and link here; they do not restate what lives here.
