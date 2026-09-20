# ADR-021 — Performance and accessibility budgets: bytes in the tests, Lighthouse in CI

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-19

**Status.** Approved.

**Context.** The engineering framework asks for performance to be measured
where it matters (section 13). This repository's docs claimed "Lighthouse
budgets in CI" that did not exist; Lighthouse was only ever an unchecked item
on a manual checklist.

**Decision.** Two layers.

1. `tests/performance.test.mjs`, part of `npm test`: budgets for gzipped
   JavaScript, CSS and each HTML page, and for fonts and each image. It runs
   in CI and again before every deploy.
2. A CI job, `performance`, running Lighthouse 13.5.0 from its own dependency
   tree in `code/perf/`. Median of three runs on six pages, mobile emulation.
   It asserts a performance score of 0.95 or more, Google's "good" thresholds
   for FCP, LCP, TBT and CLS, and that no accessibility, best-practice or SEO
   audit fails except those listed in `KNOWN_ISSUES` in `perf/run.mjs`.

**Why.** Bytes are deterministic and catch the change of kind that matters
most for this architecture, a framework or library arriving in the bundle
(ADR-001); a test that injects a 60 KB script confirms it does. Timing needs a
browser. Asserting audit by audit, not on a category score, means a new failure
cannot hide behind an old one.

**Cost.** One new dependency, `lighthouse` 13.5.0, pinned exactly: 114 packages
in `perf/package-lock.json`, installed only by the `performance` job and never
by the app or the deploy job. 18 Lighthouse runs take about three minutes locally
and about four on a GitHub runner, where the whole job took 4 minutes 25 seconds on
its first run. Ongoing: a monthly Dependabot
entry for `perf/`, and the `KNOWN_ISSUES` list. Cheaper alternatives: the byte
test alone costs nothing but sees neither render timing nor accessibility. Not
chosen: `@lhci/cli`, last published June 2025, bundling Lighthouse 12 and
pulling about 250 packages, over four times this app's whole tree; adding
Lighthouse to the app's `devDependencies`, which would put it in the deploy
job that holds the Cloudflare token; and an unpinned `npx lighthouse` in the
workflow, which runs unlocked transitive dependencies on the runner.

**Consequences.** Baseline, measured locally and then on GitHub's runner with Lighthouse 13.5.0
(the two agreed closely): performance 1.0, FCP about 1.3 s, LCP 1.3 to 1.6 s, TBT
0 ms, CLS at most 0.003 on every page. It also found two
real, pre-existing accessibility problems: insufficient colour contrast in the
product illustrations (four pages) and skipped heading levels on `/products`.
They are recorded in `KNOWN_ISSUES` rather than fixed here, because fixing
contrast changes the visual design. The `performance` job is not a required
check to begin with, because timing metrics can vary on shared runners;
promote it once it has shown it does not flake.

**Revisit when.** The job flakes, the known issues are fixed (empty the list),
or the repository goes public and free minutes allow more runs.

**Approved by.** Dev — **Date.** 2026-09-19.
