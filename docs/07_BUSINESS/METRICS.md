# Metrics

**Status:** Draft · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

What is measured about the site today, and what is not. The principle is to measure
outcomes, not vanity ([PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md)); with no
target set ([PRODUCT.md](../02_PRODUCT/PRODUCT.md), "Success"), none of these is a
target.

| Measure | How | State |
| --- | --- | --- |
| Performance, accessibility, best-practice and SEO scores; Core Web Vitals | Lighthouse in CI ([PERFORMANCE.md](../05_ENGINEERING/PERFORMANCE/PERFORMANCE.md)) | Measured on every pull request |
| Page weight | Byte budgets in `npm test` | Measured on every test run |
| Availability | The scheduled health check ([OBSERVABILITY.md](../06_OPERATIONS/OBSERVABILITY.md)) | Measured every three hours |
| Early-access signups | Read from the `SUBSCRIBERS` KV namespace by hand ([SUBSCRIBER-LIST.md](../06_OPERATIONS/RUNBOOKS/SUBSCRIBER-LIST.md)) | Countable, not tracked over time |
| Page views and visitors | Cloudflare Web Analytics | **Not measured.** `CF_ANALYTICS_TOKEN` is empty, so no beacon is injected |
| Conversion, retention, traffic sources | — | **Not measured** |

Any figure quoted anywhere must carry its measurement period and definition.
