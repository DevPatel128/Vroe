# Go to market

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

**No go-to-market plan is decided or recorded.** What follows is only what the code
actually does today for getting the site found and for keeping in touch.

## How the site can be found

| Route | State |
| --- | --- |
| Search engines | Built: unique titles and descriptions, canonical URLs, structured data with no invented offers or ratings, a sitemap and `robots.txt` ([SEO.md](../05_ENGINEERING/ARCHITECTURE/SEO.md)). **Search Console is not verified**, so nothing reports how the site appears in search ([PRODUCTION-CHECKLIST.md](../06_OPERATIONS/RUNBOOKS/PRODUCTION-CHECKLIST.md), item 8) |
| Link previews | Built: Open Graph and Twitter tags on every page, with three social card images |
| Two notes | Published, one per product: the thinking behind each |
| Direct links | Nothing to configure |
| Social profiles | The LinkedIn link is empty until the company page exists, so the footer shows none |
| Paid acquisition, partnerships, campaigns | None configured |

## How interested people are kept in touch

The early-access form, with explicit consent, is the only channel: a person who joins
is told when there is news. It is single opt-in, a known limitation
([PRODUCTION-CHECKLIST.md](../06_OPERATIONS/RUNBOOKS/PRODUCTION-CHECKLIST.md)). Nothing in
this repository sends email, and no mailing service holds the list
([DATA.md](../05_ENGINEERING/DATA/DATA.md)).

## Open decisions

For the maintainer: who the first users are meant to be (the target user in
[PRODUCT.md](../02_PRODUCT/PRODUCT.md) is an assumption), which channels to pursue, and
whether to turn on Web Analytics so any of it can be measured
([METRICS.md](METRICS.md)). Each goes here, with its date, when decided.
