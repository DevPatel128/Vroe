# Decision log

Every non-obvious choice, and what it cost. Read before reversing any of them.

---

## ADR-001 — Prerender with React rather than ship a SPA

**Context.** The prototype was a client-rendered React SPA: 71 KB gzipped of
JavaScript to render a page that is static apart from a menu toggle and one form.
Crawlers saw an empty `<div id="root">`.

**Decision.** Keep React as the authoring model, but render every route to HTML
at build time with `renderToStaticMarkup` and ship no React at all. Interactivity
moves to a ~1.4 KB vanilla script.

**Consequences.** 50× less JavaScript; real HTML for crawlers on every route;
a strict CSP becomes possible. In exchange, components must be pure — no hooks,
no state — and interactivity is hand-written DOM code. Every dependency becomes
a `devDependency`.

**Alternatives.** Astro would have given the same result but meant a larger
rewrite and a new framework to learn. Hydrating React would have kept the 71 KB.

---

## ADR-002 — Content in `src/content/`, never in components

**Decision.** All user-visible text lives in six content modules.

**Consequences.** Copy is reviewable without reading JSX; the honesty rules can
be enforced in one place; the route table can drive prerendering, the sitemap,
navigation and the link checker from a single definition.

---

## ADR-003 — Self-host the fonts

**Context.** The prototype `@import`ed Instrument Serif and DM Sans from
`fonts.googleapis.com`: a render-blocking third-party request, and a CSP that
needs `'unsafe-inline'` in `style-src` plus two Google origins.

**Decision.** Copy the five woff2 files this site uses from `@fontsource` into
`public/fonts/` under stable, unhashed names, with hand-written `@font-face`
rules in `src/styles/fonts.css`.

**Consequences.** `style-src 'self'; font-src 'self'` with nothing else, no
third-party request, and `<link rel="preload">` can name an exact file (a build
hash would change every release and silently stop matching). The cost is
`scripts/sync-fonts.mjs`, which must be re-run when `@fontsource` is updated —
it fails loudly if a source file moves.

---

## ADR-004 — HSTS without `preload`

**Decision.** `max-age=31536000; includeSubDomains`, and **no** `preload`.

**Rationale.** `includeSubDomains` already protects subdomains. Preload adds the
domain to a list baked into browser binaries; removal takes months. A subdomain
is planned (`trove.vroelabs.com`) and is not yet live, so committing every future
subdomain to HTTPS-only forever is a promise we cannot yet keep.

**Revisit when** every intended subdomain exists and serves HTTPS.

---

## ADR-005 — Render OG card text as vector outlines

**Context.** The three 1200×630 social cards need Instrument Serif. sharp renders
SVG through librsvg, which resolves `font-family` via fontconfig — and Instrument
Serif is not a system font. It silently fell back to a sans-serif locally and
would fall back to something different again on a CI runner.

**Decision.** Parse the woff with opentype.js and convert text to SVG paths,
positioning glyphs individually with kerning.

**Consequences.** Byte-stable output on any machine, no system font dependency.
Two wrinkles worth knowing: opentype.js's own `getPath()` throws on this font
(an unsupported ccmp GSUB lookup), hence the manual per-glyph layout; and each
glyph is emitted as its own `<path>` because **librsvg silently truncates a very
long `d` attribute** — one 6 KB path lost the tail of every line of text.

`npm run build:og` is not part of `npm run build`; the cards are committed.

---

## ADR-006 — Trove is not presented as live

**Context.** The SEO brief was written when Trove was assumed to be live, and
specified a `SoftwareApplication` with a free `Offer` at 0 INR. Trove has not
shipped.

**Decision.** No external Trove link anywhere; status pill reads "Taking shape";
the JSON-LD keeps `SoftwareApplication` but carries **no `offers` block**; the
meta description's present tense is rephrased.

**Rationale.** An offer asserts something is purchasable, or free, right now.
That is a false availability claim, forbidden both by Google's structured-data
policy and by the brand guide's own rule.

**Reversing this** is two fields in `src/content/products.js` plus re-adding
`offers` in `src/seo/JsonLd.jsx` — on the day Trove actually ships.

---

## ADR-007 — Security headers in their own module

**Context.** `worker/index.js` exported `CSP` so the tests could assert on it.
The Workers runtime refused to start: *"Incorrect type for map entry 'CSP': the
provided value is not of type 'function or ExportedHandler'."* Every named export
of a Worker entry module must be a handler.

**Decision.** Move the policy and headers to `worker/headers.js`.

**Consequences.** The worker and the tests import the same values, and the entry
module exports only functions. Caught by running the site — a unit test against
the module could never have found it.

---

## ADR-008 — `run_worker_first: true`

**Context.** With static assets configured, Cloudflare serves a matching asset
**directly and never invokes the worker**. Every security header was therefore
absent from exactly the responses that mattered most: the HTML pages. `curl -I`
against the running site showed only `Cache-Control`.

**Decision.** Set `assets.run_worker_first: true` so every request goes through
the worker, which fetches the asset via the `ASSETS` binding and attaches the
headers on the way out. Also `html_handling: "drop-trailing-slash"`, because the
default 307-redirects `/trove` to `/trove/` — making every canonical URL on the
site a redirect.

**Consequences.** One worker invocation per request. Well within the free tier
for a marketing site, and consistent headers across HTML, assets and errors is
the entire requirement.

---

## ADR-009 — No inline `style` attributes

**Context.** Enforcing `style-src 'self'` produced 24 CSP violations on first
run: the twelve Trove chart bars (`style={{height: '30%'}}`) and a handful of
spacing one-offs in the page templates.

**Decision.** Move all of them into CSS. Bar heights became
`.bars span:nth-child(n)` rules — the values are static illustration data anyway
— and the spacing became named utility classes in `base.css`.

**Rationale.** The alternative was `'unsafe-inline'` in `style-src`, which is a
bad trade for a decorative bar chart. `npm run test:security` now fails on any
`style="` in the output.

---

## ADR-010 — Cloudflare KV, not Supabase

**Context.** The company tech stack puts Supabase as the data layer, and the
Trove project already uses it.

**Decision.** Store subscribers in Workers KV. No Supabase.

**Rationale.** One list of email addresses does not need a Postgres instance,
and the free Supabase org is already at its two-project cap. Cloudflare is in
the stack diagram too. Migrating later is a change to one function,
`storeSubscriber()`.

---

## ADR-011 — Cloudflare Web Analytics, not PostHog

**Decision.** Cookieless Cloudflare Web Analytics on the marketing site.
PostHog remains the product-analytics layer for Trove and Vero.

**Rationale.** ~5 KB and no cookies, versus ~50 KB and a consent banner. Funnels
and session data matter in a product; page views are what matter here.

---

## ADR-012 — Sentry deferred

**Decision.** Workers Logs only (`observability.enabled`).

**Rationale.** A static site plus a 500-line worker has almost no runtime to
instrument, and Sentry would add a dependency and a third-party origin. Trove
itself removed Sentry to fit its bundle. Revisit when `/api` grows.

---

## ADR-013 — `/privacy` and `/terms` in the sitemap

**Context.** The supplied sitemap list omitted them, but also said "include only
canonical, public, indexable URLs".

**Decision.** Include them. They are canonical, public and indexable, and the
omission predated the decision to add legal pages at all.

---

## ADR-014 — The HTTPS upgrade is gated on `CF-Ray`

**Context.** `npm run preview` served nothing but 301 redirects. `wrangler dev`
derives the request URL — and the Host header — from the first entry in
`routes`, so the worker saw `http://vroelabs.com/…` on a local request. That is
the canonical host over plain HTTP, so `canonicalRedirect()` took the
HTTPS-upgrade branch and returned `https://vroelabs.com/…`; wrangler then
rewrote that `Location` back to `http://localhost:8788/…` and the browser looped
until it gave up. The existing `isLocal` check could not catch it, because by
the time the worker sees the request nothing about it looks local any more.

**Decision.** Gate the scheme upgrade — and only the scheme upgrade — on the
presence of the `CF-Ray` request header:

```js
const atEdge = request.headers.has("cf-ray");
const insecure = url.protocol === "http:" && atEdge;
```

**Rationale.** Cloudflare attaches `CF-Ray` to every request that reaches the
edge and overwrites anything the client sends, so it cannot be suppressed by a
visitor in production. It is absent under `wrangler dev`. This was **verified
rather than assumed**: running the worker on real Cloudflare infrastructure with
`wrangler dev --remote` and probing the request showed `cf-ray` present, host
`vroelabs.com`, protocol `https:`.

The canonical-host redirect is deliberately **not** gated. If the edge ever
stopped sending `CF-Ray`, the worst case is that the worker stops upgrading
plain HTTP — which Cloudflare's "Always Use HTTPS" setting and HSTS both still
cover — rather than the site quietly becoming reachable on two hostnames.

**Alternative rejected.** A `dev` block in `wrangler.jsonc` (`ip`, `port`,
`local_protocol`) does not change the URL wrangler hands the worker; it was
tried and had no effect. Relying on config would also leave the loop in place
for anyone running `wrangler dev` without it.

`tests/security.test.mjs` covers both directions: a request without `CF-Ray` is
never redirected, an edge request still upgrades and canonicalises, and www
still folds to the apex without `CF-Ray`.

---

## ADR-015 — An evidence layer where research and product impact never mix

**Context.** `/trove` should show, India first, what managing personal finances
costs people in time, attention and money, then how other countries compare,
then Trove's response — and one day what Trove has measurably changed. The same
structure should serve every future Vroe product. The risk is obvious: a page of
striking numbers is exactly where invented, mismatched or quietly rounded-up
figures creep in.

**Decision.** A data layer in `src/content/evidence/`:

- `sources.js`, `metrics.js` and `countries.js` hold studies, questions and raw
  published values. `countries.js` is the only place a number is typed.
- `derive.js` computes every calculated value, population aggregate, rank and
  formatted number at build time, and validates the lot. The prerenderer fails
  the build on any problem.
- `trove.js` holds the copy and contains no numbers.
- Research is `origin: "external"`; measured impact is a separate `impact` array
  with `origin: "product"`, rendered in its own block. Validation rejects any mix.
- A product appears in `EVIDENCE` only once it has a researched story. Vero does
  not, so `/vero` is unchanged.

Raw source files live in `docs/impact-research/raw/` (gitignored for size), with
URLs and SHA-256 checksums in the README there. The India time figure is
computed from MoSPI microdata by a committed script whose method first
reproduces MoSPI's published tables.

**Consequences.** `/trove` grows to about 98 KB of HTML and `enhance.js` to
2.3 KB gzipped, for the country switch. `tests/evidence.test.mjs` recomputes
every displayed figure from the data. Changing a figure means archiving its
source first — slower, on purpose.

**Alternatives rejected.** Typing figures into copy (they drift from their
sources). Fetching data at runtime (it would need a `connect-src` origin, and
figures would change without review). `Dataset` structured data (the page is not
a dataset distribution; see rule 5).

---

## ADR-016 — Rank only by a recent comparable measure; no composite index

**Context.** The brief suggested a Financial Management Burden Index built from
time, money, complexity and literacy — and, in the same breath, not to build one
unless comparable data exists across countries. Countries were to be ranked by
burden, never by population, with the measure always named.

**Decision.** Countries are ranked only by a single measure that was asked
identically in every listed country and meets the recency rule (ADR-017). The
page names the measure, source and year; India is listed first as Trove's
primary market but shows its true rank. There is no composite.

Today no measure qualifies, so **nothing is ranked**. The global section says so
and shows each country's recent national figures on their own.

**Rationale.** An earlier version ranked all ten countries by Findex 2021
fragility and the S&P 2014 literacy gap. Both fell to the recency rule. Among
recent sources, the 2024 Findex fragility and worry questions are blank for every
high-income country listed, and time-use surveys are not comparable: India's
diary drops activities under 10 minutes when a half-hour slot holds several, and
the US series is rounded to 0.01 hours, so India's 0.14 and the US's 1.8 minutes
a day differ mostly by method. Money has no comparable source at all. A ranking
or composite built from this would present gaps as precision.

**Consequences.** The global section is thin: India and the United States only.
Time figures appear per country, tagged "not comparable", and never rank.

**Revisit** when a recent measure covers every listed country with one
instrument. The ranking code, the "Ranked by" label and the switch between
measures are still in place and appear automatically once the data does.

---

## ADR-017 — Only data collected and published in 2024 or later

**Context.** The first release used the best-verified sources, several of them
old: S&P Global FinLit (2014), Findex (2021) and NCFE-FLIS (2019). Dev asked for
recent data only, and for nothing to be shown where recent data does not exist.

**Decision.** Every metric must be collected, and every source published, in
2024 or later; so must every population a figure is multiplied by.
`MINIMUM_DATA_YEAR` in `src/content/evidence/index.js` sets the year once, and
`recencyProblems()` fails the build otherwise. Older studies are removed from
the content, not hidden.

**Consequences.** India keeps its time, fragility and worry figures (2024), gains
SEBI 2025 figures on investor knowledge and barriers, and loses its national
literacy rate. Eight of the ten researched countries drop off the page, and the
country ranking disappears (ADR-016). The old source files remain in
`docs/impact-research/raw/`, marked "not used", as a research record.
