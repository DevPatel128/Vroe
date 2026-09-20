# ADR-017 — Only data collected and published in 2024 or later

**Status:** Approved · **Last updated:** 2026-09-14 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Product · **Recorded:** 2026-09-14

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
`docs/03_RESEARCH/impact-research/raw/`, marked "not used", as a research record.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
