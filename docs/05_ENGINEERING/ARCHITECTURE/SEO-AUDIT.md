# SEO audit

**Status:** Approved · **Last updated:** 2026-09-04 · **Owner:** Vroe Labs · **Version:** 1.0

**Date:** 1 September 2026 · **Version:** 1.0.0 (initial launch)
**Method:** automated checks in `tests/seo.test.mjs` plus manual inspection of
the built output. External tool verification is pending launch — see the bottom.

## Baseline: what changed

The Codex prototype had **no SEO metadata at all**. No canonical, no Open Graph,
no Twitter card, no structured data, no `robots.txt`, no `sitemap.xml`. It was a
single client-rendered page, so a crawler received `<div id="root"></div>` and
nothing else.

| | Prototype | Now |
| --- | --- | --- |
| Indexable pages | 1 (empty to crawlers) | **9**, fully rendered in HTML |
| Metadata | none | Unique title, description, canonical, OG and Twitter per page |
| Structured data | none | 25 JSON-LD blocks across 9 pages |
| `robots.txt` / `sitemap.xml` | neither | both, generated from the route table |
| JS to first paint | 71 KB gzipped | **1.4 KB gzipped** |
| Images | 5.2 MB | 65 KB for a desktop view |

## Page inventory

| URL | Title | Priority |
| --- | --- | --- |
| `/` | Vroe Labs \| Useful Products, Made Thoughtfully | 1.0 |
| `/trove` | Trove \| A Clearer Way to Understand Your Money | 0.9 |
| `/vero` | Vero \| Verified Proof of Work | 0.9 |
| `/about` | About Vroe Labs \| A Product Studio for Useful Ideas | 0.8 |
| `/notes/trove` | The Spreadsheet Was Telling Us Something \| Vroe Labs | 0.7 |
| `/notes/vero` | What If Proof Travelled With You? \| Vroe Labs | 0.7 |
| `/contact` | Contact Vroe Labs \| Get in Touch | 0.6 |
| `/privacy` | Privacy Policy \| Vroe Labs | 0.3 |
| `/terms` | Terms of Use \| Vroe Labs | 0.3 |

`/404` is `noindex, follow` and excluded from the sitemap.

`/privacy` and `/terms` are included in the sitemap although the original brief's
URL list omitted them. Both are canonical, public and indexable, which is the
rule the brief actually stated. Easy to exclude — one flag in the route table.

## Automated results — 15 checks, all passing

| Check | Result |
| --- | --- |
| Exactly one `<h1>` per page | Pass, 10/10 |
| Title present, unique, ≤70 chars | Pass |
| Description present, unique, 50–175 chars | Pass |
| No vague titles ("Home", "Welcome", "Our Products") | Pass |
| One canonical per indexable page, on the HTTPS production origin | Pass |
| `/404` has no canonical and carries `noindex` | Pass |
| No accidental `noindex` elsewhere | Pass |
| Open Graph complete, image absolute and an OG card (not the logo) | Pass |
| Twitter `summary_large_image` complete | Pass |
| `<html lang="en">` | Pass, 10/10 |
| JSON-LD parses; **no `offers`, `aggregateRating`, `review` or `award`** | Pass, 25 blocks |
| Article dates real, formatted, not in the future | Pass |
| Sitemap valid XML, absolute, no duplicates, no query strings, every URL built | Pass, 9 URLs |
| `robots.txt` allows crawling, names the sitemap, blocks no CSS/JS/font/image | Pass |
| No internal link points at a page that was not built | Pass |
| Every image has `alt`, `width` and `height` | Pass |
| Hero is `fetchpriority="high"` and not lazy; below-fold images lazy | Pass |
| No vague link text ("click here", "read more", "learn more") | Pass |

## Structured data

| Route | Types |
| --- | --- |
| `/` | `Organization`, `WebSite`, `WebPage` |
| `/trove` | `WebPage`, `SoftwareApplication`, `BreadcrumbList` |
| `/vero` | `WebPage`, `Organization`, `BreadcrumbList` |
| `/notes/*` | `WebPage`, `Article`, `BreadcrumbList` |
| `/about`, `/contact` | `WebPage`/`ContactPage`, `Organization`, `BreadcrumbList` |
| `/privacy`, `/terms` | `WebPage`, `BreadcrumbList` |

**Trove's `SoftwareApplication` carries no `offers` block.** The brief specified
a free Offer at 0 INR, written when Trove was assumed live. It has not shipped,
and an offer asserts present availability and pricing — a false claim under both
Google's structured-data policy and the brand guide. Add it the day Trove ships.

Nothing anywhere claims ratings, reviews, downloads, users, revenue or awards.

## Performance

Measured from the build output. A first desktop visit to `/`:

| Resource | Transferred |
| --- | --- |
| HTML (gzip) | 6.7 KB |
| CSS (gzip) | 5.8 KB |
| JS (gzip) | **1.4 KB** |
| Hero image (AVIF, 1586w) | 32.0 KB |
| Vero image (AVIF, 800w) | 31.2 KB |
| Beliefs image (AVIF, 300w) | 1.7 KB |
| 2 preloaded fonts (woff2) | 35.2 KB |
| **Total** | **≈111 KB** |

The prototype's images alone were 5.2 MB, and its JavaScript was 71 KB gzipped.

Core Web Vitals measures taken:

- **LCP** — the hero is a real `<img>` with `srcset` and `fetchpriority="high"`,
  discoverable by the preload scanner in the raw HTML. The prototype used a CSS
  `background-image`, which is not.
- **CLS** — every image carries explicit `width` and `height` from the build
  manifest, so boxes are reserved before bytes arrive. Fonts are preloaded with
  `font-display: swap`.
- **INP** — there is 1.4 KB of JavaScript and no hydration, so there is almost
  nothing that can block the main thread. Turnstile loads only on first
  interaction with the form.

## Content and keywords

Keyword mapping is in [docs/05-seo.md](SEO.md). Terms appear naturally in
headings, body copy, alt text and anchors; there is no stuffing.

Both products are labelled as unreleased on every page that mentions them, and
each product page carries an explicit "Where this stands" statement. Vero's page
names the four systems that do **not** exist (escrow, payments, disputes, public
profiles) rather than leaving them ambiguous.

## Pending external verification

To run against production after launch, and record here:

- [ ] Google Search Console — verify the domain property, submit the sitemap,
      inspect all 9 URLs ([SEARCH_CONSOLE_SETUP.md](../../06_OPERATIONS/RUNBOOKS/SEARCH-CONSOLE.md))
- [ ] Google Rich Results Test on `/trove`, `/vero`, `/notes/trove`, `/notes/vero`
- [ ] Lighthouse and PageSpeed Insights, mobile and desktop
- [ ] W3C HTML validator on all 9 pages
- [ ] Real-device mobile check
- [ ] Field Core Web Vitals once there is traffic

**Sitemap submission does not guarantee indexing.** Google decides what to index
and when. These checks confirm the site is technically ready to be crawled and
understood; they do not promise rankings.

## Follow-ups

1. Set `CF_ANALYTICS_TOKEN` after creating the Cloudflare Web Analytics site.
2. Replace the placeholder LinkedIn URL and add it to `Organization.sameAs`,
   which is currently an empty array because there is no verified profile.
3. Re-run this audit when Trove ships — status, links and the `offers` block all
   change together.
