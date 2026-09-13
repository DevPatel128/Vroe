/**
 * Country observations — the only place in the evidence layer where a figure is
 * typed by hand.
 *
 * Each value is copied exactly as its source publishes it, with a locator saying
 * where: a page and table for a report, a column for a data file. Findex shares
 * stay as the fractions in GlobalFindexDatabase2025.csv; metrics.js turns them
 * into percentages, and derive.js computes every total from here.
 *
 * WHICH COUNTRIES. Only countries with data collected and published in 2024 or
 * later appear. Ten countries were researched; for eight of them the only
 * burden measures we could verify were older (S&P FinLit 2014, Findex 2021), so
 * they are not shown at all rather than shown with stale figures.
 *
 * Adult populations are Findex's own `pop_adult` column for the survey year, so a
 * share and the population it is multiplied by come from the same database.
 */

const VERIFIED = "2026-09-13";

const FINDEX_FILE = "GlobalFindexDatabase2025.csv";

const adults = (year, value) => ({
  ageBand: "15+",
  year,
  value,
  sourceId: "findex-2025",
  sourceLocator: `${FINDEX_FILE}, pop_adult, ${year}`,
});

const TUS_RESULTS = "docs/impact-research/derived/tus2024-household-finance-time.json";

export const COUNTRIES = [
  {
    iso: "IN",
    name: "India",
    populations: [adults(2024, 1077731602)],
    observations: [
      {
        metric: "time-finance-tus2024",
        value: 0.138,
        sourceLocator: `Computed from the person file: ${TUS_RESULTS}, age_15plus, finance_351_352_B`,
        confidence: "high",
        lastVerified: VERIFIED,
      },
      {
        metric: "time-finance-participants-tus2024",
        value: 38.3,
        sourceLocator: `Computed from the person file: ${TUS_RESULTS}, age_15plus, finance_351_352_B`,
        confidence: "high",
        lastVerified: VERIFIED,
      },
      {
        metric: "participation-finance-tus2024",
        value: 0.36,
        sourceLocator: `Computed from the person file: ${TUS_RESULTS}, finance_351_352_B`,
        confidence: "high",
        lastVerified: VERIFIED,
        breakdowns: [
          { group: "Ages 15–24", value: 0.15 },
          { group: "Ages 25 and over", value: 0.42 },
          { group: "Men 15–59", value: 0.46 },
          { group: "Women 15–59", value: 0.22 },
        ],
      },
      {
        metric: "fragility-findex2024",
        inputs: { notPossible: 0.048162454234269673, veryDifficult: 0.650398290895633 },
        sourceLocator: `${FINDEX_FILE}, fin24aN and fin24aVD, 2024, all adults`,
        confidence: "high",
        lastVerified: VERIFIED,
      },
      {
        metric: "worry-bills-findex2024",
        inputs: { share: 0.33722106611648 },
        sourceLocator: `${FINDEX_FILE}, fin45d, 2024, all adults`,
        confidence: "high",
        lastVerified: VERIFIED,
      },
      {
        metric: "knowledge-sebi2025",
        value: 36,
        sourceLocator: "Box 5, “India’s Investor Knowledge Quotient”, p. 35",
        confidence: "high",
        lastVerified: "2026-09-14",
      },
      {
        metric: "barrier-complexity-sebi2025",
        value: 74,
        sourceLocator: "Chapter 7 key findings and Table 7.1, pp. 43–44",
        confidence: "high",
        lastVerified: "2026-09-14",
      },
      {
        metric: "awareness-sebi2025",
        value: 63,
        sourceLocator: "Chapter 4, key findings, p. 23",
        confidence: "high",
        lastVerified: VERIFIED,
      },
      {
        metric: "participation-sebi2025",
        value: 9.5,
        sourceLocator: "Key findings, p. 32",
        confidence: "high",
        lastVerified: VERIFIED,
      },
      {
        metric: "finfluencer-decisions-sebi2025",
        value: 62,
        sourceLocator: "“Finfluencers: Reach, Trust, and Impact”, p. 62",
        confidence: "high",
        lastVerified: VERIFIED,
      },
      {
        metric: "folios-amfi2026",
        value: 283519085,
        sourceLocator: "Grand Total row, p. 1",
        confidence: "high",
        lastVerified: VERIFIED,
      },
    ],
  },

  {
    iso: "US",
    name: "United States",
    populations: [adults(2024, 275987833)],
    observations: [
      {
        metric: "time-finance-atus2025",
        inputs: { hoursPerDay: 0.03 },
        sourceLocator: "BLS Public Data API, series TUU10101AA01048669, annual 2025",
        confidence: "medium",
        lastVerified: VERIFIED,
        populationYear: 2024,
        populationYearNote: "The ATUS figure is for 2025; the most recent Findex adult population is for 2024.",
      },
    ],
  },
];
