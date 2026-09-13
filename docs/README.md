# Vroe Labs website — documentation

The complete context for this repository. If you are an AI agent picking this
project up cold, read the **load order** below and nothing else until you need it.

## Load order

Read these four, in order. They are enough to make almost any change safely.

1. **[02-architecture.md](02-architecture.md)** — how the site is built, and why
   React never reaches the browser. Everything else assumes you know this.
2. **[01-brand/brand-guide.md](01-brand/brand-guide.md)** — the brand contract.
   Treat as read-only; it is the client's document, not ours.
3. **[03-content.md](03-content.md)** — where every user-visible string lives,
   and the honesty rules that govern product claims.
4. **[04-security.md](04-security.md)** — the CSP, the headers, and the form
   pipeline. Read before touching `worker/` or adding any dependency.

Then, as needed: [05-seo.md](05-seo.md), [06-deployment.md](06-deployment.md),
[07-decisions.md](07-decisions.md), [08-ai-workflow.md](08-ai-workflow.md).

## Where do I change…?

All paths below are inside `code/` (e.g. "`src/content/`" means
`code/src/content/`) — the buildable app lives there, not at the repo root.

| I want to change | Edit | Then |
| --- | --- | --- |
| Any wording on any page | `src/content/` — never a component | `npm run build` |
| A product's status or description | `src/content/products.js` | Check the status callout in `src/pages/product.jsx` still reads true |
| A page title or meta description | `src/content/routes.js` | `npm run test:seo` |
| Add a page | `src/content/routes.js`, then `src/pages/`, then a case in `scripts/prerender.entry.jsx` | It joins the sitemap and nav automatically |
| A note/article | `src/content/notes.js` | Set a real `updated` date |
| An evidence figure on `/trove` | `src/content/evidence/countries.js` (value), `metrics.js`, `sources.js` | Archive the source in `docs/impact-research/`; `npm run build && npm run test:evidence`. See [10-evidence.md](10-evidence.md) |
| Evidence copy on `/trove` | `src/content/evidence/trove.js` — no numbers in it | `npm run test:evidence` |
| Colours, spacing, type | `src/styles/tokens.css` | Must match the brand guide |
| Anything visual | `src/styles/*.css` — **never** an inline `style` attribute | The CSP blocks inline styles; `npm run test:security` enforces it |
| Security headers or the CSP | `worker/headers.js` | `npm run test:security` |
| The signup pipeline | `worker/index.js` | Update `src/content/legal.js` if what you store changes |
| The production domain | `SITE_URL` in `src/content/site.js` | One value drives canonicals, OG, sitemap and robots |
| Deploy config | `wrangler.jsonc` | See [06-deployment.md](06-deployment.md) |

## The five rules

1. **Never claim a product is available.** Neither Trove nor Vero has shipped.
   See the honesty rules in [03-content.md](03-content.md).
2. **Never weaken the CSP.** If something needs `unsafe-inline`, the something is
   wrong, not the policy. See [04-security.md](04-security.md).
3. **Content lives in `src/content/`,** never hard-coded in a component.
4. **No React in the browser.** If you find yourself adding a client-side
   framework, re-read [02-architecture.md](02-architecture.md) first.
5. **Never invent structured data.** No ratings, reviews, offers, or counts.

## Map of the rest

| File | What it covers |
| --- | --- |
| [00-framework-map.md](00-framework-map.md) | How this repo relates to the 5-step company framework, and which parts do not apply |
| [01-brand/design-system.md](01-brand/design-system.md) | Brand token → CSS custom property → where it is used |
| [05-seo.md](05-seo.md) | Metadata, structured data shapes, internal linking, keywords |
| [06-deployment.md](06-deployment.md) | Cloudflare and GitHub Actions runbook, secrets, rollback |
| [07-decisions.md](07-decisions.md) | ADR log — every non-obvious choice and why |
| [08-ai-workflow.md](08-ai-workflow.md) | Conventions for agents working in this repo |
| [09-qa/](09-qa/) | QA records from the prototype and the responsive/a11y matrix |

Root-level `README.md` and `SECURITY.md` stay at the true repo root — GitHub
convention, and `SECURITY.md` powers the repo's Security tab.
`SECURITY_AUDIT.md`, `SEO_AUDIT.md`, `SEARCH_CONSOLE_SETUP.md` and
`PRODUCTION_CHECKLIST.md` live in this `docs/` folder.
