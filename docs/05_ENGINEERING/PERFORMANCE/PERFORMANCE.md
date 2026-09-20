# Performance

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

Optimise for actual requirements, in this order: correctness, security,
reliability, then measure, then optimise. Never trade correctness or security for
theoretical speed.

Two layers, because they catch different things.

**Bytes — `tests/performance.test.mjs`, part of `npm test`.** Deterministic, so
it never flakes, and it runs in CI and again before every deploy. Budgets for
gzipped JavaScript (one ~2 KB script; this is what keeps ADR-001 true), CSS, each
HTML page, fonts and each image. Going over is sometimes right: raise the number
in the test and record why as an ADR, so the increase is a decision.

**Timing and audits — `perf/run.mjs`, the CI `performance` job.** Lighthouse, mobile
emulation, on all ten indexable routes (`/404` answers with a 404 status, so the test
suite covers it instead). Six pages get the full treatment, a median of three runs and
every threshold below; the other four (`/about`, `/notes/vero`, `/privacy`, `/terms`) get
one run and only the audits, since their timing follows from the templates already
measured. It fails on a performance score below 0.95, on FCP, LCP, TBT or CLS past
Google's "good" thresholds, and on any failing accessibility, best-practice or SEO audit
that is not listed in `KNOWN_ISSUES` at the top of the file. **That list is empty.** Add
an entry only to record a problem that is understood and consciously deferred, with the
reason; the runner tells you when an entry no longer applies.

Run it yourself:

```bash
cd perf && npm ci && cd ..   # once. Lighthouse has its own dependency tree
npm run build
npm run preview -- --port 8788   # in one terminal
npm run perf                 # in another; needs Chrome (set CHROME_PATH if it isn't found)
```

Lighthouse is installed from `perf/`, not from the app's `package.json`, on
purpose: the deploy job holds the Cloudflare token, and its install should never
include a browser-automation tree of a hundred packages. ADR-021.

## Baseline

Measured on a GitHub-hosted runner on 2026-09-19, against the real Worker, mobile
emulation, median of three runs, the six timed pages: performance score 1.0; First
Contentful Paint 1.26 to 1.29 s; Largest Contentful Paint 1.26 to 1.58 s; Total
Blocking Time 0 ms; Cumulative Layout Shift at most 0.003. The budgets are 1.8 s,
2.5 s, 200 ms and 0.1. The earlier manual measurements (page weight, script size)
are in [SEO-AUDIT.md](../ARCHITECTURE/SEO-AUDIT.md).

What keeps it there is architectural: pre-rendered HTML, one script of about 2 KB,
self-hosted fonts and no third-party requests except the Turnstile bot check
([ARCHITECTURE.md](../ARCHITECTURE/ARCHITECTURE.md)).

Accessibility, best-practice and SEO audits run in the same job; the accessibility
findings are in [ACCESSIBILITY.md](../../04_DESIGN/ACCESSIBILITY.md).
