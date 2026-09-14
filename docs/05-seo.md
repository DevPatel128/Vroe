# SEO

## One domain value

`SITE_URL` in `src/content/site.js` is the only place the production origin is
written. Canonicals, Open Graph URLs, the sitemap, robots.txt and every JSON-LD
block derive from it. Repointing the site at a new domain is a one-line change.

## Per-page metadata

`src/seo/SeoHead.jsx` renders into the prerendered `<head>`, so a crawler sees
the finished tags in the first response — no JavaScript execution required.

Every indexable page carries: a unique `<title>` (≤70 chars), a unique meta
description (50–175 chars), exactly one `<h1>`, a canonical on the HTTPS
production origin, the full Open Graph set with an absolute `og:image`, the
Twitter `summary_large_image` set, and `<html lang="en">`.

`/404` is the exception: `noindex, follow`, no canonical, excluded from the
sitemap. `npm run test:seo` asserts all of the above, including uniqueness.

Titles and descriptions live in `src/content/routes.js`. See
[03-content.md](03-content.md) for the one deviation from the supplied brief.

## Structured data

Built by `src/seo/JsonLd.jsx` from the same content modules the page renders
from, so the two cannot drift apart.

| Route | Types |
| --- | --- |
| `/` | `Organization`, `WebSite`, `WebPage` |
| `/trove` | `WebPage`, `SoftwareApplication` (no `offers`), `BreadcrumbList` |
| `/vero` | `WebPage`, `Organization`, `BreadcrumbList` |
| `/notes/*` | `WebPage`, `Article`, `BreadcrumbList` |
| `/about`, `/contact` | `WebPage` / `ContactPage`, `Organization`, `BreadcrumbList` |
| `/privacy`, `/terms` | `WebPage`, `BreadcrumbList` |

**Never add** `aggregateRating`, `ratingValue`, `reviewCount`, `review`,
`offers`, `award`, or any interaction statistic. Nothing on the site supports
them, and the test suite fails if any appear.

`BreadcrumbList` is generated from the same `trail` array the visible
`Breadcrumbs` component renders, so the structured data can never describe a
trail the page does not show.

`Article` carries headline, description, image, `datePublished`, `dateModified`,
publisher, `mainEntityOfPage`, `articleSection` and a computed `wordCount`. The
dates are real — see [03-content.md](03-content.md).

The JSON-LD is the only place this codebase writes a raw string into HTML, so it
is escaped: `<` → `<` (a `</script>` in content could otherwise close the
block early), plus U+2028/U+2029, which are literal line terminators in JS.

## Open Graph images

Three 1200×630 JPEGs at `/assets/og-{vroe-labs,trove,vero}.jpg`, ~40 KB each.
Each is the still-life artwork over Sky with the headline in Instrument Serif —
not the logo, which makes a poor social card. Regenerate with
`npm run build:og`; see ADR-005 for why the text is rendered as vector outlines.

## Touch icon

`/apple-touch-icon.png` is 180×180: the Vroe Labs wordmark in ink on paper, with
no alpha channel. Safari uses it for Favourites, Add to Dock and the iOS home
screen, none of which read `favicon.svg`. Without it Safari draws a tile with the
letter "V". Regenerate with `npm run build:icons`.

Safari caches touch icons for a long time. To see a new icon on a Mac, remove
the favourite and add it again.

## Sitemap and robots

Both are generated from the route table by `scripts/generate-sitemap.mjs`, so a
new page joins the sitemap automatically and the sitemap can never list a URL
that was not built — a test asserts every `<loc>` has a corresponding file.

Nine indexable URLs. No query strings, no duplicates, no `www` variants, no
`/404`. `robots.txt` allows everything except `/api/` (a crawl-budget courtesy,
not a security control — access control lives in the worker) and points at the
sitemap. CSS, JS, fonts and images stay crawlable; blocking them would stop
Google rendering the page as a visitor sees it, and a test enforces that.

## Internal linking

Descriptive anchors only. "Click here", "read more", "learn more", "here" and
"more" all fail `npm run test:seo`.

```
/  ──┬─→ /trove ──┬─→ /notes/trove ──→ /trove, /notes/vero
     │            └─→ /vero
     ├─→ /vero  ──┬─→ /notes/vero  ──→ /vero, /notes/trove
     │            └─→ /trove
     ├─→ /notes/trove, /notes/vero
     └─→ /about ──→ /trove, /vero, /notes/*, /contact
Footer (every page) → /trove /vero /about /contact /privacy /terms
```

A test walks every internal `href` in the built output and fails if it points at
a page that was not built.

## Keyword mapping

Placed naturally in headings, body copy, alt text and anchors — never stuffed.

| Page | Terms it genuinely covers |
| --- | --- |
| `/` | product studio, useful digital products, human-centered technology |
| `/trove` | personal finance app, spending, budgets, subscription tracking, goals, investments, multi-currency, financial clarity, manual control, privacy |
| `/vero` | verified work history, proof of work, portable reputation, freelancer trust, workers and businesses, completed work |
| `/notes/trove` | personal finance spreadsheet, financial clarity, money visibility |
| `/notes/vero` | proof of work, portable reputation, freelancer trust |
| `/about` | product studio, human-centered technology, why the studio exists |

## Verification

```bash
npm run test:seo
```

Then, on the deployed site: Google Rich Results Test, Search Console URL
Inspection, Lighthouse, PageSpeed Insights. See
[SEARCH_CONSOLE_SETUP.md](SEARCH_CONSOLE_SETUP.md) and
[SEO_AUDIT.md](SEO_AUDIT.md).
