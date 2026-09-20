# Vroe Labs website — agent entry point

Marketing site for Vroe Labs. Prerendered static HTML on Cloudflare Workers.

**Read [docs/00_START_HERE/README.md](docs/00_START_HERE/README.md) before making changes.** It says
where every kind of information lives, and has the load order and a "where do I
change X?" table. This file is the summary. Report which canonical documents you
consulted.

## The one thing to understand first

**React runs at build time only. No React reaches the browser.** Components are
rendered to HTML by `scripts/prerender.mjs` and the browser gets ~2.3 KB of
vanilla JS. So:

- Components are **pure** — no `useState`, no hooks, no client state
- Interactivity lives in `src/client/enhance.js`
- Every package is a `devDependency`, because nothing ships

## The five rules

Summarised here because agents arrive here first; the canonical statement is
[docs/01_PRINCIPLES/PRINCIPLES.md](docs/01_PRINCIPLES/PRINCIPLES.md).

1. **Never claim a product is available.** Neither Trove nor Vero has shipped.
   No external product links, no `offers` in structured data, no present-tense
   "Trove is a…". The evidence on `/trove` describes the problem only — never
   that Trove saves time or money. → [docs/04_DESIGN/CONTENT.md](docs/04_DESIGN/CONTENT.md),
   [docs/03_RESEARCH/RESEARCH.md](docs/03_RESEARCH/RESEARCH.md)
2. **Never weaken the CSP.** No `unsafe-inline`, no `unsafe-eval`, no wildcards.
   In particular: **no inline `style` attributes** — they are blocked and the
   browser drops the styling silently. Use a class.
   → [docs/05_ENGINEERING/SECURITY/SECURITY.md](docs/05_ENGINEERING/SECURITY/SECURITY.md)
3. **All copy lives in `code/src/content/`,** never hard-coded in a component.
4. **No React in the browser.** → [docs/05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md](docs/05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md)
5. **No invented structured data.** No ratings, reviews, offers or counts.

## Before a consequential change

Answer why, impact, how, cost, and whether the cost is justified — and label
claims as fact, assumption or unknown. Record non-obvious decisions as an ADR
using the template in [docs/08_DECISIONS/DECISIONS.md](docs/08_DECISIONS/DECISIONS.md).
→ [docs/05_ENGINEERING/AI/AI-WORKFLOW.md](docs/05_ENGINEERING/AI/AI-WORKFLOW.md). How this repo maps to the
company framework, and its open gaps: [docs/00_START_HERE/FRAMEWORK-MAP.md](docs/00_START_HERE/FRAMEWORK-MAP.md).

## Documentation

`docs/` has ten numbered areas and nothing else; every concept has one canonical
home, and every document opens with a status header. Update the canonical document
rather than adding a second one. `npm run test:docs` enforces the structure,
headers and links.

**Document every change in the same change.** Add or alter a script, workflow,
route, binding, endpoint, secret, behaviour or policy, and the canonical document
changes in the same pull request, with its `Last updated` date bumped.
`npm run test:docs-sync` fails when a fact in the code is missing from its document,
and the required `docs-impact` check fails a pull request that changes what the
docs describe without changing them (escape hatch: a line `Docs: none, <reason>` in
the description). Fix the document; do not loosen the check.
[ADR-023](docs/08_DECISIONS/ENGINEERING/ADR-023-documentation-follows-every-change-enforced-in-ci.md).

## Commands

```bash
cd code                # the buildable app lives here, not the repo root
npm ci
npm run build           # fonts → images → vite → prerender → sitemap
npm test                # every suite — all must pass
npm run preview         # wrangler dev on :8787 (next free port if taken)
npm run deploy          # build + wrangler deploy
```

Always finish with `npm run build && npm test && npm audit --audit-level=high`,
then **look at the site**. Two of the three real bugs found while building this
were invisible to the tests and obvious in a browser.

## Gotchas that have already bitten

| Symptom | Cause |
| --- | --- |
| Styling silently missing | Inline `style` attribute — CSP blocks it. ADR-009 |
| Worker won't start: "not of type 'function or ExportedHandler'" | Non-function named export in `code/worker/index.js`. Constants go in `code/worker/headers.js`. ADR-007 |
| Security headers missing in production | `assets.run_worker_first` turned off. ADR-008 |
| Canonical URLs 307-redirecting | `html_handling` must be `drop-trailing-slash` |
| OG card text clipped | One long `<path>` — librsvg truncates it. One path per glyph. ADR-005 |
| `npm run preview` returns only 301s | `wrangler dev` rewrites the URL and Host to the custom domain, so the worker sees `http://vroelabs.com/`. The HTTPS upgrade is gated on `CF-Ray`. ADR-014 |
| A failed form submit loses the button's arrow icon | `button.textContent = …` replaces child nodes. Use `replaceChildren`. |
| Build fails: "Evidence data failed validation" | A figure lacks a source or locator, a calculated metric has a typed value, or a population's age band or year does not match. Fix in `code/src/content/evidence/`. ADR-015 |
| An element toggled with `hidden` stays visible | A class sets `display`, which beats the browser's `[hidden]` rule. `evidence.css` restates it for the evidence layer. |
| Build fails: "Cannot find package 'x'" after a Dependabot bump | A script imports `x` directly, but `x` only arrived as a dependency of something else that has since dropped it. Declare it in `package.json`. ADR-019 |
| `npm test` fails "over budget" | Something got bigger than `tests/performance.test.mjs` allows. Find out why before raising the number; if the growth is right, record it as an ADR. ADR-021 |
| Subscriber data about to be committed | The backup command writes `backups/` in the repo folder. It is gitignored and a test proves it; never `git add -f` it, and never copy a snapshot into the repo elsewhere. ADR-022 |
| Can't push to `main` | It requires a pull request that passes `verify` and `docs-impact`. That is intended. ADR-020, ADR-023 |

## Layout

```
code/            buildable app — package.json, vite.config.mjs, wrangler.jsonc
  src/content/   copy + metadata (site, routes, products, notes, legal, copy)
    evidence/    sources, metrics, countries (raw figures), derive, trove story
  src/seo/       SeoHead.jsx, JsonLd.jsx
  src/pages/     one component per page type
  src/components/evidence/  India story, ranking, country panels, method
  src/styles/    tokens → fonts → base → layout → hero → products → evidence → sections → responsive
  src/client/    enhance.js — the only browser JS
  worker/        index.js (routing, /api) + headers.js (CSP, security headers)
  scripts/       optimize-images, prerender, generate-sitemap, generate-og, generate-icons, sync-fonts,
                 backup-subscribers (npm run backup), docs-impact (the docs check CI runs)
docs/             documentation, in ten numbered areas (start at 00_START_HERE)
  03_RESEARCH/impact-research/  evidence source files (raw/ gitignored), scripts, derived outputs
```

If you change what the subscribe endpoint stores or keeps (including how long the
backups are kept), **update
`code/src/content/legal.js` in the same change** — the privacy policy is
written against the worker's actual behaviour.
