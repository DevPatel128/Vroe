# GROWTH.md

No go-to-market plan, revenue model or market claim is decided. This file holds what is real today and says plainly what is open. A pitch with traction, market size or a business model for products that have not shipped would break rule 1 (never claim a product is available).

- **ICP:** UNKNOWN. The target user in `PRODUCT.md` is an assumption.
- **Positioning (one line):** a small product studio with strong taste, building Trove and Vero, honest about where each stands.
- **Pillars:** problem (the sourced evidence on `/trove`) · point of view (the two notes). Education and proof: none yet.
- **Cadence:** none. No social profiles (the LinkedIn link stays empty until the company page exists), no paid acquisition, partnerships or campaigns.
- **Keeping in touch:** the early-access form is the only channel, single opt-in. Nothing in this repository sends email.
- **Revenue:** none. No pricing, no payment path, no `offers`. Infrastructure $0 a month plus the domain fee.
- **Deck gate:** 30 days of data and 100 signups, or first revenue. Status: not met. Signup counts are deliberately not recorded in this public repository.
- **Open decisions (maintainer's):** first users, channels, whether to turn on Web Analytics, monetisation, what "early access" entitles someone to (today: an email and nothing else).

## Channel metrics (monthly)
Not measured. `CF_ANALYTICS_TOKEN` is empty, so no analytics beacon exists. Conversion, retention and traffic sources are not measured.

| Month | Channel | Qualified visits | Signups | Activated | Notes |
|---|---|---|---|---|---|

## Site-quality snapshot, 2026-09-20
Lighthouse 13.5.0, mobile, one run per route on the developer's machine (CI is the authority): performance, accessibility, best practices and SEO all 1.0 on all ten routes; FCP 1.21 to 1.23 s; LCP 1.36 to 1.53 s; TBT 0 ms; CLS 0.000. JavaScript 2.2 KB gzipped; CSS 7.8 KB; largest page `/trove` 10.9 KB gzipped. Tests: 164 across 11 suites. CI baseline (GitHub runner, 2026-09-19, median of three, six timed pages): score 1.0, FCP 1.26 to 1.29 s, LCP 1.26 to 1.58 s, TBT 0 ms, CLS at most 0.003.

## SEO / AEO page log
Every page: unique title (≤70 chars) and description (50 to 175 chars) from `code/src/content/routes.js`, one `h1`, canonical on `https://vroelabs.com`, full Open Graph and Twitter `summary_large_image`, `<html lang="en">`. `SITE_URL` in `src/content/site.js` is the only place the domain is written. Never add `aggregateRating`, `review`, `offers`, `award` or interaction counts. `robots.txt` allows everything except `/api/` and names the sitemap. Indexed status is UNKNOWN for every page: Search Console is not verified (`RUNBOOK.md`).

| Page | Intent / query | Schema | Indexed | AI-cited (ChatGPT / Claude / Perplexity) |
|---|---|---|---|---|
| `/` (priority 1.0) | product studio, useful digital products, human-centered technology | Organization, WebSite, WebPage | UNKNOWN | UNKNOWN |
| `/products` | the index of what Vroe Labs is making | WebPage, Organization, BreadcrumbList (from `code/scripts/prerender.entry.jsx`) | UNKNOWN | UNKNOWN |
| `/trove` (0.9) | personal finance app, spending, budgets, subscription tracking, goals, investments, multi-currency, financial clarity, manual control, privacy | WebPage, SoftwareApplication (no `offers`), BreadcrumbList | UNKNOWN | UNKNOWN |
| `/vero` (0.9) | verified work history, proof of work, portable reputation, freelancer trust | WebPage, Organization, BreadcrumbList | UNKNOWN | UNKNOWN |
| `/notes/trove` (0.7) | personal finance spreadsheet, financial clarity, money visibility | WebPage, Article, BreadcrumbList | UNKNOWN | UNKNOWN |
| `/notes/vero` (0.7) | proof of work, portable reputation, freelancer trust | WebPage, Article, BreadcrumbList | UNKNOWN | UNKNOWN |
| `/about` (0.8) | product studio, why the studio exists | WebPage, Organization, BreadcrumbList | UNKNOWN | UNKNOWN |
| `/contact` (0.6) | contact Vroe Labs | ContactPage, Organization, BreadcrumbList | UNKNOWN | UNKNOWN |
| `/privacy`, `/terms` (0.3) | privacy policy, terms of use | WebPage, BreadcrumbList | UNKNOWN | UNKNOWN |
| `/404` | none: `noindex, follow`, not in the sitemap | none | n/a | n/a |

Pending external checks: Search Console verification and indexing, Rich Results Test on the product and note pages, PageSpeed Insights, W3C validator, real-device check, field Core Web Vitals once there is traffic, Bing Webmaster Tools.

## AI citation check (10 fixed buyer questions, monthly)
Not set up. The questions are UNKNOWN until the ICP is.

## Investor pipeline
None recorded. Investor facts the repository can stand behind: two products, neither shipped; the site live since 2026-09-01; sourced problem evidence for India and the United States; $0 infrastructure. Risks: no shipped product, no traction data, one maintainer, and the list lives in one Cloudflare account with its backup on one computer.

| Name | Intro path | Stage | Next step | Date |
|---|---|---|---|---|
