# ADR-015 — An evidence layer where research and product impact never mix

**Status:** Approved · **Last updated:** 2026-09-14 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Product · **Recorded:** 2026-09-14

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

Raw source files live in `docs/03_RESEARCH/impact-research/raw/` (gitignored for size), with
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

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
