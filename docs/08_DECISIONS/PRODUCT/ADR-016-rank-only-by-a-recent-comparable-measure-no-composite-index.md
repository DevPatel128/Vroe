# ADR-016 — Rank only by a recent comparable measure; no composite index

**Status:** Approved · **Last updated:** 2026-09-14 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Product · **Recorded:** 2026-09-14

**Context.** The brief suggested a Financial Management Burden Index built from
time, money, complexity and literacy — and, in the same breath, not to build one
unless comparable data exists across countries. Countries were to be ranked by
burden, never by population, with the measure always named.

**Decision.** Countries are ranked only by a single measure that was asked
identically in every listed country and meets the recency rule (ADR-017). The
page names the measure, source and year; India is listed first as Trove's
primary market but shows its true rank. There is no composite.

Today no measure qualifies, so **nothing is ranked**. The global section says so
and shows each country's recent national figures on their own.

**Rationale.** An earlier version ranked all ten countries by Findex 2021
fragility and the S&P 2014 literacy gap. Both fell to the recency rule. Among
recent sources, the 2024 Findex fragility and worry questions are blank for every
high-income country listed, and time-use surveys are not comparable: India's
diary drops activities under 10 minutes when a half-hour slot holds several, and
the US series is rounded to 0.01 hours, so India's 0.14 and the US's 1.8 minutes
a day differ mostly by method. Money has no comparable source at all. A ranking
or composite built from this would present gaps as precision.

**Consequences.** The global section is thin: India and the United States only.
Time figures appear per country, tagged "not comparable", and never rank.

**Revisit** when a recent measure covers every listed country with one
instrument. The ranking code, the "Ranked by" label and the switch between
measures are still in place and appear automatically once the data does.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
