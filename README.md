# Vroe Labs

The website for [Vroe Labs](https://vroelabs.com), a product studio building
useful, thoughtful products.

Prerendered static HTML on Cloudflare Workers. **No React reaches the browser** —
it is a build-time template engine here, so the site ships about 1.4 KB of
JavaScript.

## Quick start

```bash
cd code             # the buildable app lives here, not the repo root
npm ci
npm run build
npm run preview     # wrangler dev on http://localhost:8788
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run build` | Fonts → images → Vite → prerender → sitemap |
| `npm run preview` | Serve the built site through the real worker |
| `npm test` | Every suite: worker behaviour, security, SEO, evidence, performance budgets |
| `npm run test:security` | Headers, CSP, subscribe pipeline, build hygiene |
| `npm run test:seo` | Metadata, structured data, sitemap, links, images |
| `npm run test:performance` | Byte budgets: JavaScript, CSS, HTML, fonts, images |
| `npm run perf` | Lighthouse budgets against `npm run preview` (needs Chrome and `cd perf && npm ci`) |
| `npm run audit:deps` | `npm audit --audit-level=high` |
| `npm run audit:sbom` | CycloneDX SBOM → `sbom.json` |
| `npm run build:og` | Regenerate the three social cards (not part of `build`) |
| `npm run build:icons` | Regenerate the Safari touch icon (not part of `build`) |
| `npm run deploy` | Build and deploy to Cloudflare |

## Where things are

```
code/            buildable app — package.json, vite.config.mjs, wrangler.jsonc
  src/content/   ALL copy and metadata — change wording here, never in a component
  src/pages/     one component per page type
  src/styles/    tokens → fonts → base → components → responsive
  src/client/    enhance.js — the only JavaScript that reaches the browser
  worker/        Cloudflare Worker: security headers, canonical redirect, /api
  scripts/       build pipeline (images, prerender, sitemap, OG cards, fonts)
docs/             full documentation — start with docs/README.md
```

## Documentation

**[docs/README.md](docs/README.md)** is the entry point. It has a load order and
a "where do I change X?" table.

- [Architecture](docs/02-architecture.md) — how it builds, and why no React ships
- [Brand guide](docs/01-brand/brand-guide.md) and [design system](docs/01-brand/design-system.md)
- [Content](docs/03-content.md) — copy locations and the honesty rules
- [Security](docs/04-security.md) — threat model, CSP, the form pipeline
- [SEO](docs/05-seo.md) — metadata, structured data, linking
- [Deployment](docs/06-deployment.md) — Cloudflare and CI runbook
- [Decisions](docs/07-decisions.md) — every non-obvious choice, and why

## Products

Both are in progress and the site says so on every page that mentions them.

- **Trove** — personal finance. Status: *Taking shape*. Not yet available.
- **Vero** — verified work history. Status: *Upcoming*. An exploration, not a product.

Nothing on this site claims either is usable today. See
[the honesty rules](docs/03-content.md#honesty-rules).

## Security

Strict CSP with no `unsafe-inline` or `unsafe-eval`, full security header set on
every response, Turnstile plus rate limiting on the one write endpoint, and no
secrets in the repository. Report a vulnerability via [SECURITY.md](SECURITY.md).

## Licence

Source code: [MIT](LICENSE). Brand assets, copy, photography and the Vroe Labs
name are © Vroe Labs and not covered by that licence.
