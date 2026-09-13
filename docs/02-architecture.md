# Architecture

## The one idea

**React runs at build time only. No React reaches the browser.**

The site is a marketing site. Apart from a menu toggle, one form and the
country switch on `/trove`, nothing on it is interactive. So React is used as a
template engine: `scripts/prerender.mjs` imports the components, renders each
route with `renderToStaticMarkup`, and writes finished HTML. The browser receives
HTML, CSS, and a ~2.3 KB enhancement script.

| | Codex prototype | Now |
| --- | --- | --- |
| JS shipped | 71 KB gzipped (React + Phosphor) | **2.3 KB gzipped** (1.4 KB before the evidence layer) |
| Images | 5.2 MB PNG | ~36 KB AVIF for a desktop view |
| What a crawler sees | `<div id="root">` and nothing else | The full page |
| CSP | would need bundler allowances | `script-src 'self'` |

Every dependency is a `devDependency`, because none of them ship.

### What this forbids

- **No `useState`, `useEffect`, or any hook.** Components are pure functions of
  their props. Interactivity lives in `src/client/enhance.js`.
- **No inline `style` attributes.** `style-src 'self'` blocks them and the
  browser drops the styling silently. Use a class.
- **No client-side routing.** Every route is a real HTML file at a real URL.

## Build pipeline

```
npm run build
├── build:fonts      scripts/sync-fonts.mjs        @fontsource → public/fonts/
├── build:images     scripts/optimize-images.mjs   assets-src/ → AVIF/WebP/JPEG + manifest
├── vite build                                     styles.css + enhance.js → dist/client/assets/
├── build:prerender  scripts/prerender.mjs         components → 10 HTML files
└── build:seo        scripts/generate-sitemap.mjs  sitemap.xml, robots.txt, security.txt
```

Two scripts (`prerender`, `generate-sitemap`) are thin runners: they use esbuild
to compile their `.entry.jsx` sibling into `.build/`, import it, then delete it.
Node cannot parse JSX, and `packages: "external"` is required because
`react-dom/server` is CommonJS and calls `require("util")` at load time — which
throws if esbuild rewrites it into an ES module.

`npm run build:og` is deliberately **not** part of the build. The three social
cards are committed brand assets; regenerate them only when the artwork or
wording changes. See [07-decisions.md](07-decisions.md), ADR-005.

## The route table is the source of truth

`src/content/routes.js` drives prerendering, the sitemap, the header and footer
navigation, and the internal link checker. A page that is not in that table does
not get built — which is why the sitemap cannot list a URL that does not exist.

To add a page: add a route record, add a page component in `src/pages/`, add a
case to `renderRoute()` in `scripts/prerender.entry.jsx`. Nav and sitemap follow.

## Request path in production

```
Request
  ↓
worker/index.js                    (run_worker_first: true — see below)
  ├── canonicalRedirect()          www.vroelabs.com → vroelabs.com, 301
  ├── /api/subscribe               → handleSubscribe()
  ├── /api/health, /api/config     → booleans / public site key
  ├── /api/csp-report              → logged, 204
  └── everything else              → env.ASSETS.fetch() → withSecurity() → withCache()
```

**`run_worker_first: true` is load-bearing.** Without it Cloudflare serves a
matching static asset directly and never invokes the worker, so every security
header would be missing from exactly the responses that matter most — the HTML
pages. This was caught by running the site, not by the tests; see ADR-008.

`html_handling: "drop-trailing-slash"` matters for the same reason: the default
(`auto-trailing-slash`) 307-redirects `/trove` to `/trove/`, which would make
every canonical URL on the site a redirect.

## Directory map

```
src/
  content/     ALL copy and metadata. Change wording here, never in a component.
    site.js      SITE_URL and site-wide config — the single domain value
    routes.js    the route table: paths, titles, descriptions, sitemap data
    products.js  Trove and Vero records, incl. status and honesty rules
    notes.js     the two articles, with real publication dates
    legal.js     privacy policy and terms, written against worker/index.js
    copy.js      hero, sections, about, contact, 404
  seo/         SeoHead.jsx (head tags) and JsonLd.jsx (structured data)
  components/  stateless building blocks
  pages/       one component per page type
  layout/      Document.jsx — the <html> shell
  styles/      tokens → fonts → base → layout → hero → products → sections → responsive
  client/      enhance.js — the only browser JavaScript
  generated/   images.json, written by the image pipeline (committed)

worker/
  index.js     routing, asset serving, /api endpoints
  headers.js   CSP and security headers (separate module — see ADR-007)

assets-src/    original high-resolution PNGs. Build inputs; never published.
public/        served as-is: favicon, fonts, generated images, OG cards
dist/client/   build output. This — and only this — is what Cloudflare publishes.
```

`assets-src/` being outside `public/` is what keeps the 5 MB originals off the
wire while remaining in version control.
