# Metrics

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

What is measured about the site, the values at a dated moment, and what is not
measured. The principle is to measure outcomes, not vanity
([PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md)). Any figure quoted anywhere must
carry its measurement period and definition, so each value below says how and when it
was taken. No target has been set for any outcome ([PRODUCT.md](../02_PRODUCT/PRODUCT.md),
"Success"); the site-quality budgets are targets and are enforced on every change.

## Snapshot, 2026-09-20

| Measure | Value | How it was taken | Budget or target |
| --- | --- | --- | --- |
| Lighthouse scores, all ten routes | Performance 1.0, accessibility 1.0, best practices 1.0, SEO 1.0 | Lighthouse 13.5.0, mobile emulation, one run per route, on the developer's machine. CI is the authority: it runs on a GitHub-hosted runner and the baseline in [PERFORMANCE.md](../05_ENGINEERING/PERFORMANCE/PERFORMANCE.md) was taken there | Performance at least 0.95; no failing accessibility, best-practice or SEO audit |
| First Contentful Paint | 1.21 to 1.23 s | As above | At most 1.8 s |
| Largest Contentful Paint | 1.36 to 1.53 s | As above | At most 2.5 s |
| Total Blocking Time | 0 ms | As above | At most 200 ms |
| Cumulative Layout Shift | 0.000 | As above | At most 0.1 |
| JavaScript shipped | 2.2 KB gzipped, one file | Gzip of the built file | 4 KB, two files |
| CSS shipped | 7.8 KB gzipped | Gzip of the built file | 10 KB |
| Largest page | `/trove`, 10.9 KB gzipped | Gzip of the built HTML | 16 KB per page |
| Tests | 164 across 11 suites, all passing | `npm test` | All pass |

## Measured over time

| Measure | How | State |
| --- | --- | --- |
| Performance, accessibility, best-practice and SEO scores; Core Web Vitals | Lighthouse in CI on every pull request | Measured on every pull request |
| Page weight | Byte budgets in `npm test` | Measured on every test run |
| Availability | The scheduled health check ([OBSERVABILITY.md](../06_OPERATIONS/OBSERVABILITY.md)) | Part of pull request #11, so it has no history yet; every three hours once merged |
| Subscriber-backup freshness | `npm run backup:check` on the maintainer's computer ([BACKUPS.md](../06_OPERATIONS/BACKUPS.md)) | Measured only when someone runs it. One backup of production exists, from 2026-09-20 |
| Documentation kept in step with the code | `test:docs-sync` and the `docs-impact` check ([ADR-023](../08_DECISIONS/ENGINEERING/ADR-023-documentation-follows-every-change-enforced-in-ci.md)) | Enforced on every pull request |

## Not measured

| Measure | State |
| --- | --- |
| Page views and visitors | **Not measured.** `CF_ANALYTICS_TOKEN` is empty, so no analytics beacon is injected |
| Conversion, retention, traffic sources | **Not measured** |
| Early-access signups | Countable by hand, not tracked over time, and **deliberately not recorded in this repository**: the repository is becoming public, and a subscriber count is a business disclosure the maintainer has not chosen to make. The count is one command ([RESTORE-SUBSCRIBERS.md](../06_OPERATIONS/RUNBOOKS/RESTORE-SUBSCRIBERS.md), step 5). Say so if it should be recorded here |
