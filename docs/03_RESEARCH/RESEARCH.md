# Evidence layer

**Status:** Approved · **Last updated:** 2026-10-09 · **Owner:** Vroe Labs · **Version:** 1.0

How `/trove` measures the problem Trove is being built for, and the rules that
keep those numbers honest. Source files and the reproducible computation are in
[impact-research/](impact-research/README.md).

## The method

Every Vroe product is told in the same order:

```
PROBLEM → EVIDENCE → RESOURCE COST → PRODUCT RESPONSE → MEASURED IMPACT
```

The first four come from external research. **Measured impact comes only from a
product's own data**, and stays empty until that data exists. The two are never
merged: research lives in `countries.js` with `origin: "external"`; impact lives
in a story's `impact` array with `origin: "product"`, `measuredBy` and `updated`.
Validation rejects anything else.

**Maturity gate.** A product gets the layer by having an entry in
`EVIDENCE` (`code/src/content/evidence/index.js`). Trove has one. Vero does not,
so `/vero` renders no evidence at all. A future product adds a story module
shaped like `trove.js`, over the same sources, metrics and countries.

## Recency: 2024 or later, or nothing

Every figure must be **collected in 2024 or later and published in 2024 or
later** (`MINIMUM_DATA_YEAR` in `index.js`). An older study is removed from the
content entirely — not hidden, not footnoted — even when it is the best-known
source on the subject. Where no recent source exists, the page shows nothing
for it. `recencyProblems()` fails the build if an older metric, source or
population is reintroduced. ADR-017.

This removed S&P Global FinLit 2014, the Findex 2021 wave and NCFE-FLIS 2019,
and with them eight of the ten researched countries, which had no recent
verified burden measure.

## Where things live

All paths inside `code/src/content/evidence/`.

| File | Holds | Rule |
| --- | --- | --- |
| `sources.js` | One record per study: publisher, year, fieldwork, URL, coverage, population, sample, method, tier, last verified | Published 2024+; news is never a source |
| `metrics.js` | One record per question asked one way | Collected 2024+; two instruments for one idea are two metrics |
| `countries.js` | Raw figures, exactly as published, with a locator | The **only** place a figure is typed |
| `derive.js` | Calculations, aggregates, rankings, formatting, validation | Nothing derived is ever typed |
| `trove.js` | The words around the figures | **No numbers**; items point at metrics |
| `index.js` | Method stages, the recency year, the `EVIDENCE` registry, story validation | |

Components in `code/src/components/evidence/` render from these. The
prerenderer calls `evidenceProblems()` and **fails the build** if any figure lacks
a source, is too old, cannot be calculated, or a story points at missing data.

## Data integrity

`resolve(iso, metric)` returns, for any figure on the page: country, metric,
value, unit, population, year, source, source URL, locator, methodology,
calculation (formula and inputs), last verified, confidence, and comparability
notes. Every displayed figure carries `data-evidence-id` and `data-source-id`,
and `tests/evidence.test.mjs` recomputes each one from the data.

- **Calculated metrics** (Findex shares, ATUS hours to minutes) store the
  published inputs; the value is computed. A typed value fails validation.
- **Aggregates** multiply by a population with the **same age band and year**.
  A different year needs `populationYear` and a written `populationYearNote`.
- **Confidence.** Headline figures must be `high`. `medium` is shown with a
  label. Nothing `low` is displayed.
- **Formatting.** One rule per quantity type (`formatParts`): below 1 → two
  decimals, below 10 → one, otherwise whole; people and hours use three
  significant figures with million/billion. Units are never switched per
  country to make a number look bigger.

## Ranking — none today

A metric can rank countries only if it is `comparable` (one instrument
everywhere), has a burden direction, and **every listed country has it**.

No 2024+ source meets that bar. The World Bank's 2024 Findex asks the fragility
and worry questions worldwide but does not publish them for most high-income
economies; the other recent sources are national. So the global section ranks
nothing, says why, and shows each country's recent national figures on their
own. The ranking code stays in place: when a recent comparable measure is added
to the data, the ranked list, the "Ranked by" label and the switch between
measures appear automatically, with India first and its true rank beside it.

## Why there is no composite burden index

A composite needs every ingredient measured the same way in every country.
Among recent sources, none is: time-use surveys code activities and record short
tasks differently in each country, and no source was found that measures money
lost to fees, missed savings or avoidable interest comparably. A composite built
anyway would present data gaps as precision. ADR-016.

## Figures on the page

**India**

| Figure | Value | Source (collected) |
| --- | --- | --- |
| Time recorded paying bills and budgeting, per adult per day | 0.138 min | MoSPI TUS (2024), computed |
| Across all adults, per year | ≈ 905 million hours | × 365 ÷ 60 × 1,077,731,602 adults (Findex, 2024) |
| Among adults who did it that day | 38.3 min | MoSPI TUS (2024), computed |
| Adults who did it on an average day | 0.36% (15–24: 0.15%; 25+: 0.42%) | MoSPI TUS (2024), computed |
| Financially fragile | 69.9% ≈ 753 million adults | Findex (2024) |
| Monthly bills are the top financial worry | 33.7% | Findex (2024) |
| Investors with low market knowledge | 64% (36% high or moderate) | SEBI Investor Survey (2025), Box 5 |
| Non-investors held back by complexity or information gaps | 74% | SEBI Investor Survey (2025), ch. 7 |
| Households aware of a market product / invested | 63% / 9.5% | SEBI Investor Survey (2025) |
| Investors acting partly on finfluencer advice | 62% | SEBI Investor Survey (2025) |
| Mutual fund folios | 283,519,085 | AMFI (31 August 2026) |

**United States**

| Figure | Value | Source (collected) |
| --- | --- | --- |
| Time on financial management, per person per day | 1.8 min (0.03 h, ±0.3 min) | BLS ATUS (2025) |
| Across all adults, per year | ≈ 3.0 billion hours | × 275,987,833 adults (Findex, 2024) |

**The India time figure is a floor.** India's diary records an activity sharing a
half-hour slot only if it took 10 minutes or more, so a quick UPI bill payment
usually leaves no trace. The page says so next to the number. It is also why the
India and US time figures are never compared: the difference is mostly method,
not behaviour.

## Adding or updating a figure

1. Confirm the data was collected and published in 2024 or later.
2. Download the primary source into `docs/03_RESEARCH/impact-research/raw/` and add it, with
   URL and SHA-256, to the README there.
3. Add or reuse a source in `sources.js` and a metric in `metrics.js`.
4. Type the raw value in `countries.js` with an exact locator and today's date as
   `lastVerified`.
5. `npm run build && npm test`. The build fails on a validation or recency
   problem; the evidence tests fail if a displayed figure no longer matches its
   computation.

## When Trove has users

Add measured results to `impact` in `trove.js`, each with `origin: "product"`,
`measuredBy` (what produced it) and `updated` (ISO date). They render in the
impact layer only, dated, and never replace the research figures. Update the
"no measured-impact number" test in the same change — it deliberately fails the
day real impact data arrives, so the change is a conscious one.
