# Vroe Labs website — agent entry point

Marketing site for Vroe Labs. Prerendered static HTML on Cloudflare Workers.

**Read [docs/README.md](docs/README.md) before making changes.** It has the load
order and a "where do I change X?" table. This file is the summary.

## The one thing to understand first

**React runs at build time only. No React reaches the browser.** Components are
rendered to HTML by `scripts/prerender.mjs` and the browser gets ~2.3 KB of
vanilla JS. So:

- Components are **pure** — no `useState`, no hooks, no client state
- Interactivity lives in `src/client/enhance.js`
- Every package is a `devDependency`, because nothing ships

## The five rules

1. **Never claim a product is available.** Neither Trove nor Vero has shipped.
   No external product links, no `offers` in structured data, no present-tense
   "Trove is a…". The evidence on `/trove` describes the problem only — never
   that Trove saves time or money. → [docs/03-content.md](docs/03-content.md),
   [docs/10-evidence.md](docs/10-evidence.md)
2. **Never weaken the CSP.** No `unsafe-inline`, no `unsafe-eval`, no wildcards.
   In particular: **no inline `style` attributes** — they are blocked and the
   browser drops the styling silently. Use a class.
   → [docs/04-security.md](docs/04-security.md)
3. **All copy lives in `code/src/content/`,** never hard-coded in a component.
4. **No React in the browser.** → [docs/02-architecture.md](docs/02-architecture.md)
5. **No invented structured data.** No ratings, reviews, offers or counts.

## Commands

```bash
cd code                # the buildable app lives here, not the repo root
npm ci
npm run build           # fonts → images → vite → prerender → sitemap
npm test                # 98 tests — all must pass
npm run preview         # wrangler dev on :8788
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
  scripts/       optimize-images, prerender, generate-sitemap, generate-og, sync-fonts
docs/             full documentation
  impact-research/  evidence source files (raw/ gitignored), scripts, derived outputs
```

If you change what the subscribe endpoint stores, **update
`code/src/content/legal.js` in the same change** — the privacy policy is
written against the worker's actual behaviour.
